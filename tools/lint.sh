#!/usr/bin/env bash
# tools/lint.sh — LLM Wiki 健康检查脚本
# 用法: bash tools/lint.sh [wiki_dir]
# 检查: 断链、孤儿页、index 一致性、frontmatter 完整性

set -euo pipefail

WIKI_DIR="${1:-wiki}"
RED='\033[0;31m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
NC='\033[0m'

issues=0
warnings=0

# ─── 辅助函数 ───

log_error() { echo -e "${RED}✗ $1${NC}"; issues=$((issues + 1)); }
log_warn()  { echo -e "${YELLOW}⚠ $1${NC}"; warnings=$((warnings + 1)); }
log_ok()    { echo -e "${GREEN}✓ $1${NC}"; }

# 收集所有 wiki 页面（排除 index.md 和 log.md）
mapfile -t pages < <(find "$WIKI_DIR" -name '*.md' ! -name 'index.md' ! -name 'log.md' | sort)
page_count=${#pages[@]}

echo "═══════════════════════════════════"
echo " LLM Wiki Lint"
echo " 页面数: $page_count"
echo "═══════════════════════════════════"
echo

# ─── 1. 断链检查 ───

echo "── 1. 断链检查 ──"
broken_links=0

# 收集所有存在的页面路径（不带 wiki/ 前缀和 .md 后缀）
declare -A existing_pages
for page in "${pages[@]}"; do
    # wiki/concepts/foo.md → concepts/foo
    relative="${page#$WIKI_DIR/}"
    no_ext="${relative%.md}"
    existing_pages["$no_ext"]=1
done

for page in "${pages[@]}"; do
    # 查找 [[link]] 模式
    while IFS= read -r link; do
        # 去掉 [[ 和 ]]
        link_target="${link#\[\[}"
        link_target="${link_target%\]\]}"
        # 去掉 | 后面的显示文本
        link_target="${link_target%%|*}"
        # 去掉 .md 后缀（如果有）
        link_target="${link_target%.md}"

        if [[ -z "${existing_pages[$link_target]+_}" ]]; then
            log_error "断链: $page → [[$link_target]]"
            broken_links=$((broken_links + 1))
        fi
    done < <(grep -oE '\[\[[^]]+\]\]' "$page" 2>/dev/null || true)
done

if [[ $broken_links -eq 0 ]]; then
    log_ok "无断链"
fi
echo

# ─── 2. 孤儿页检查 ───

echo "── 2. 孤儿页检查 ──"
orphan_count=0

# 收集所有被引用的页面
declare -A referenced_pages
for page in "${pages[@]}"; do
    while IFS= read -r link; do
        link_target="${link#\[\[}"
        link_target="${link_target%\]\]}"
        link_target="${link_target%%|*}"
        link_target="${link_target%.md}"
        referenced_pages["$link_target"]=1
    done < <(grep -oE '\[\[[^]]+\]\]' "$page" 2>/dev/null || true)
done

# 也检查 index.md 中的引用
if [[ -f "$WIKI_DIR/index.md" ]]; then
    while IFS= read -r link; do
        link_target="${link#\[\[}"
        link_target="${link_target%\]\]}"
        link_target="${link_target%%|*}"
        link_target="${link_target%.md}"
        referenced_pages["$link_target"]=1
    done < <(grep -oE '\[\[[^]]+\]\]' "$WIKI_DIR/index.md" 2>/dev/null || true)
fi

for page in "${pages[@]}"; do
    relative="${page#$WIKI_DIR/}"
    no_ext="${relative%.md}"
    if [[ -z "${referenced_pages[$no_ext]+_}" ]]; then
        log_warn "孤儿页（无引用指向）: $page"
        orphan_count=$((orphan_count + 1))
    fi
done

if [[ $orphan_count -eq 0 ]]; then
    log_ok "无孤儿页"
fi
echo

# ─── 3. Index 一致性检查 ───

echo "── 3. Index 一致性 ──"
index_issues=0

if [[ ! -f "$WIKI_DIR/index.md" ]]; then
    log_error "index.md 不存在"
else
    # 收集 index.md 中引用的页面
    declare -A indexed_pages
    while IFS= read -r link; do
        link_target="${link#\[\[}"
        link_target="${link_target%\]\]}"
        link_target="${link_target%%|*}"
        link_target="${link_target%.md}"
        indexed_pages["$link_target"]=1
    done < <(grep -oE '\[\[[^]]+\]\]' "$WIKI_DIR/index.md" 2>/dev/null || true)

    # 检查每个页面是否在 index 中
    for page in "${pages[@]}"; do
        relative="${page#$WIKI_DIR/}"
        no_ext="${relative%.md}"
        if [[ -z "${indexed_pages[$no_ext]+_}" ]]; then
            log_error "缺失索引: $page 不在 index.md 中"
            index_issues=$((index_issues + 1))
        fi
    done

    # 检查 index 中引用的页面是否存在
    for indexed in "${!indexed_pages[@]}"; do
        if [[ -z "${existing_pages[$indexed]+_}" ]]; then
            log_error "幽灵索引: index.md 引用了不存在的 [[$indexed]]"
            index_issues=$((index_issues + 1))
        fi
    done

    if [[ $index_issues -eq 0 ]]; then
        log_ok "Index 一致"
    fi
fi
echo

# ─── 4. Frontmatter 检查 ───

echo "── 4. Frontmatter 完整性 ──"
fm_issues=0
required_fields=("title" "type" "created" "updated" "tags" "status" "sources")

for page in "${pages[@]}"; do
    # 检查是否有 frontmatter
    first_line=$(head -1 "$page")
    if [[ "$first_line" != "---" ]]; then
        log_error "缺少 frontmatter: $page"
        fm_issues=$((fm_issues + 1))
        continue
    fi

    # 提取 frontmatter
    frontmatter=$(sed -n '1,/^---$/{ /^---$/d; p; }' "$page" | tail -n +1)
    # sed above: 从第一行到第二个 --- 之间的内容
    # 更简单的方式: awk
    frontmatter=$(awk '/^---$/{n++; next} n==1' "$page")

    for field in "${required_fields[@]}"; do
        if ! echo "$frontmatter" | grep -q "^${field}:"; then
            log_warn "缺少字段 '$field': $page"
            fm_issues=$((fm_issues + 1))
        fi
    done
done

if [[ $fm_issues -eq 0 ]]; then
    log_ok "Frontmatter 完整"
fi
echo

# ─── 5. 矛盾页面 ───

echo "── 5. 矛盾 / Disputed 页面 ──"
disputed_count=0

for page in "${pages[@]}"; do
    if grep -q "status: disputed" "$page" 2>/dev/null; then
        log_warn "Disputed: $page"
        disputed_count=$((disputed_count + 1))
    fi
    if grep -q "⚠️ 矛盾记录" "$page" 2>/dev/null; then
        log_warn "含矛盾章节: $page"
    fi
done

if [[ $disputed_count -eq 0 ]]; then
    log_ok "无 disputed 页面"
fi
echo

# ─── 6. Stub 页面 ───

echo "── 6. Stub 页面 ──"
stub_count=0

for page in "${pages[@]}"; do
    if grep -q "status: stub" "$page" 2>/dev/null; then
        log_warn "Stub: $page"
        stub_count=$((stub_count + 1))
    fi
done

if [[ $stub_count -eq 0 ]]; then
    log_ok "无 stub 页面"
fi
echo

# ─── 汇总 ───

echo "═══════════════════════════════════"
echo " 汇总"
echo "═══════════════════════════════════"
echo " 页面总数: $page_count"
echo -e " 错误:     ${RED}$issues${NC}"
echo -e " 警告:     ${YELLOW}$warnings${NC}"

if [[ $issues -eq 0 && $warnings -eq 0 ]]; then
    echo -e " ${GREEN}Wiki 健康 ✓${NC}"
fi

exit $( [[ $issues -gt 0 ]] && echo 1 || echo 0 )
