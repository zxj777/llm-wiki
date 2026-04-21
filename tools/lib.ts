import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const WIKI_DIR = "wiki";
const CONTENT_DIRS = [
  "concepts",
  "entities",
  "sources",
  "comparisons",
  "topics",
];
const LINK_RE = /\[\[([^\]]+)\]\]/g;

export interface PageData {
  path: string;
  id: string;
  frontmatter: Record<string, unknown>;
  content: string;
  links: string[];
}

export interface PageSummary {
  id: string;
  path: string;
  title: string;
  type: string;
  status: string;
  sources: string[];
}

export const REQUIRED_FIELDS = [
  "title",
  "type",
  "created",
  "updated",
  "tags",
  "status",
  "sources",
] as const;

/** 递归收集 wiki/ 下所有 .md 页面（排除 index.md, log.md） */
export function collectPages(wikiDir = WIKI_DIR): string[] {
  const pages: string[] = [];
  function walk(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        pages.push(full);
      }
    }
  }
  for (const sub of CONTENT_DIRS) {
    walk(path.join(wikiDir, sub));
  }
  return pages;
}

/** 从文件路径推导 wiki 内的相对标识（如 concepts/foo） */
export function pageId(filePath: string, wikiDir = WIKI_DIR): string {
  return path.relative(wikiDir, filePath).replace(/\.md$/, "");
}

/** 提取文本中所有 [[link]] 目标 */
function extractLinks(text: string): string[] {
  const links: string[] = [];
  for (const match of text.matchAll(LINK_RE)) {
    const target = match[1].split("|")[0].replace(/\.md$/, "").trim();
    links.push(target);
  }
  return links;
}

/** 解析一个 wiki 页面 */
export function parsePage(filePath: string, wikiDir = WIKI_DIR): PageData {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return {
    path: filePath,
    id: pageId(filePath, wikiDir),
    frontmatter: data,
    content,
    links: extractLinks(raw),
  };
}

export function summarizePage(filePath: string, wikiDir = WIKI_DIR): PageSummary {
  const page = parsePage(filePath, wikiDir);
  return {
    id: page.id,
    path: page.path,
    title: String(page.frontmatter.title ?? "(无标题)"),
    type: String(page.frontmatter.type ?? "unknown"),
    status: String(page.frontmatter.status ?? "unknown"),
    sources: Array.isArray(page.frontmatter.sources)
      ? page.frontmatter.sources.map((source) => String(source))
      : [],
  };
}

/** 解析 index.md 中的所有 [[link]] */
export function parseIndexLinks(wikiDir = WIKI_DIR): string[] {
  const indexPath = path.join(wikiDir, "index.md");
  if (!fs.existsSync(indexPath)) return [];
  const raw = fs.readFileSync(indexPath, "utf-8");
  return extractLinks(raw);
}

/** 递归收集目录下所有 .md 文件 */
export function collectAllMd(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  const walk = (d: string) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith(".")) {
        walk(full);
      } else if (entry.name.endsWith(".md")) {
        files.push(full);
      }
    }
  };
  walk(dir);
  return files;
}

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

export function ensureFile(filePath: string, content: string): void {
  if (!fs.existsSync(filePath)) {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, content, "utf-8");
  }
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[`"'“”‘’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function extractDocumentTitle(filePath: string): string {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  if (typeof data.title === "string" && data.title.trim()) {
    return data.title.trim();
  }

  const heading = content
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("# "));
  if (heading) {
    return heading.replace(/^#\s+/, "").trim();
  }

  return path.basename(filePath, path.extname(filePath));
}

export function listPageSummaries(wikiDir = WIKI_DIR): PageSummary[] {
  return collectPages(wikiDir).map((filePath) => summarizePage(filePath, wikiDir));
}
