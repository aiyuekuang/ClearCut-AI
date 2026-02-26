#!/bin/bash
# =============================================================================
# 配置化程度检查脚本
# 用于检查代码的配置驱动程度
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
    echo -e "${CYAN}  配置化程度检查工具${NC}"
    echo -e "${CYAN}======================================${NC}"
    echo ""
    echo "用法: $0 <模块路径>"
    echo ""
    echo "示例:"
    echo "  $0 src/pages/Resource"
    echo "  $0 src/pages/Settings/Users"
    echo ""
}

# 检查配置化程度
check_config() {
    local module_path="$1"
    
    if [[ ! -d "$module_path" ]]; then
        echo -e "${RED}错误: 模块路径不存在: $module_path${NC}"
        exit 1
    fi
    
    local module_name=$(basename "$module_path")
    
    echo -e "${CYAN}"
    echo "========================================"
    echo "  配置化程度检查: $module_name"
    echo "========================================"
    echo -e "${NC}"
    echo ""
    
    local score=100
    local issues=()
    local suggestions=()
    
    # 1. 检查硬编码的表格列定义
    echo -e "${PURPLE}[1/6] 检查表格列定义${NC}"
    local hardcoded_columns=$(grep -rn "title:.*dataIndex:" "$module_path" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
    local config_columns=$(grep -rn "columns.*Config\|tableConfig\|\.config\." "$module_path" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
    
    if [[ "$config_columns" -gt "$hardcoded_columns" ]]; then
        echo -e "${GREEN}✅ 表格列使用配置驱动 (配置:$config_columns vs 硬编码:$hardcoded_columns)${NC}"
    elif [[ "$hardcoded_columns" -gt 10 ]]; then
        echo -e "${RED}❌ 大量硬编码的表格列 ($hardcoded_columns 处)${NC}"
        issues+=("表格列硬编码 ($hardcoded_columns 处)")
        suggestions+=("将表格列定义抽取为配置文件")
        score=$((score - 20))
    elif [[ "$hardcoded_columns" -gt 0 ]]; then
        echo -e "${YELLOW}⚠️  存在硬编码的表格列 ($hardcoded_columns 处)${NC}"
        issues+=("表格列部分硬编码")
        score=$((score - 10))
    else
        echo -e "${GREEN}✅ 无硬编码的表格列${NC}"
    fi
    echo ""
    
    # 2. 检查硬编码的表单项定义
    echo -e "${PURPLE}[2/6] 检查表单项定义${NC}"
    local hardcoded_form=$(grep -rn "Form\.Item\|<Form\.Item" "$module_path" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
    local config_form=$(grep -rn "formConfig\|FormRenderer\|formItems.*Config" "$module_path" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
    
    if [[ "$config_form" -gt "$hardcoded_form" ]]; then
        echo -e "${GREEN}✅ 表单使用配置驱动 (配置:$config_form vs 硬编码:$hardcoded_form)${NC}"
    elif [[ "$hardcoded_form" -gt 10 ]]; then
        echo -e "${RED}❌ 大量硬编码的表单项 ($hardcoded_form 处)${NC}"
        issues+=("表单项硬编码 ($hardcoded_form 处)")
        suggestions+=("将表单项定义抽取为配置文件")
        score=$((score - 20))
    elif [[ "$hardcoded_form" -gt 0 ]]; then
        echo -e "${YELLOW}⚠️  存在硬编码的表单项 ($hardcoded_form 处)${NC}"
        issues+=("表单项部分硬编码")
        score=$((score - 10))
    else
        echo -e "${GREEN}✅ 无硬编码的表单项${NC}"
    fi
    echo ""
    
    # 3. 检查状态值硬编码
    echo -e "${PURPLE}[3/6] 检查状态值硬编码${NC}"
    local status_hardcode=$(grep -rn "=== [0-9]\|status === '\|type === '" "$module_path" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
    local enum_usage=$(grep -rn "enum\|Enum\|ENUM" "$module_path" --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
    
    if [[ "$status_hardcode" -gt 10 ]]; then
        echo -e "${RED}❌ 大量状态值硬编码 ($status_hardcode 处)${NC}"
        issues+=("状态值硬编码 ($status_hardcode 处)")
        suggestions+=("使用枚举或字典配置替代硬编码状态值")
        score=$((score - 15))
    elif [[ "$status_hardcode" -gt 0 ]]; then
        echo -e "${YELLOW}⚠️  存在状态值硬编码 ($status_hardcode 处)${NC}"
        issues+=("状态值部分硬编码")
        score=$((score - 8))
    else
        echo -e "${GREEN}✅ 无硬编码的状态值${NC}"
    fi
    
    if [[ "$enum_usage" -gt 0 ]]; then
        echo -e "${BLUE}   使用枚举: $enum_usage 处${NC}"
    fi
    echo ""
    
    # 4. 检查配置文件存在性
    echo -e "${PURPLE}[4/6] 检查配置文件${NC}"
    local config_files=$(find "$module_path" -name "*.config.ts" -o -name "config.ts" -o -name "columns.ts" 2>/dev/null | wc -l | tr -d ' ')
    
    if [[ "$config_files" -gt 2 ]]; then
        echo -e "${GREEN}✅ 存在配置文件 ($config_files 个)${NC}"
        find "$module_path" -name "*.config.ts" -o -name "config.ts" -o -name "columns.ts" 2>/dev/null
    elif [[ "$config_files" -gt 0 ]]; then
        echo -e "${YELLOW}⚠️  配置文件较少 ($config_files 个)${NC}"
    else
        echo -e "${RED}❌ 未找到配置文件${NC}"
        issues+=("缺少配置文件")
        suggestions+=("创建配置文件（table.config.ts, form.config.ts）")
        score=$((score - 15))
    fi
    echo ""
    
    # 5. 检查代码复用
    echo -e "${PURPLE}[5/6] 检查代码复用${NC}"
    local handle_functions=$(grep -rn "const handle.*= async\|const handle.*= ()" "$module_path" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
    local custom_hooks=$(grep -rn "use[A-Z].*= ()\|export.*use[A-Z]" "$module_path" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
    
    if [[ "$custom_hooks" -gt 2 ]]; then
        echo -e "${GREEN}✅ 使用自定义 Hook 复用逻辑 ($custom_hooks 个)${NC}"
    elif [[ "$handle_functions" -gt 10 && "$custom_hooks" -lt 2 ]]; then
        echo -e "${YELLOW}⚠️  大量事件处理函数 ($handle_functions 个)，建议抽取为 Hook${NC}"
        suggestions+=("将重复的事件处理逻辑抽取为自定义 Hook")
        score=$((score - 5))
    else
        echo -e "${BLUE}ℹ️  事件处理函数: $handle_functions 个，自定义 Hook: $custom_hooks 个${NC}"
    fi
    echo ""
    
    # 6. 检查 ConfigRenderer 使用
    echo -e "${PURPLE}[6/6] 检查配置渲染器${NC}"
    local config_renderer=$(grep -rn "ConfigRenderer\|TableRenderer\|FormRenderer" "$module_path" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
    
    if [[ "$config_renderer" -gt 0 ]]; then
        echo -e "${GREEN}✅ 使用配置渲染器 ($config_renderer 处)${NC}"
    else
        echo -e "${BLUE}ℹ️  未使用配置渲染器（可选）${NC}"
        echo -e "${YELLOW}   建议：实现 ConfigRenderer 以提高复用性${NC}"
    fi
    echo ""
    
    # 打印评分
    echo -e "${CYAN}========================================"
    echo "           检查结果"
    echo "========================================${NC}"
    echo ""
    
    if [[ "$score" -ge 90 ]]; then
        echo -e "配置化程度: ${GREEN}$score/100 优秀${NC}"
        echo -e "${GREEN}代码高度配置化，易于维护和扩展${NC}"
    elif [[ "$score" -ge 70 ]]; then
        echo -e "配置化程度: ${YELLOW}$score/100 良好${NC}"
        echo -e "${YELLOW}部分使用配置驱动，建议进一步优化${NC}"
    elif [[ "$score" -ge 50 ]]; then
        echo -e "配置化程度: ${YELLOW}$score/100 一般${NC}"
        echo -e "${YELLOW}配置化程度较低，建议改造${NC}"
    else
        echo -e "配置化程度: ${RED}$score/100 需要改进${NC}"
        echo -e "${RED}大量硬编码，强烈建议进行配置化改造${NC}"
    fi
    
    if [[ ${#issues[@]} -gt 0 ]]; then
        echo ""
        echo -e "${YELLOW}发现问题:${NC}"
        for issue in "${issues[@]}"; do
            echo "  - $issue"
        done
    fi
    
    if [[ ${#suggestions[@]} -gt 0 ]]; then
        echo ""
        echo -e "${CYAN}优化建议:${NC}"
        for suggestion in "${suggestions[@]}"; do
            echo "  - $suggestion"
        done
    fi
    
    echo ""
    echo -e "${CYAN}========================================"
    echo "           配置化改造步骤"
    echo "========================================${NC}"
    echo ""
    echo "1. 创建配置文件目录: config/"
    echo "2. 抽取表格列配置: table.config.ts"
    echo "3. 抽取表单项配置: form.config.ts"
    echo "4. 使用枚举/字典: enums.ts 或后端字典接口"
    echo "5. 实现配置渲染器: ConfigRenderer, TableRenderer, FormRenderer"
    echo "6. 抽取公共逻辑为 Hook: useTableData, useCRUD 等"
    echo ""
}

# 主函数
main() {
    if [[ $# -eq 0 || "$1" == "-h" || "$1" == "--help" ]]; then
        print_help
        exit 0
    fi
    
    check_config "$1"
}

main "$@"
