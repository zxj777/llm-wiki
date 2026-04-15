#!/usr/bin/env bash
# tools/search.sh — LLM Wiki 全文搜索
# 用法: bash tools/search.sh <query> [options]
#
# 选项:
#   -d <dir>     搜索目录（默认: wiki）
#   -t <type>    限定页面类型（concept|entity|source|comparison|topic）
#   -n <num>     最多返回 N 个结果（默认: 10）
#   -s           只搜索 source 页面
#   -a           同时搜索 raw/ 和 wiki/
#   --titles     只在标题/文件名中搜索
#   --tags       只在 tags 字段中搜索
#
# 示例:
#   bash tools/search.sh "transformer"
#   bash tools/search.sh "attention mechanism" -t concept -n 5
#   bash tools/search.sh "karpathy" -a
#   bash tools/search.sh "llm" --tags

set -euo pipefail

# ─── 参数解析 ───

SEARCH_DIR="wiki"
PAGE_TYPE=""
MAX_RESULTS=10
SEARCH_RAW=false
TITLE_ONLY=false
TAGS_ONLY=false
QUERY=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -d) SEARCH_DIR="$2"; shift 2 ;;
        -t) PAGE_TYPE="$2"; shift 2 ;;
        -n) MAX_RESULTS="$2"; shift 2 ;;
        -s) PAGE_TYPE="source"; shift ;;
        -a) SEARCH_RAW=true; shift ;;
        --titles) TITLE_ONLY=true; shift ;;
        --tags) TAGS_ONLY=true; shift ;;
        -*) echo "未知选项: $1" >&2; exit 1 ;;
        *) QUERY="$1"; shift ;;
    esac
done

if [[ -z "$QUERY" ]]; then
    echo "用法: bash tools/search.sh <query> [options]"
    echo "运行 bash tools/search.sh --help 查看帮助"
    exit 1
fi

# ─── 搜索目录 ───

dirs=("$SEARCH_DIR")
if [[ "$SEARCH_RAW" == true ]]; then
    dirs+=("raw")
fi

# ─── 构建 ripgrep 参数 ───

rg_args=(-i --color=always -l)

# 页面类型过滤
type_glob=""
if [[ -n "$PAGE_TYPE" ]]; then
    case "$PAGE_TYPE" in
        concept)    type_glob="--glob=**/concepts/*.md" ;;
        entity)     type_glob="--glob=**/entities/*.md" ;;
        source)     type_glob="--glob=**/sources/*.md" ;;
        comparison) type_glob="--glob=**/comparisons/*.md" ;;
        topic)      type_glob="--glob=**/topics/*.md" ;;
        *) echo "未知类型: $PAGE_TYPE" >&2; exit 1 ;;
    esac
fi

# ─── 执行搜索 ───

echo "🔍 搜索: \"$QUERY\""
[[ -n "$PAGE_TYPE" ]] && echo "   类型: $PAGE_TYPE"
[[ "$SEARCH_RAW" == true ]] && echo "   范围: wiki/ + raw/"
echo "───────────────────────────────"

result_count=0

for dir in "${dirs[@]}"; do
    if [[ ! -d "$dir" ]]; then
        continue
    fi

    # 搜索工具：优先用 rg，fallback 到 grep
    if command -v rg &>/dev/null; then
        search_cmd="rg"
    else
        search_cmd="grep"
    fi

    # 构建搜索命令
    search_pattern="$QUERY"

    if [[ "$TITLE_ONLY" == true ]]; then
        search_pattern="^title:.*$QUERY"
    elif [[ "$TAGS_ONLY" == true ]]; then
        search_pattern="^tags:.*$QUERY"
    fi

    # 构建 find + grep 管道来查找匹配文件
    find_args=("$dir" -name '*.md')

    if [[ -n "$PAGE_TYPE" ]]; then
        case "$PAGE_TYPE" in
            concept)    find_args=("$dir/concepts" -name '*.md') ;;
            entity)     find_args=("$dir/entities" -name '*.md') ;;
            source)     find_args=("$dir/sources" -name '*.md') ;;
            comparison) find_args=("$dir/comparisons" -name '*.md') ;;
            topic)      find_args=("$dir/topics" -name '*.md') ;;
        esac
    fi

    # 先找匹配文件
    if [[ "$search_cmd" == "rg" ]]; then
        matching_files=$(rg -i --color=never --glob='*.md' -l "$search_pattern" "$dir" 2>/dev/null || true)
    else
        matching_files=$(find "${find_args[@]}" -exec grep -li "$search_pattern" {} \; 2>/dev/null || true)
    fi

    if [[ -z "$matching_files" ]]; then
        continue
    fi

    while IFS= read -r file; do
        if [[ $result_count -ge $MAX_RESULTS ]]; then
            break
        fi

        result_count=$((result_count + 1))

        # 提取标题
        title=$(grep -m1 "^title:" "$file" 2>/dev/null | sed 's/^title: *//' | tr -d '"' || echo "(无标题)")
        # 提取类型
        type=$(grep -m1 "^type:" "$file" 2>/dev/null | sed 's/^type: *//' || echo "?")
        # 提取状态
        status=$(grep -m1 "^status:" "$file" 2>/dev/null | sed 's/^status: *//' || echo "?")

        echo ""
        echo "[$result_count] $file"
        echo "    标题: $title"
        echo "    类型: $type | 状态: $status"

        # 显示匹配上下文（最多 3 行）
        if [[ "$search_cmd" == "rg" ]]; then
            context=$(rg -i -m 3 --no-filename -n "$search_pattern" "$file" 2>/dev/null || true)
        else
            context=$(grep -in "$search_pattern" "$file" 2>/dev/null | head -3 || true)
        fi
        if [[ -n "$context" ]]; then
            echo "    匹配:"
            echo "$context" | head -3 | sed 's/^/      /'
        fi

    done <<< "$matching_files"
done

echo ""
echo "───────────────────────────────"
echo "共 $result_count 个结果"

if [[ $result_count -eq 0 ]]; then
    echo "💡 提示: 尝试更宽泛的关键词，或使用 -a 同时搜索 raw/"
fi
