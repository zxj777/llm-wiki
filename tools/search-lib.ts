import fs from "node:fs";
import matter from "gray-matter";
import { collectAllMd } from "./lib.js";

export interface SearchResult {
  file: string;
  title: string;
  type: string;
  status: string;
  matches: { line: number; text: string }[];
}

export interface SearchOptions {
  query: string;
  pageType?: string;
  maxResults?: number;
  searchRaw?: boolean;
  titleOnly?: boolean;
  tagsOnly?: boolean;
}

export function searchWiki(options: SearchOptions): SearchResult[] {
  const {
    query,
    pageType = "",
    maxResults = 10,
    searchRaw = false,
    titleOnly = false,
    tagsOnly = false,
  } = options;

  let files = collectAllMd("wiki");
  if (searchRaw) files = files.concat(collectAllMd("raw"));

  if (pageType) {
    const dirMap: Record<string, string> = {
      concept: "concepts",
      entity: "entities",
      source: "sources",
      comparison: "comparisons",
      topic: "topics",
    };
    const subdir = dirMap[pageType];
    if (!subdir) {
      throw new Error(`未知类型: ${pageType}`);
    }
    files = files.filter((file) => file.includes(`/${subdir}/`));
  }

  const queryLower = query.toLowerCase();
  const results: SearchResult[] = [];

  for (const file of files) {
    if (results.length >= maxResults) break;

    const raw = fs.readFileSync(file, "utf-8");
    const { data: fm } = matter(raw);

    let searchText: string;
    if (titleOnly) {
      searchText = String(fm.title ?? "");
    } else if (tagsOnly) {
      searchText = Array.isArray(fm.tags) ? fm.tags.join(" ") : "";
    } else {
      searchText = raw;
    }

    if (!searchText.toLowerCase().includes(queryLower)) continue;

    const lines = raw.split("\n");
    const matchLines: { line: number; text: string }[] = [];
    for (let index = 0; index < lines.length && matchLines.length < 3; index++) {
      if (lines[index].toLowerCase().includes(queryLower)) {
        matchLines.push({ line: index + 1, text: lines[index].trim() });
      }
    }

    results.push({
      file,
      title: String(fm.title ?? "(无标题)"),
      type: String(fm.type ?? "?"),
      status: String(fm.status ?? "?"),
      matches: matchLines,
    });
  }

  return results;
}

export function printSearchResults(
  query: string,
  results: SearchResult[],
  options: Pick<SearchOptions, "pageType" | "searchRaw">,
): void {
  console.log(`🔍 搜索: "${query}"`);
  if (options.pageType) console.log(`   类型: ${options.pageType}`);
  if (options.searchRaw) console.log("   范围: wiki/ + raw/");
  console.log("───────────────────────────────");

  for (let index = 0; index < results.length; index++) {
    const result = results[index];
    console.log();
    console.log(`[${index + 1}] ${result.file}`);
    console.log(`    标题: ${result.title}`);
    console.log(`    类型: ${result.type} | 状态: ${result.status}`);
    if (result.matches.length > 0) {
      console.log("    匹配:");
      for (const match of result.matches) {
        console.log(`      ${match.line}: ${match.text}`);
      }
    }
  }

  console.log();
  console.log("───────────────────────────────");
  console.log(`共 ${results.length} 个结果`);
  if (results.length === 0) {
    console.log("💡 提示: 尝试更宽泛的关键词，或使用 -a 同时搜索 raw/");
  }
}
