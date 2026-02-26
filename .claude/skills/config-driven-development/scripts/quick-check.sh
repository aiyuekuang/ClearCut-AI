#!/bin/bash
# =============================================================================
# 快速检查脚本
# 用于快速执行特定类型的代码检查
# =============================================================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 默认项目路径（当前目录）
PROJECT_ROOT="${1:-.}"

# 打印帮助
print_help() {
    echo -e "${CYAN}======================================${NC}"
    echo -e "${CYAN}  快速检查工具${NC}"
    echo -e "${CYAN}======================================${NC}"
    echo ""
    echo "用法: $0 [项目路径] [检查类型]"
    echo ""
    echo "检查类型:"
    echo "  hardcode    检查硬编码问题"
    echo "  any         检查 any 类型使用"
    echo "  console     检查 console.log"
    echo "  duplicate   检查代码重复"
    echo "  bigfile     检查大文件"
    echo "  all         执行所有快速检查"
    echo ""
    echo "示例:"
    echo "  $0 . hardcode"
    echo "  $0 /path/to/project any"
    echo "  $0 . all"
    echo ""
}

# 检查硬编码
check_hardcode() {
    echo -e "\n${BLUE}========== 硬编码检查 ==========${NC}\n"
    
    echo -e "${YELLOW}🔴 HTTP 地址硬编码:${NC}"
    local http_count=$(grep -rn "http://" "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".umi" | wc -l | tr -d ' ')
    echo "   发现 $http_count 处"
    if [[ "$http_count" -gt 0 ]]; then
        grep -rn "http://" "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".umi" | head -5
    fi
    
    echo ""
    echo -e "${YELLOW}🔴 localhost 硬编码:${NC}"
    local localhost_count=$(grep -rn "localhost" "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".umi" | wc -l | tr -d ' ')
    echo "   发现 $localhost_count 处"
    if [[ "$localhost_count" -gt 0 ]]; then
        grep -rn "localhost" "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".umi" | head -5
    fi
    
    echo ""
    echo -e "${YELLOW}🟡 状态值硬编码 (=== 数字):${NC}"
    local status_count=$(grep -rn "=== [0-9]" "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".umi" | wc -l | tr -d ' ')
    echo "   发现 $status_count 处"
    if [[ "$status_count" -gt 0 ]]; then
        grep -rn "=== [0-9]" "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".umi" | head -5
    fi
}

# 检查 any 类型
check_any() {
    echo -e "\n${BLUE}========== any 类型检查 ==========${NC}\n"
    
    local any_count=$(grep -rn ": any" "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".umi" | wc -l | tr -d ' ')
    
    if [[ "$any_count" -gt 10 ]]; then
        echo -e "${RED}🔴 发现 $any_count 处 any 类型使用（较多，建议优化）${NC}"
    elif [[ "$any_count" -gt 0 ]]; then
        echo -e "${YELLOW}🟡 发现 $any_count 处 any 类型使用${NC}"
    else
        echo -e "${GREEN}✅ 未发现 any 类型使用${NC}"
    fi
    
    if [[ "$any_count" -gt 0 ]]; then
        echo ""
        echo "前 10 个位置:"
        grep -rn ": any" "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".umi" | head -10
    fi
}

# 检查 console.log
check_console() {
    echo -e "\n${BLUE}========== console.log 检查 ==========${NC}\n"
    
    local console_count=$(grep -rn "console\.log" "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".umi" | wc -l | tr -d ' ')
    
    if [[ "$console_count" -gt 20 ]]; then
        echo -e "${YELLOW}🟡 发现 $console_count 处 console.log（建议清理）${NC}"
    elif [[ "$console_count" -gt 0 ]]; then
        echo -e "${BLUE}ℹ️  发现 $console_count 处 console.log${NC}"
    else
        echo -e "${GREEN}✅ 未发现 console.log${NC}"
    fi
    
    if [[ "$console_count" -gt 0 ]]; then
        echo ""
        echo "按文件统计:"
        grep -rn "console\.log" "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".umi" | cut -d: -f1 | sort | uniq -c | sort -rn | head -10
    fi
}

# 检查代码重复
check_duplicate() {
    echo -e "\n${BLUE}========== 代码重复检查 ==========${NC}\n"
    
    echo -e "${YELLOW}表格列定义模式统计:${NC}"
    grep -rh "title:.*," "$PROJECT_ROOT/src" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | grep -v ".umi" | sort | uniq -c | sort -rn | head -10
    
    echo ""
    echo -e "${YELLOW}常见 API 调用统计:${NC}"
    grep -rh "apiRequest\.\|Service\." "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".umi" | sort | uniq -c | sort -rn | head -10
}

# 检查大文件
check_bigfile() {
    echo -e "\n${BLUE}========== 大文件检查 ==========${NC}\n"
    
    echo -e "${YELLOW}代码行数 Top 20:${NC}"
    echo ""
    printf "%-60s %s\n" "文件路径" "行数"
    printf "%-60s %s\n" "------------------------------------------------------------" "----"
    
    find "$PROJECT_ROOT/src" \( -name "*.tsx" -o -name "*.ts" \) -exec wc -l {} + 2>/dev/null | \
        sort -rn | head -21 | while read lines file; do
        if [[ "$file" != "total" ]]; then
            local rel_path="${file#$PROJECT_ROOT/}"
            if [[ "$lines" -gt 500 ]]; then
                printf "${RED}%-60s %s${NC}\n" "$rel_path" "$lines"
            elif [[ "$lines" -gt 300 ]]; then
                printf "${YELLOW}%-60s %s${NC}\n" "$rel_path" "$lines"
            elif [[ "$lines" -gt 200 ]]; then
                printf "${BLUE}%-60s %s${NC}\n" "$rel_path" "$lines"
            else
                printf "%-60s %s\n" "$rel_path" "$lines"
            fi
        fi
    done
    
    echo ""
    echo -e "${RED}红色${NC} = >500行（强烈建议拆分）"
    echo -e "${YELLOW}黄色${NC} = 300-500行（建议拆分）"
    echo -e "${BLUE}蓝色${NC} = 200-300行（考虑拆分）"
}

# 执行所有检查
check_all() {
    check_hardcode
    check_any
    check_console
    check_duplicate
    check_bigfile
}

# 主函数
main() {
    if [[ "$1" == "-h" || "$1" == "--help" ]]; then
        print_help
        exit 0
    fi
    
    PROJECT_ROOT="${1:-.}"
    local check_type="${2:-all}"
    
    if [[ ! -d "$PROJECT_ROOT/src" ]]; then
        echo -e "${RED}错误: 未找到 src 目录，请确认项目路径正确${NC}"
        exit 1
    fi
    
    echo -e "${CYAN}"
    echo "========================================"
    echo "       快速代码检查工具"
    echo "========================================"
    echo -e "${NC}"
    echo "项目路径: $PROJECT_ROOT"
    echo "检查类型: $check_type"
    
    case "$check_type" in
        hardcode)
            check_hardcode
            ;;
        any)
            check_any
            ;;
        console)
            check_console
            ;;
        duplicate)
            check_duplicate
            ;;
        bigfile)
            check_bigfile
            ;;
        all)
            check_all
            ;;
        *)
            echo -e "${RED}未知检查类型: $check_type${NC}"
            print_help
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}========================================"
    echo "       检查完成！"
    echo "========================================${NC}"
}

main "$@"
