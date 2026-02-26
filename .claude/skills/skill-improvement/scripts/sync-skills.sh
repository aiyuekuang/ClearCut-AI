#!/bin/bash
# =============================================================================
# 技能同步检查脚本
# 用于检查多个项目间的技能文档是否同步
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
    echo -e "${CYAN}  技能同步检查工具${NC}"
    echo -e "${CYAN}======================================${NC}"
    echo ""
    echo "用法: $0 [项目路径1] [项目路径2] ..."
    echo ""
    echo "示例:"
    echo "  $0                              # 检查当前目录的所有workspace项目"
    echo "  $0 /path/project1 /path/project2  # 检查指定项目"
    echo ""
}

# 获取技能MD5
get_skill_md5() {
    local skill_file="$1"
    if [[ -f "$skill_file" ]]; then
        if command -v md5sum &> /dev/null; then
            md5sum "$skill_file" | awk '{print $1}'
        elif command -v md5 &> /dev/null; then
            md5 -q "$skill_file"
        else
            echo "unknown"
        fi
    else
        echo "missing"
    fi
}

# 比较技能版本
get_skill_version() {
    local skill_file="$1"
    if [[ -f "$skill_file" ]]; then
        grep "^version:" "$skill_file" | head -1 | sed 's/version: *//g' | tr -d ' '
    else
        echo "N/A"
    fi
}

# 检查技能同步
check_skills_sync() {
    local projects=("$@")
    
    if [[ ${#projects[@]} -eq 0 ]]; then
        # 自动查找workspace项目
        echo -e "${BLUE}自动查找 workspace 项目...${NC}"
        local parent_dir=$(dirname "$(pwd)")
        projects=()
        for dir in "$parent_dir"/*; do
            if [[ -d "$dir/.claude/skills" || -d "$dir/.claude" ]]; then
                projects+=("$dir")
            fi
        done
        
        if [[ ${#projects[@]} -eq 0 ]]; then
            echo -e "${YELLOW}未找到包含 .claude 目录的项目${NC}"
            exit 0
        fi
    fi
    
    echo -e "${CYAN}"
    echo "========================================"
    echo "       技能同步检查工具"
    echo "========================================"
    echo -e "${NC}"
    echo ""
    echo "检查项目:"
    for i in "${!projects[@]}"; do
        echo "  $((i+1)). $(basename "${projects[$i]}")"
    done
    echo ""
    
    # 收集所有技能名称
    declare -A all_skills
    for project in "${projects[@]}"; do
        local skills_dir="$project/.claude/skills"
        if [[ -d "$skills_dir" ]]; then
            for skill_dir in "$skills_dir"/*; do
                if [[ -d "$skill_dir" ]]; then
                    local skill_name=$(basename "$skill_dir")
                    all_skills["$skill_name"]=1
                fi
            done
        fi
    done
    
    if [[ ${#all_skills[@]} -eq 0 ]]; then
        echo -e "${YELLOW}未找到任何技能${NC}"
        exit 0
    fi
    
    echo -e "${PURPLE}找到 ${#all_skills[@]} 个技能${NC}"
    echo ""
    
    # 检查每个技能的同步状态
    local sync_issues=()
    
    for skill_name in "${!all_skills[@]}"; do
        echo -e "${BLUE}检查技能: $skill_name${NC}"
        
        local versions=()
        local md5s=()
        local has_skill=()
        
        # 收集各项目的版本和MD5
        for project in "${projects[@]}"; do
            local skill_file="$project/.claude/skills/$skill_name/SKILL.md"
            local project_name=$(basename "$project")
            
            if [[ -f "$skill_file" ]]; then
                local version=$(get_skill_version "$skill_file")
                local md5=$(get_skill_md5 "$skill_file")
                versions+=("$project_name:$version")
                md5s+=("$project_name:$md5")
                has_skill+=("$project_name:yes")
                echo -e "${GREEN}  ✅ $project_name: v$version${NC}"
            else
                has_skill+=("$project_name:no")
                echo -e "${RED}  ❌ $project_name: 缺失${NC}"
            fi
        done
        
        # 检查版本是否一致
        local unique_versions=$(printf '%s\n' "${versions[@]}" | cut -d: -f2 | sort -u | wc -l | tr -d ' ')
        local unique_md5s=$(printf '%s\n' "${md5s[@]}" | cut -d: -f2 | sort -u | wc -l | tr -d ' ')
        
        if [[ "$unique_versions" -gt 1 ]]; then
            echo -e "${YELLOW}  ⚠️  版本不一致${NC}"
            sync_issues+=("$skill_name: 版本不一致")
        fi
        
        if [[ "$unique_md5s" -gt 1 ]]; then
            echo -e "${YELLOW}  ⚠️  内容不一致 (MD5不同)${NC}"
            sync_issues+=("$skill_name: 内容不一致")
        fi
        
        # 检查是否有项目缺失此技能
        local missing_count=$(printf '%s\n' "${has_skill[@]}" | grep ":no" | wc -l | tr -d ' ')
        if [[ "$missing_count" -gt 0 ]]; then
            echo -e "${RED}  ⚠️  $missing_count 个项目缺失此技能${NC}"
            sync_issues+=("$skill_name: 部分项目缺失")
        fi
        
        echo ""
    done
    
    # 打印汇总
    echo -e "${CYAN}========================================"
    echo "           检查结果"
    echo "========================================${NC}"
    echo ""
    
    if [[ ${#sync_issues[@]} -eq 0 ]]; then
        echo -e "${GREEN}✅ 所有技能已同步${NC}"
    else
        echo -e "${RED}发现 ${#sync_issues[@]} 个同步问题:${NC}"
        for issue in "${sync_issues[@]}"; do
            echo -e "${YELLOW}  - $issue${NC}"
        done
        echo ""
        echo -e "${CYAN}建议操作:${NC}"
        echo "1. 使用 cp 命令同步技能文件"
        echo "2. 或使用 rsync 命令批量同步"
        echo ""
        echo "示例:"
        echo "  # 同步单个技能"
        echo "  cp -r project1/.claude/skills/skill-name project2/.claude/skills/"
        echo ""
        echo "  # 批量同步所有技能"
        echo "  rsync -av --delete project1/.claude/skills/ project2/.claude/skills/"
    fi
    echo ""
}

# 主函数
main() {
    if [[ "$1" == "-h" || "$1" == "--help" ]]; then
        print_help
        exit 0
    fi
    
    check_skills_sync "$@"
}

main "$@"
