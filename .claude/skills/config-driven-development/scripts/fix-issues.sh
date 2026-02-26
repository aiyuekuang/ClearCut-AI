#!/bin/bash
# =============================================================================
# 问题修复脚本
# 用于自动修复一些常见的代码质量问题
# =============================================================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 打印帮助
print_help() {
    echo -e "${CYAN}======================================${NC}"
    echo -e "${CYAN}  代码问题修复工具${NC}"
    echo -e "${CYAN}======================================${NC}"
    echo ""
    echo "用法: $0 <项目路径> <修复类型>"
    echo ""
    echo "修复类型:"
    echo "  console     删除 console.log 语句"
    echo "  debugger    删除 debugger 语句"
    echo "  trailing    删除行尾空格"
    echo "  preview     预览要修复的内容（不实际修改）"
    echo ""
    echo "示例:"
    echo "  $0 . console        # 删除当前项目的 console.log"
    echo "  $0 . preview        # 预览所有问题"
    echo ""
    echo -e "${YELLOW}注意: 修复前请确保已提交代码！${NC}"
    echo ""
}

# 预览问题
preview_issues() {
    local project_path="$1"
    
    echo -e "\n${BLUE}========== 问题预览 ==========${NC}\n"
    
    echo -e "${YELLOW}console.log 语句:${NC}"
    local console_count=$(grep -rn "console\.log" "$project_path/src" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".umi" | wc -l | tr -d ' ')
    echo "   发现 $console_count 处"
    grep -rn "console\.log" "$project_path/src" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".umi" | head -10
    
    echo ""
    echo -e "${YELLOW}console.error 语句:${NC}"
    local error_count=$(grep -rn "console\.error" "$project_path/src" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".umi" | wc -l | tr -d ' ')
    echo "   发现 $error_count 处"
    
    echo ""
    echo -e "${YELLOW}debugger 语句:${NC}"
    local debugger_count=$(grep -rn "debugger" "$project_path/src" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".umi" | wc -l | tr -d ' ')
    echo "   发现 $debugger_count 处"
    if [[ "$debugger_count" -gt 0 ]]; then
        grep -rn "debugger" "$project_path/src" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".umi"
    fi
    
    echo ""
    echo -e "${YELLOW}行尾空格:${NC}"
    local trailing_count=$(grep -rn "[[:space:]]$" "$project_path/src" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".umi" | wc -l | tr -d ' ')
    echo "   发现 $trailing_count 处"
}

# 删除 console.log
fix_console() {
    local project_path="$1"
    
    echo -e "\n${BLUE}========== 删除 console.log ==========${NC}\n"
    
    # 先统计
    local count=$(grep -rn "console\.log" "$project_path/src" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".umi" | wc -l | tr -d ' ')
    
    if [[ "$count" -eq 0 ]]; then
        echo -e "${GREEN}没有发现 console.log 语句${NC}"
        return 0
    fi
    
    echo "发现 $count 处 console.log 语句"
    echo ""
    
    # 确认
    echo -e "${YELLOW}即将删除以下文件中的 console.log 语句:${NC}"
    grep -rl "console\.log" "$project_path/src" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".umi"
    echo ""
    
    read -p "确认删除? (y/n): " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        echo "取消操作"
        return 0
    fi
    
    # 执行删除
    # 删除单行 console.log 语句
    find "$project_path/src" \( -name "*.tsx" -o -name "*.ts" \) -type f 2>/dev/null | \
        grep -v "node_modules" | grep -v ".umi" | while read file; do
        # macOS 兼容的 sed 命令
        if [[ "$(uname)" == "Darwin" ]]; then
            sed -i '' '/console\.log/d' "$file"
        else
            sed -i '/console\.log/d' "$file"
        fi
    done
    
    echo -e "${GREEN}删除完成！${NC}"
    
    # 验证
    local remaining=$(grep -rn "console\.log" "$project_path/src" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".umi" | wc -l | tr -d ' ')
    echo "剩余 console.log: $remaining 处"
}

# 删除 debugger
fix_debugger() {
    local project_path="$1"
    
    echo -e "\n${BLUE}========== 删除 debugger ==========${NC}\n"
    
    local count=$(grep -rn "debugger" "$project_path/src" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".umi" | wc -l | tr -d ' ')
    
    if [[ "$count" -eq 0 ]]; then
        echo -e "${GREEN}没有发现 debugger 语句${NC}"
        return 0
    fi
    
    echo "发现 $count 处 debugger 语句:"
    grep -rn "debugger" "$project_path/src" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".umi"
    echo ""
    
    read -p "确认删除? (y/n): " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        echo "取消操作"
        return 0
    fi
    
    # 执行删除
    find "$project_path/src" \( -name "*.tsx" -o -name "*.ts" \) -type f 2>/dev/null | \
        grep -v "node_modules" | grep -v ".umi" | while read file; do
        if [[ "$(uname)" == "Darwin" ]]; then
            sed -i '' '/^[[:space:]]*debugger;*[[:space:]]*$/d' "$file"
        else
            sed -i '/^[[:space:]]*debugger;*[[:space:]]*$/d' "$file"
        fi
    done
    
    echo -e "${GREEN}删除完成！${NC}"
}

# 删除行尾空格
fix_trailing() {
    local project_path="$1"
    
    echo -e "\n${BLUE}========== 删除行尾空格 ==========${NC}\n"
    
    local count=$(grep -rn "[[:space:]]$" "$project_path/src" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".umi" | wc -l | tr -d ' ')
    
    if [[ "$count" -eq 0 ]]; then
        echo -e "${GREEN}没有发现行尾空格${NC}"
        return 0
    fi
    
    echo "发现 $count 处行尾空格"
    echo ""
    
    read -p "确认删除? (y/n): " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        echo "取消操作"
        return 0
    fi
    
    # 执行删除
    find "$project_path/src" \( -name "*.tsx" -o -name "*.ts" \) -type f 2>/dev/null | \
        grep -v "node_modules" | grep -v ".umi" | while read file; do
        if [[ "$(uname)" == "Darwin" ]]; then
            sed -i '' 's/[[:space:]]*$//' "$file"
        else
            sed -i 's/[[:space:]]*$//' "$file"
        fi
    done
    
    echo -e "${GREEN}删除完成！${NC}"
}

# 主函数
main() {
    if [[ $# -lt 2 || "$1" == "-h" || "$1" == "--help" ]]; then
        print_help
        exit 0
    fi
    
    local project_path="$1"
    local fix_type="$2"
    
    if [[ ! -d "$project_path/src" ]]; then
        echo -e "${RED}错误: 未找到 src 目录${NC}"
        exit 1
    fi
    
    echo -e "${CYAN}"
    echo "========================================"
    echo "       代码问题修复工具"
    echo "========================================"
    echo -e "${NC}"
    echo "项目路径: $project_path"
    echo "修复类型: $fix_type"
    
    case "$fix_type" in
        console)
            fix_console "$project_path"
            ;;
        debugger)
            fix_debugger "$project_path"
            ;;
        trailing)
            fix_trailing "$project_path"
            ;;
        preview)
            preview_issues "$project_path"
            ;;
        *)
            echo -e "${RED}未知修复类型: $fix_type${NC}"
            print_help
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}========================================"
    echo "       操作完成！"
    echo "========================================${NC}"
}

main "$@"
