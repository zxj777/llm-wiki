#!/usr/bin/env tsx
/**
 * tools/search.ts — LLM Wiki 全文搜索
 *
 * 用法: pnpm search <query> [options]
 *
 * 选项:
 *   -t, --type <type>   限定页面类型 (concept|entity|source|comparison|topic)
 *   -n, --max <num>     最多返回 N 个结果（默认 10）
 *   -a, --all           同时搜索 raw/
 *   --titles            只在标题中搜索
 *   --tags              只在 tags 字段中搜索
 *   --json              JSON 格式输出（便于 LLM / CLI 管道）
 */

import fs from "node:fs";
import matter from "gray-matter";
import { collectAllMd } from "./lib.js";

interface SearchResult {
  file: string;
  title: string;
  type: string;
  status: string;
  matches: { line: number; text: string }[];
}

// ── 参数解析 ──

const args = process.argv.slice(2);
let query = "";
let pageType = "";
let maxResults = 10;
let searchRaw = false;
let titleOnly = false;
let tagsOnly = false;
let jsonOutput = false;

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case "-t":
    case "--type":
      pageType = args[++i];
      break;
    case "-n":
    case "--max":
      maxResults = parseInt(args[++i], 10);
      break;
    case "-a":
    case "--all":
      searchRaw = true;
      break;
    case "--titles":
      titleOnly = true;
      break;
    case "--tags":
      tagsOnly = true;
      break;
    case "--json":
      jsonOutput = true;
      break;
    default:
      if (!args[i].startsWith("-")) query = args[i];
  }
}

if (!query) {
  console.error("用法: pnpm search <query> [options]");
  process.exit(1);
}

// ── 收集文件 ──

let files = collectAllMd("wiki");
if (searchRaw) files = files.concat(collectAllMd("raw"));

// 类型过滤
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
    console.error(`未知类型: ${pageType}`);
    process.exit(1);
  }
  files = files.filter((f) => f.includes(`/${subdir}/`));
}

// ── 搜索 ──

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
  for (let i = 0; i < lines.length && matchLines.length < 3; i++) {
    if (lines[i].toLowerCase().includes(queryLower)) {
      matchLines.push({ line: i + 1, text: lines[i].trim() });
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

// ── 输出 ──

if (jsonOutput) {
  console.log(JSON.stringify(results, null, 2));
} else {
  console.log(`🔍 搜索: "${query}"`);
  if (pageType) console.log(`   类型: ${pageType}`);
  if (searchRaw) console.log(`   范围: wiki/ + raw/`);
  console.log("───────────────────────────────");

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    console.log();
    console.log(`[${i + 1}] ${r.file}`);
    console.log(`    标题: ${r.title}`);
    console.log(`    类型: ${r.type} | 状态: ${r.status}`);
    if (r.matches.length > 0) {
      console.log(`    匹配:`);
      for (const m of r.matches) {
        console.log(`      ${m.line}: ${m.text}`);
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
