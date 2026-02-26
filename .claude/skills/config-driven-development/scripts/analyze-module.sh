#!/bin/bash
# =============================================================================
# 模块分析脚本
# 用于分析特定模块的代码质量
# =============================================================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 打印帮助
print_help() {
    echo -e "${CYAN}======================================${NC}"
    echo -e "${CYAN}  模块分析工具${NC}"
    echo -e "${CYAN}======================================${NC}"
    echo ""
    echo "用法: $0 <模块路径>"
    echo ""
    echo "示例:"
    echo "  $0 src/pages/Settings/Users"
    echo "  $0 src/components/CustomTable"
    echo "  $0 src/api"
    echo ""
}

# 分析模块
analyze_module() {
    local module_path="$1"
    
    if [[ ! -d "$module_path" ]]; then
        echo -e "${RED}错误: 模块路径不存在: $module_path${NC}"
        exit 1
    fi
    
    local module_name=$(basename "$module_path")
    
    echo -e "${CYAN}"
    echo "========================================"
    echo "  模块分析: $module_name"
    echo "========================================"
    echo -e "${NC}"
    
    # 1. 基本信息
    echo -e "\n${PURPLE}【1. 基本信息】${NC}\n"
    
    local file_count=$(find "$module_path" -type f \( -name "*.tsx" -o -name "*.ts" \) 2>/dev/null | wc -l | tr -d ' ')
    local total_lines=$(find "$module_path" \( -name "*.tsx" -o -name "*.ts" \) -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}')
    
    echo "模块路径: $module_path"
    echo "文件数量: $file_count 个"
    echo "代码行数: $total_lines 行"
    
    # 2. 文件列表
    echo -e "\n${PURPLE}【2. 文件列表】${NC}\n"
    
    printf "%-40s %s\n" "文件名" "行数"
    printf "%-40s %s\n" "----------------------------------------" "----"
    
    find "$module_path" \( -name "*.tsx" -o -name "*.ts" \) -exec wc -l {} + 2>/dev/null | \
        sort -rn | while read lines file; do
        if [[ "$file" != "total" ]]; then
            local file_name=$(basename "$file")
            if [[ "$lines" -gt 300 ]]; then
                printf "${RED}%-40s %s${NC}\n" "$file_name" "$lines"
            elif [[ "$lines" -gt 200 ]]; then
                printf "${YELLOW}%-40s %s${NC}\n" "$file_name" "$lines"
            else
                printf "%-40s %s\n" "$file_name" "$lines"
            fi
        fi
    done
    
    # 3. 硬编码检查
    echo -e "\n${PURPLE}【3. 硬编码检查】${NC}\n"
    
    local http_count=$(grep -rn "http://" "$module_path" --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
    local localhost_count=$(grep -rn "localhost" "$module_path" --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
    local status_count=$(grep -rn "=== [0-9]" "$module_path" --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
    local color_count=$(grep -rn "#[0-9a-fA-F]\{6\}" "$module_path" --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
    
    echo "HTTP 地址硬编码:    $http_count 处"
    echo "localhost 硬编码:   $localhost_count 处"
    echo "状态值硬编码:       $status_count 处"
    echo "颜色值硬编码:       $color_count 处"
    
    if [[ "$http_count" -gt 0 ]]; then
        echo -e "\n${YELLOW}HTTP 硬编码详情:${NC}"
        grep -rn "http://" "$module_path" --include="*.tsx" --include="*.ts" 2>/dev/null | head -5
    fi
    
    # 4. 类型检查
    echo -e "\n${PURPLE}【4. 类型检查】${NC}\n"
    
    local any_count=$(grep -rn ": any" "$module_path" --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
    local unknown_count=$(grep -rn ": unknown" "$module_path" --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
    
    echo "any 类型使用:       $any_count 处"
    echo "unknown 类型使用:   $unknown_count 处"
    
    if [[ "$any_count" -gt 0 ]]; then
        echo -e "\n${YELLOW}any 类型详情:${NC}"
        grep -rn ": any" "$module_path" --include="*.tsx" --include="*.ts" 2>/dev/null | head -5
    fi
    
    # 5. 代码质量
    echo -e "\n${PURPLE}【5. 代码质量】${NC}\n"
    
    local console_count=$(grep -rn "console\.log" "$module_path" --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
    local todo_count=$(grep -rn "TODO\|FIXME" "$module_path" --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
    local empty_catch=$(grep -rn "catch.*{[[:space:]]*}" "$module_path" --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
    
    echo "console.log:        $console_count 处"
    echo "TODO/FIXME:         $todo_count 处"
    echo "空 catch 块:        $empty_catch 处"
    
    # 6. React Hooks 使用
    echo -e "\n${PURPLE}【6. React Hooks 使用】${NC}\n"
    
    local useState_count=$(grep -rn "useState" "$module_path" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
    local useEffect_count=$(grep -rn "useEffect" "$module_path" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
    local useMemo_count=$(grep -rn "useMemo" "$module_path" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
    local useCallback_count=$(grep -rn "useCallback" "$module_path" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
    
    echo "useState:           $useState_count 处"
    echo "useEffect:          $useEffect_count 处"
    echo "useMemo:            $useMemo_count 处"
    echo "useCallback:        $useCallback_count 处"
    
    # 7. 依赖分析
    echo -e "\n${PURPLE}【7. 导入分析】${NC}\n"
    
    echo "常见导入统计:"
    grep -rh "^import.*from" "$module_path" --include="*.tsx" --include="*.ts" 2>/dev/null | \
        sed "s/.*from ['\"]//g" | sed "s/['\"].*//g" | sort | uniq -c | sort -rn | head -10
    
    # 8. 复杂度评估
    echo -e "\n${PURPLE}【8. 复杂度评估】${NC}\n"
    
    local if_count=$(grep -rn "if (" "$module_path" --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
    local switch_count=$(grep -rn "switch (" "$module_path" --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
    local ternary_count=$(grep -rn "? .*:" "$module_path" --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
    
    echo "if 语句:            $if_count 处"
    echo "switch 语句:        $switch_count 处"
    echo "三元表达式:         $ternary_count 处"
    
    # 9. 总结
    echo -e "\n${PURPLE}【9. 质量评分】${NC}\n"
    
    local score=100
    local issues=()
    
    # 扣分规则
    if [[ "$http_count" -gt 0 ]]; then
        score=$((score - 15))
        issues+=("HTTP 硬编码 (-15)")
    fi
    
    if [[ "$localhost_count" -gt 0 ]]; then
        score=$((score - 15))
        issues+=("localhost 硬编码 (-15)")
    fi
    
    if [[ "$any_count" -gt 10 ]]; then
        score=$((score - 10))
        issues+=("any 类型过多 (-10)")
    elif [[ "$any_count" -gt 0 ]]; then
        score=$((score - 5))
        issues+=("存在 any 类型 (-5)")
    fi
    
    if [[ "$empty_catch" -gt 0 ]]; then
        score=$((score - 10))
        issues+=("空 catch 块 (-10)")
    fi
    
    if [[ "$total_lines" -gt 1000 ]]; then
        score=$((score - 10))
        issues+=("代码量过大 (-10)")
    fi
    
    if [[ "$console_count" -gt 10 ]]; then
        score=$((score - 5))
        issues+=("console.log 过多 (-5)")
    fi
    
    # 显示评分
    if [[ "$score" -ge 90 ]]; then
        echo -e "质量评分: ${GREEN}$score/100 优秀${NC}"
    elif [[ "$score" -ge 70 ]]; then
        echo -e "质量评分: ${YELLOW}$score/100 良好${NC}"
    elif [[ "$score" -ge 50 ]]; then
        echo -e "质量评分: ${YELLOW}$score/100 一般${NC}"
    else
        echo -e "质量评分: ${RED}$score/100 需要改进${NC}"
    fi
    
    if [[ ${#issues[@]} -gt 0 ]]; then
        echo ""
        echo "扣分项:"
        for issue in "${issues[@]}"; do
            echo "  - $issue"
        done
    fi
    
    # 10. 优化建议
    echo -e "\n${PURPLE}【10. 优化建议】${NC}\n"
    
    if [[ "$http_count" -gt 0 || "$localhost_count" -gt 0 ]]; then
        echo -e "${RED}[高优先级]${NC} 消除硬编码的 URL 地址"
    fi
    
    if [[ "$empty_catch" -gt 0 ]]; then
        echo -e "${RED}[高优先级]${NC} 处理空的 catch 块"
    fi
    
    if [[ "$any_count" -gt 0 ]]; then
        echo -e "${YELLOW}[中优先级]${NC} 减少 any 类型使用，定义具体类型"
    fi
    
    if [[ "$total_lines" -gt 500 ]]; then
        echo -e "${YELLOW}[中优先级]${NC} 考虑拆分大文件"
    fi
    
    if [[ "$console_count" -gt 0 ]]; then
        echo -e "${BLUE}[低优先级]${NC} 清理不必要的 console.log"
    fi
    
    if [[ "$useMemo_count" -eq 0 && "$useCallback_count" -eq 0 && "$useState_count" -gt 5 ]]; then
        echo -e "${BLUE}[低优先级]${NC} 考虑使用 useMemo/useCallback 优化性能"
    fi
    
    echo ""
    echo -e "${GREEN}========================================"
    echo "       分析完成！"
    echo "========================================${NC}"
}

# 主函数
main() {
    if [[ $# -eq 0 || "$1" == "-h" || "$1" == "--help" ]]; then
        print_help
        exit 0
    fi
    
    analyze_module "$1"
}

main "$@"
