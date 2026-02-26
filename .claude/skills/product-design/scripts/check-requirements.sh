#!/bin/bash
# =============================================================================
# 需求分析检查脚本
# 用于检查产品设计的需求分析是否完整
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
    echo -e "${CYAN}  需求分析检查工具${NC}"
    echo -e "${CYAN}======================================${NC}"
    echo ""
    echo "用法: $0 <需求文档路径>"
    echo ""
    echo "示例:"
    echo "  $0 docs/requirements.md"
    echo "  $0 docs/2026年1月26管理端修改-需求文档.md"
    echo ""
}

# 检查需求文档
check_requirements() {
    local doc_path="$1"
    
    if [[ ! -f "$doc_path" ]]; then
        echo -e "${RED}错误: 需求文档不存在: $doc_path${NC}"
        exit 1
    fi
    
    echo -e "${CYAN}"
    echo "========================================"
    echo "       需求分析检查工具"
    echo "========================================"
    echo -e "${NC}"
    echo "文档路径: $doc_path"
    echo ""
    
    local score=100
    local missing_items=()
    
    # 1. 检查需求背景
    echo -e "${BLUE}[1/8] 检查需求背景${NC}"
    if grep -q "需求背景\|业务场景\|背景说明" "$doc_path"; then
        echo -e "${GREEN}✅ 已包含需求背景${NC}"
    else
        echo -e "${RED}❌ 缺少需求背景${NC}"
        missing_items+=("需求背景")
        score=$((score - 15))
    fi
    
    # 2. 检查用户角色
    echo -e "${BLUE}[2/8] 检查用户角色${NC}"
    if grep -q "用户角色\|目标用户\|使用人群" "$doc_path"; then
        echo -e "${GREEN}✅ 已定义用户角色${NC}"
    else
        echo -e "${RED}❌ 缺少用户角色定义${NC}"
        missing_items+=("用户角色")
        score=$((score - 10))
    fi
    
    # 3. 检查核心功能
    echo -e "${BLUE}[3/8] 检查核心功能${NC}"
    if grep -q "核心功能\|功能列表\|功能需求" "$doc_path"; then
        echo -e "${GREEN}✅ 已列出核心功能${NC}"
    else
        echo -e "${RED}❌ 缺少核心功能描述${NC}"
        missing_items+=("核心功能")
        score=$((score - 20))
    fi
    
    # 4. 检查竞品分析
    echo -e "${BLUE}[4/8] 检查竞品分析${NC}"
    if grep -q "竞品分析\|同类产品\|参考产品" "$doc_path"; then
        echo -e "${GREEN}✅ 已包含竞品分析${NC}"
    else
        echo -e "${YELLOW}⚠️  建议添加竞品分析${NC}"
        missing_items+=("竞品分析（建议）")
        score=$((score - 5))
    fi
    
    # 5. 检查数据结构设计
    echo -e "${BLUE}[5/8] 检查数据结构设计${NC}"
    if grep -q "数据结构\|表结构\|数据模型\|Entity\|字段设计" "$doc_path"; then
        echo -e "${GREEN}✅ 已包含数据结构设计${NC}"
    else
        echo -e "${RED}❌ 缺少数据结构设计${NC}"
        missing_items+=("数据结构设计")
        score=$((score - 15))
    fi
    
    # 6. 检查接口设计
    echo -e "${BLUE}[6/8] 检查接口设计${NC}"
    if grep -q "接口设计\|API设计\|接口列表\|接口文档" "$doc_path"; then
        echo -e "${GREEN}✅ 已包含接口设计${NC}"
    else
        echo -e "${RED}❌ 缺少接口设计${NC}"
        missing_items+=("接口设计")
        score=$((score - 15))
    fi
    
    # 7. 检查页面设计
    echo -e "${BLUE}[7/8] 检查页面设计${NC}"
    if grep -q "页面设计\|UI设计\|页面布局\|交互流程" "$doc_path"; then
        echo -e "${GREEN}✅ 已包含页面设计${NC}"
    else
        echo -e "${YELLOW}⚠️  建议添加页面设计${NC}"
        missing_items+=("页面设计（建议）")
        score=$((score - 5))
    fi
    
    # 8. 检查边界条件和异常处理
    echo -e "${BLUE}[8/8] 检查边界条件和异常处理${NC}"
    if grep -q "边界条件\|异常处理\|错误处理\|特殊情况" "$doc_path"; then
        echo -e "${GREEN}✅ 已考虑边界条件${NC}"
    else
        echo -e "${YELLOW}⚠️  建议补充边界条件说明${NC}"
        missing_items+=("边界条件（建议）")
        score=$((score - 5))
    fi
    
    # 打印评分
    echo ""
    echo -e "${CYAN}========================================"
    echo "           检查结果"
    echo "========================================${NC}"
    echo ""
    
    if [[ "$score" -ge 90 ]]; then
        echo -e "完整度评分: ${GREEN}$score/100 优秀${NC}"
    elif [[ "$score" -ge 70 ]]; then
        echo -e "完整度评分: ${YELLOW}$score/100 良好${NC}"
    elif [[ "$score" -ge 50 ]]; then
        echo -e "完整度评分: ${YELLOW}$score/100 一般${NC}"
    else
        echo -e "完整度评分: ${RED}$score/100 需要改进${NC}"
    fi
    
    if [[ ${#missing_items[@]} -gt 0 ]]; then
        echo ""
        echo -e "${YELLOW}缺失项:${NC}"
        for item in "${missing_items[@]}"; do
            echo "  - $item"
        done
    fi
    
    echo ""
    echo -e "${CYAN}========================================"
    echo "           建议"
    echo "========================================${NC}"
    echo ""
    echo "1. 补充缺失的必需项（需求背景、核心功能、数据结构、接口设计）"
    echo "2. 添加竞品分析，学习行业最佳实践"
    echo "3. 完善边界条件和异常处理说明"
    echo "4. 确保数据流完整：数据模型 → API → UI"
    echo ""
}

# 主函数
main() {
    if [[ $# -eq 0 || "$1" == "-h" || "$1" == "--help" ]]; then
        print_help
        exit 0
    fi
    
    check_requirements "$1"
}

main "$@"
