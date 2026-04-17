#!/usr/bin/env tsx
/**
 * tools/lint.ts — LLM Wiki 健康检查
 *
 * 用法: pnpm lint [wiki_dir]
 *
 * 检查项:
 *   1. 断链（[[link]] 指向不存在的页面）
 *   2. 孤儿页（无任何引用指向的页面）
 *   3. Index 一致性（index.md ↔ 实际文件）
 *   4. Frontmatter 完整性
 *   5. Disputed 页面
 *   6. Stub 页面
 */

import {
  collectPages,
  parsePage,
  parseIndexLinks,
  REQUIRED_FIELDS,
  type PageData,
} from "./lib.js";

const WIKI_DIR = process.argv[2] || "wiki";

const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const NC = "\x1b[0m";

let errors = 0;
let warnings = 0;

function logError(msg: string) {
  console.log(`${RED}✗ ${msg}${NC}`);
  errors++;
}
function logWarn(msg: string) {
  console.log(`${YELLOW}⚠ ${msg}${NC}`);
  warnings++;
}
function logOk(msg: string) {
  console.log(`${GREEN}✓ ${msg}${NC}`);
}

// ── 收集与解析 ──

const pages = collectPages(WIKI_DIR);
const parsed: PageData[] = pages.map((p) => parsePage(p, WIKI_DIR));
const existingIds = new Set(parsed.map((p) => p.id));

console.log("═══════════════════════════════════");
console.log(` LLM Wiki Lint`);
console.log(` 页面数: ${pages.length}`);
console.log("═══════════════════════════════════\n");

// ── 1. 断链 ──

console.log("── 1. 断链检查 ──");
let brokenCount = 0;
for (const page of parsed) {
  for (const link of page.links) {
    if (!existingIds.has(link)) {
      logError(`断链: ${page.path} → [[${link}]]`);
      brokenCount++;
    }
  }
}
if (brokenCount === 0) logOk("无断链");
console.log();

// ── 2. 孤儿页 ──

console.log("── 2. 孤儿页检查 ──");
const referenced = new Set<string>();
for (const page of parsed) {
  for (const link of page.links) referenced.add(link);
}
for (const link of parseIndexLinks(WIKI_DIR)) referenced.add(link);

let orphanCount = 0;
for (const page of parsed) {
  if (!referenced.has(page.id)) {
    logWarn(`孤儿页: ${page.path}`);
    orphanCount++;
  }
}
if (orphanCount === 0) logOk("无孤儿页");
console.log();

// ── 3. Index 一致性 ──

console.log("── 3. Index 一致性 ──");
const indexedIds = new Set(parseIndexLinks(WIKI_DIR));
let indexIssues = 0;

for (const page of parsed) {
  if (!indexedIds.has(page.id)) {
    logError(`缺失索引: ${page.path} 不在 index.md 中`);
    indexIssues++;
  }
}
for (const id of indexedIds) {
  if (!existingIds.has(id)) {
    logError(`幽灵索引: index.md 引用了不存在的 [[${id}]]`);
    indexIssues++;
  }
}
if (indexIssues === 0) logOk("Index 一致");
console.log();

// ── 4. Frontmatter ──

console.log("── 4. Frontmatter 完整性 ──");
let fmIssues = 0;
for (const page of parsed) {
  const fm = page.frontmatter;
  if (!fm || Object.keys(fm).length === 0) {
    logError(`缺少 frontmatter: ${page.path}`);
    fmIssues++;
    continue;
  }
  for (const field of REQUIRED_FIELDS) {
    if (!(field in fm)) {
      logWarn(`缺少字段 '${field}': ${page.path}`);
      fmIssues++;
    }
  }
}
if (fmIssues === 0) logOk("Frontmatter 完整");
console.log();

// ── 5. Disputed ──

console.log("── 5. Disputed 页面 ──");
let disputedCount = 0;
for (const page of parsed) {
  if (page.frontmatter?.status === "disputed") {
    logWarn(`Disputed: ${page.path}`);
    disputedCount++;
  }
}
if (disputedCount === 0) logOk("无 disputed 页面");
console.log();

// ── 6. Stub ──

console.log("── 6. Stub 页面 ──");
let stubCount = 0;
for (const page of parsed) {
  if (page.frontmatter?.status === "stub") {
    logWarn(`Stub: ${page.path}`);
    stubCount++;
  }
}
if (stubCount === 0) logOk("无 stub 页面");
console.log();

// ── 汇总 ──

console.log("═══════════════════════════════════");
console.log(` 汇总`);
console.log("═══════════════════════════════════");
console.log(` 页面总数: ${pages.length}`);
console.log(` 错误:     ${RED}${errors}${NC}`);
console.log(` 警告:     ${YELLOW}${warnings}${NC}`);
if (errors === 0 && warnings === 0) {
  console.log(` ${GREEN}Wiki 健康 ✓${NC}`);
}

process.exit(errors > 0 ? 1 : 0);
