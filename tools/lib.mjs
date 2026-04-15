import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const WIKI_DIR = "wiki";
const CONTENT_DIRS = ["concepts", "entities", "sources", "comparisons", "topics"];
const LINK_RE = /\[\[([^\]]+)\]\]/g;

/**
 * 递归收集 wiki/ 下所有 .md 页面（排除 index.md, log.md）
 */
export function collectPages(wikiDir = WIKI_DIR) {
  const pages = [];
  for (const sub of CONTENT_DIRS) {
    const dir = path.join(wikiDir, sub);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (file.endsWith(".md")) {
        pages.push(path.join(wikiDir, sub, file));
      }
    }
  }
  return pages;
}

/**
 * 解析一个 wiki 页面，返回 frontmatter + 内容 + 链接
 */
export function parsePage(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const links = [];
  for (const match of raw.matchAll(LINK_RE)) {
    let target = match[1].split("|")[0].replace(/\.md$/, "").trim();
    links.push(target);
  }
  return { path: filePath, frontmatter: data, content, links };
}

/**
 * 从文件路径推导 wiki 内的相对标识（如 concepts/foo）
 */
export function pageId(filePath, wikiDir = WIKI_DIR) {
  return path.relative(wikiDir, filePath).replace(/\.md$/, "");
}

/**
 * 解析 index.md 中的所有 [[link]] 引用
 */
export function parseIndexLinks(wikiDir = WIKI_DIR) {
  const indexPath = path.join(wikiDir, "index.md");
  if (!fs.existsSync(indexPath)) return [];
  const raw = fs.readFileSync(indexPath, "utf-8");
  const links = [];
  for (const match of raw.matchAll(LINK_RE)) {
    links.push(match[1].split("|")[0].replace(/\.md$/, "").trim());
  }
  return links;
}

export const REQUIRED_FIELDS = [
  "title",
  "type",
  "created",
  "updated",
  "tags",
  "status",
  "sources",
];
