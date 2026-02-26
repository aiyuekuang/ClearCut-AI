#!/bin/bash
# =============================================================================
# 技能文档检查脚本
# 用于检查技能文档的完整性和规范性
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
    echo -e "${CYAN}  技能文档检查工具${NC}"
    echo -e "${CYAN}======================================${NC}"
    echo ""
    echo "用法: $0 [技能路径]"
    echo ""
    echo "示例:"
    echo "  $0                                # 检查所有技能"
    echo "  $0 .claude/skills/product-design  # 检查指定技能"
    echo ""
}

# 检查单个技能
check_skill() {
    local skill_path="$1"
    local skill_name=$(basename "$skill_path")
    local skill_file="$skill_path/SKILL.md"
    
    if [[ ! -f "$skill_file" ]]; then
        echo -e "${RED}❌ $skill_name: SKILL.md 不存在${NC}"
        return 1
    fi
    
    echo -e "${BLUE}检查技能: $skill_name${NC}"
    
    local score=100
    local issues=()
    
    # 1. 检查文件头元数据
    if grep -q "^---" "$skill_file"; then
        if grep -q "name:\|description:\|version:" "$skill_file"; then
            echo -e "${GREEN}  ✅ 包含元数据${NC}"
        else
            echo -e "${YELLOW}  ⚠️  元数据不完整${NC}"
            issues+=("元数据不完整")
            score=$((score - 5))
        fi
    else
        echo -e "${YELLOW}  ⚠️  缺少元数据块${NC}"
        issues+=("缺少元数据")
        score=$((score - 3))
    fi
    
    # 2. 检查重要提示
    if grep -q "⚠️ 重要提示\|重要提示" "$skill_file"; then
        echo -e "${GREEN}  ✅ 包含重要提示${NC}"
    else
        echo -e "${YELLOW}  ⚠️  建议添加重要提示${NC}"
        score=$((score - 3))
    fi
    
    # 3. 检查技能概述
    if grep -q "技能概述\|## 概述" "$skill_file"; then
        echo -e "${GREEN}  ✅ 包含技能概述${NC}"
    else
        echo -e "${RED}  ❌ 缺少技能概述${NC}"
        issues+=("缺少技能概述")
        score=$((score - 10))
    fi
    
    # 4. 检查核心原则/流程
    if grep -q "核心原则\|检查步骤\|检查流程\|执行步骤" "$skill_file"; then
        echo -e "${GREEN}  ✅ 包含核心原则/流程${NC}"
    else
        echo -e "${RED}  ❌ 缺少核心原则/流程${NC}"
        issues+=("缺少核心原则/流程")
        score=$((score - 15))
    fi
    
    # 5. 检查检查清单
    if grep -q "\- \[ \]" "$skill_file"; then
        local checklist_count=$(grep -c "\- \[ \]" "$skill_file")
        echo -e "${GREEN}  ✅ 包含检查清单 ($checklist_count 项)${NC}"
    else
        echo -e "${YELLOW}  ⚠️  建议添加检查清单${NC}"
        score=$((score - 8))
    fi
    
    # 6. 检查示例代码
    if grep -q "\`\`\`" "$skill_file"; then
        local code_block_count=$(grep -c "\`\`\`" "$skill_file")
        local code_blocks=$((code_block_count / 2))
        echo -e "${GREEN}  ✅ 包含示例代码 ($code_blocks 个代码块)${NC}"
    else
        echo -e "${YELLOW}  ⚠️  建议添加示例代码${NC}"
        score=$((score - 5))
    fi
    
    # 7. 检查常见错误模式
    if grep -q "常见错误\|错误示例\|❌\|✅" "$skill_file"; then
        echo -e "${GREEN}  ✅ 包含错误示例${NC}"
    else
        echo -e "${YELLOW}  ⚠️  建议添加错误示例${NC}"
        score=$((score - 5))
    fi
    
    # 8. 检查相关资源链接
    if grep -q "相关资源\|相关技能\|参考链接" "$skill_file"; then
        echo -e "${GREEN}  ✅ 包含相关资源${NC}"
    else
        echo -e "${BLUE}  ℹ️  可选：添加相关资源链接${NC}"
    fi
    
    # 9. 检查更新日志
    if grep -q "更新日志\|## 更新" "$skill_file"; then
        echo -e "${GREEN}  ✅ 包含更新日志${NC}"
    else
        echo -e "${YELLOW}  ⚠️  建议添加更新日志${NC}"
        score=$((score - 3))
    fi
    
    # 10. 检查配套脚本
    local scripts_dir="$skill_path/scripts"
    if [[ -d "$scripts_dir" ]]; then
        local script_count=$(find "$scripts_dir" -name "*.sh" 2>/dev/null | wc -l | tr -d ' ')
        echo -e "${GREEN}  ✅ 包含配套脚本 ($script_count 个)${NC}"
    else
        echo -e "${YELLOW}  ⚠️  建议添加配套脚本${NC}"
        issues+=("缺少配套脚本")
        score=$((score - 10))
    fi
    
    # 统计信息
    local line_count=$(wc -l < "$skill_file" | tr -d ' ')
    local word_count=$(wc -w < "$skill_file" | tr -d ' ')
    echo -e "${BLUE}  📊 统计: $line_count 行, $word_count 字${NC}"
    
    # 评分
    if [[ "$score" -ge 90 ]]; then
        echo -e "${GREEN}  📊 质量评分: $score/100 优秀${NC}"
    elif [[ "$score" -ge 75 ]]; then
        echo -e "${YELLOW}  📊 质量评分: $score/100 良好${NC}"
    elif [[ "$score" -ge 60 ]]; then
        echo -e "${YELLOW}  📊 质量评分: $score/100 一般${NC}"
    else
        echo -e "${RED}  📊 质量评分: $score/100 需要改进${NC}"
    fi
    
    if [[ ${#issues[@]} -gt 0 ]]; then
        echo -e "${YELLOW}  问题: ${issues[*]}${NC}"
    fi
    
    echo ""
    return 0
}

# 检查所有技能
check_all_skills() {
    local skills_dir="${1:-.claude/skills}"
    
    if [[ ! -d "$skills_dir" ]]; then
        echo -e "${RED}错误: 技能目录不存在: $skills_dir${NC}"
        exit 1
    fi
    
    echo -e "${CYAN}"
    echo "========================================"
    echo "       技能文档检查工具"
    echo "========================================"
    echo -e "${NC}"
    echo "技能目录: $skills_dir"
    echo ""
    
    local total=0
    local passed=0
    
    for skill_dir in "$skills_dir"/*; do
        if [[ -d "$skill_dir" ]]; then
            total=$((total + 1))
            if check_skill "$skill_dir"; then
                passed=$((passed + 1))
            fi
        fi
    done
    
    echo -e "${CYAN}========================================"
    echo "           检查汇总"
    echo "========================================${NC}"
    echo ""
    echo "总计: $total 个技能"
    echo "通过: $passed 个"
    
    if [[ "$passed" -eq "$total" ]]; then
        echo -e "${GREEN}✅ 所有技能文档检查通过${NC}"
    else
        local failed=$((total - passed))
        echo -e "${YELLOW}⚠️  $failed 个技能需要改进${NC}"
    fi
    echo ""
}

# 主函数
main() {
    if [[ "$1" == "-h" || "$1" == "--help" ]]; then
        print_help
        exit 0
    fi
    
    if [[ $# -eq 0 ]]; then
        check_all_skills
    else
        check_skill "$1"
    fi
}

main "$@"
