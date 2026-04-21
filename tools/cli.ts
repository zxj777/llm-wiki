#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";
import {
  collectAllMd,
  ensureDir,
  ensureFile,
  extractDocumentTitle,
  listPageSummaries,
  pageId,
  slugify,
  summarizePage,
  today,
} from "./lib.js";
import { runLint, printLintResult } from "./lint-lib.js";
import { printSearchResults, searchWiki } from "./search-lib.js";

interface ParsedArgs {
  positionals: string[];
  flags: Map<string, string | boolean>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags = new Map<string, string | boolean>();

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (!arg.startsWith("-")) {
      positionals.push(arg);
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith("-")) {
      flags.set(arg, next);
      index++;
    } else {
      flags.set(arg, true);
    }
  }

  return { positionals, flags };
}

function getFlag(args: ParsedArgs, ...names: string[]): string | boolean | undefined {
  for (const name of names) {
    if (args.flags.has(name)) return args.flags.get(name);
  }
  return undefined;
}

function printHelp(): void {
  console.log(`llm-wiki — unified CLI

Usage:
  pnpm llm-wiki <command> [args]

Commands:
  init [root]                         初始化目录结构
  status                              查看 raw/wiki 当前状态
  lint [wikiDir]                      运行 wiki 健康检查
  search <query> [options]            搜索 wiki / raw
  query <query> [options]             为 agent 提供查询候选上下文
  ingest <raw-file> [--write-stub]    为 raw 文档生成 source stub 或 ingest plan
  export [--format json|markdown]     导出 wiki 页面清单

Examples:
  pnpm llm-wiki status
  pnpm llm-wiki lint
  pnpm llm-wiki search transformer --type concept
  pnpm llm-wiki ingest raw/karpathy.md --write-stub
  pnpm llm-wiki export --format json
`);
}

function defaultIndexTemplate(): string {
  return `# Wiki 索引

> 最后更新: ${today()} | 页面总数: 0

## 主题

## 概念

## 实体

## 来源

## 对比
`;
}

function defaultLogTemplate(): string {
  return `# 操作日志

`;
}

function commandInit(root = "."): void {
  for (const dir of [
    path.join(root, "raw"),
    path.join(root, "raw/assets"),
    path.join(root, "wiki"),
    path.join(root, "wiki/concepts"),
    path.join(root, "wiki/entities"),
    path.join(root, "wiki/sources"),
    path.join(root, "wiki/comparisons"),
    path.join(root, "wiki/topics"),
  ]) {
    ensureDir(dir);
  }

  ensureFile(path.join(root, "wiki/index.md"), defaultIndexTemplate());
  ensureFile(path.join(root, "wiki/log.md"), defaultLogTemplate());

  console.log(`✓ initialized ${path.resolve(root)}`);
}

function commandStatus(): void {
  const rawFiles = collectAllMd("raw").filter((file) => !file.includes("/assets/"));
  const pageSummaries = listPageSummaries("wiki");
  const byType = new Map<string, number>();

  for (const page of pageSummaries) {
    byType.set(page.type, (byType.get(page.type) ?? 0) + 1);
  }

  console.log("LLM Wiki 状态");
  console.log("──────────────");
  console.log(`raw 文档: ${rawFiles.length}`);
  console.log(`wiki 页面: ${pageSummaries.length}`);
  for (const [type, count] of [...byType.entries()].sort()) {
    console.log(`  - ${type}: ${count}`);
  }
}

function commandLint(wikiDir = "wiki"): void {
  const result = runLint(wikiDir);
  printLintResult(result);
  process.exit(result.errors > 0 ? 1 : 0);
}

function commandSearch(args: ParsedArgs, mode: "search" | "query"): void {
  const query = args.positionals[1];
  if (!query) {
    console.error(`用法: pnpm llm-wiki ${mode} <query> [options]`);
    process.exit(1);
  }

  const pageType = String(getFlag(args, "--type", "-t") ?? "");
  const maxValue = getFlag(args, "--max", "-n");
  const maxResults = typeof maxValue === "string" ? parseInt(maxValue, 10) : mode === "query" ? 5 : 10;
  const searchRaw = mode === "query"
    ? !Boolean(getFlag(args, "--wiki-only"))
    : Boolean(getFlag(args, "--all", "-a"));
  const titleOnly = Boolean(getFlag(args, "--titles"));
  const tagsOnly = Boolean(getFlag(args, "--tags"));
  const jsonOutput = Boolean(getFlag(args, "--json"));

  const results = searchWiki({
    query,
    pageType,
    maxResults,
    searchRaw,
    titleOnly,
    tagsOnly,
  });

  if (jsonOutput) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  if (mode === "query") {
    console.log(`🧭 Query context for: "${query}"`);
  }
  printSearchResults(query, results, { pageType, searchRaw });
}

function updateIndexForSource(relativeSourcePath: string, title: string): void {
  const indexPath = path.join("wiki", "index.md");
  const sourceId = pageId(relativeSourcePath, "wiki");
  const line = `- [[${sourceId}]]: ${title} [stub]`;
  let raw = fs.readFileSync(indexPath, "utf-8");
  if (raw.includes(`[[${sourceId}]]`)) return;

  const sourceSection = "## 来源";
  const insertAt = raw.indexOf(sourceSection);
  if (insertAt === -1) {
    raw = `${raw.trimEnd()}\n\n${sourceSection}\n${line}\n`;
    fs.writeFileSync(indexPath, refreshIndexHeader(raw), "utf-8");
    return;
  }

  const sectionStart = raw.indexOf(sourceSection) + sourceSection.length;
  const before = raw.slice(0, sectionStart);
  const after = raw.slice(sectionStart);
  const updated = `${before}\n${line}${after}`;
  fs.writeFileSync(indexPath, refreshIndexHeader(updated), "utf-8");
}

function refreshIndexHeader(raw: string): string {
  const pageCount = collectAllMd("wiki").filter(
    (file) => !file.endsWith("/index.md") && !file.endsWith("/log.md"),
  ).length;

  const headerLine = `> 最后更新: ${today()} | 页面总数: ${pageCount}`;
  if (raw.includes("> 最后更新:")) {
    return raw.replace(/> 最后更新: .* \| 页面总数: \d+/, headerLine);
  }

  const lines = raw.split("\n");
  if (lines[0]?.startsWith("# ")) {
    lines.splice(1, 0, "", headerLine);
    return lines.join("\n");
  }
  return `${headerLine}\n\n${raw}`;
}

function prependLogEntry(entry: string): void {
  const logPath = path.join("wiki", "log.md");
  const raw = fs.readFileSync(logPath, "utf-8");
  const prefix = "# 操作日志";
  if (!raw.startsWith(prefix)) {
    fs.writeFileSync(logPath, `${prefix}\n\n${entry}\n\n${raw}`, "utf-8");
    return;
  }

  const rest = raw.slice(prefix.length).trimStart();
  fs.writeFileSync(logPath, `${prefix}\n\n${entry}\n\n${rest}`.trimEnd() + "\n", "utf-8");
}

function buildSourceStub(rawFile: string, title: string): string {
  const date = today();
  return `---
title: "${title}"
type: source
created: ${date}
updated: ${date}
tags: []
status: stub
sources: [${rawFile}]
---

# ${title}

## 核心论点
- 待补充

## 关键概念
- 待补充

## 摘要
待补充

## 引用片段
> 待补充
`;
}

function commandIngest(args: ParsedArgs): void {
  const rawFile = args.positionals[1];
  if (!rawFile) {
    console.error("用法: pnpm llm-wiki ingest <raw-file> [--write-stub] [--json]");
    process.exit(1);
  }
  if (!fs.existsSync(rawFile)) {
    console.error(`文件不存在: ${rawFile}`);
    process.exit(1);
  }

  const title = extractDocumentTitle(rawFile);
  const basename = path.basename(rawFile, path.extname(rawFile));
  const target = path.join("wiki", "sources", `${basename}.md`);
  const exists = fs.existsSync(target);
  const jsonOutput = Boolean(getFlag(args, "--json"));
  const writeStub = Boolean(getFlag(args, "--write-stub"));

  const plan = {
    rawFile,
    title,
    target,
    exists,
    nextSteps: [
      "Read CLAUDE.md",
      "Create or update source summary page",
      "Update related concept/entity/topic pages",
      "Refresh wiki/index.md and wiki/log.md",
    ],
  };

  if (!writeStub) {
    if (jsonOutput) {
      console.log(JSON.stringify(plan, null, 2));
    } else {
      console.log(`📦 ingest plan for ${rawFile}`);
      console.log(`title:  ${title}`);
      console.log(`target: ${target}`);
      console.log(`exists: ${exists ? "yes" : "no"}`);
      for (const step of plan.nextSteps) {
        console.log(`- ${step}`);
      }
    }
    return;
  }

  if (!exists) {
    ensureDir(path.dirname(target));
    fs.writeFileSync(target, buildSourceStub(rawFile, title), "utf-8");
    updateIndexForSource(target, title);
    prependLogEntry(`## [${today()}] ingest | ${title}
- 源文件: ${rawFile}
- 新建页面: ${target}
- 更新页面: 无
- 新增链接: 无`);
  }

  const summary = summarizePage(target, "wiki");
  if (jsonOutput) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(`✓ source stub ready: ${target}`);
  }
}

function commandExport(args: ParsedArgs): void {
  const format = String(getFlag(args, "--format") ?? "json");
  const summaries = listPageSummaries("wiki");
  if (format === "json") {
    console.log(JSON.stringify(summaries, null, 2));
    return;
  }

  if (format === "markdown") {
    console.log("# Wiki Export\n");
    for (const summary of summaries) {
      console.log(`- [[${summary.id}]] | ${summary.type} | ${summary.status}`);
    }
    return;
  }

  console.error(`不支持的格式: ${format}`);
  process.exit(1);
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const command = args.positionals[0] ?? "help";

  switch (command) {
    case "help":
    case "--help":
    case "-h":
      printHelp();
      return;
    case "init":
      commandInit(args.positionals[1] ?? ".");
      return;
    case "status":
      commandStatus();
      return;
    case "lint":
      commandLint(args.positionals[1] ?? "wiki");
      return;
    case "search":
      commandSearch(args, "search");
      return;
    case "query":
      commandSearch(args, "query");
      return;
    case "ingest":
      commandIngest(args);
      return;
    case "export":
      commandExport(args);
      return;
    default:
      console.error(`未知命令: ${command}`);
      printHelp();
      process.exit(1);
  }
}

main();
