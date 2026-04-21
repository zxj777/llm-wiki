import {
  collectPages,
  parsePage,
  parseIndexLinks,
  REQUIRED_FIELDS,
  type PageData,
} from "./lib.js";

const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const NC = "\x1b[0m";

export interface LintResult {
  errors: number;
  warnings: number;
  pageCount: number;
  lines: string[];
}

export function runLint(wikiDir = "wiki"): LintResult {
  let errors = 0;
  let warnings = 0;
  const lines: string[] = [];

  const logError = (msg: string) => {
    lines.push(`${RED}✗ ${msg}${NC}`);
    errors++;
  };
  const logWarn = (msg: string) => {
    lines.push(`${YELLOW}⚠ ${msg}${NC}`);
    warnings++;
  };
  const logOk = (msg: string) => {
    lines.push(`${GREEN}✓ ${msg}${NC}`);
  };

  const pages = collectPages(wikiDir);
  const parsed: PageData[] = pages.map((page) => parsePage(page, wikiDir));
  const existingIds = new Set(parsed.map((page) => page.id));

  lines.push("═══════════════════════════════════");
  lines.push(" LLM Wiki Lint");
  lines.push(` 页面数: ${pages.length}`);
  lines.push("═══════════════════════════════════");
  lines.push("");

  lines.push("── 1. 断链检查 ──");
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
  lines.push("");

  lines.push("── 2. 孤儿页检查 ──");
  const referenced = new Set<string>();
  for (const page of parsed) {
    for (const link of page.links) referenced.add(link);
  }
  for (const link of parseIndexLinks(wikiDir)) referenced.add(link);

  let orphanCount = 0;
  for (const page of parsed) {
    if (!referenced.has(page.id)) {
      logWarn(`孤儿页: ${page.path}`);
      orphanCount++;
    }
  }
  if (orphanCount === 0) logOk("无孤儿页");
  lines.push("");

  lines.push("── 3. Index 一致性 ──");
  const indexedIds = new Set(parseIndexLinks(wikiDir));
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
  lines.push("");

  lines.push("── 4. Frontmatter 完整性 ──");
  let fmIssues = 0;
  for (const page of parsed) {
    const frontmatter = page.frontmatter;
    if (!frontmatter || Object.keys(frontmatter).length === 0) {
      logError(`缺少 frontmatter: ${page.path}`);
      fmIssues++;
      continue;
    }
    for (const field of REQUIRED_FIELDS) {
      if (!(field in frontmatter)) {
        logWarn(`缺少字段 '${field}': ${page.path}`);
        fmIssues++;
      }
    }
  }
  if (fmIssues === 0) logOk("Frontmatter 完整");
  lines.push("");

  lines.push("── 5. Disputed 页面 ──");
  let disputedCount = 0;
  for (const page of parsed) {
    if (page.frontmatter.status === "disputed") {
      logWarn(`Disputed: ${page.path}`);
      disputedCount++;
    }
  }
  if (disputedCount === 0) logOk("无 disputed 页面");
  lines.push("");

  lines.push("── 6. Stub 页面 ──");
  let stubCount = 0;
  for (const page of parsed) {
    if (page.frontmatter.status === "stub") {
      logWarn(`Stub: ${page.path}`);
      stubCount++;
    }
  }
  if (stubCount === 0) logOk("无 stub 页面");
  lines.push("");

  lines.push("═══════════════════════════════════");
  lines.push(" 汇总");
  lines.push("═══════════════════════════════════");
  lines.push(` 页面总数: ${pages.length}`);
  lines.push(` 错误:     ${RED}${errors}${NC}`);
  lines.push(` 警告:     ${YELLOW}${warnings}${NC}`);
  if (errors === 0 && warnings === 0) {
    lines.push(` ${GREEN}Wiki 健康 ✓${NC}`);
  }

  return { errors, warnings, pageCount: pages.length, lines };
}

export function printLintResult(result: LintResult): void {
  for (const line of result.lines) {
    console.log(line);
  }
}
