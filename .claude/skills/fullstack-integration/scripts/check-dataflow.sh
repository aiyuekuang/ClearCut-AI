#!/bin/bash
# =============================================================================
# 数据流检查脚本
# 用于检查前后端数据流是否完整：Entity → DTO → API → UI
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
    echo -e "${CYAN}  数据流检查工具${NC}"
    echo -e "${CYAN}======================================${NC}"
    echo ""
    echo "用法: $0 <功能名称>"
    echo ""
    echo "示例:"
    echo "  $0 User          # 检查用户相关的数据流"
    echo "  $0 Resource      # 检查资源相关的数据流"
    echo "  $0 Order         # 检查订单相关的数据流"
    echo ""
    echo "检查内容:"
    echo "  1. 后端 Entity 是否存在"
    echo "  2. 后端 DTO 是否存在"
    echo "  3. 后端 Controller 是否存在"
    echo "  4. 前端 API 调用是否存在"
    echo "  5. 前端页面是否存在"
    echo ""
}

# 检查数据流
check_dataflow() {
    local feature_name="$1"
    local score=100
    local issues=()
    
    echo -e "${CYAN}"
    echo "========================================"
    echo "       数据流检查: $feature_name"
    echo "========================================"
    echo -e "${NC}"
    echo ""
    
    # 1. 检查后端 Entity
    echo -e "${PURPLE}[1/5] 检查后端 Entity${NC}"
    local entity_files=$(find . -name "*${feature_name,,}*.entity.ts" 2>/dev/null | grep -v node_modules | grep -v dist)
    if [[ -n "$entity_files" ]]; then
        echo -e "${GREEN}✅ 找到 Entity 定义${NC}"
        echo "$entity_files" | head -3
    else
        echo -e "${RED}❌ 未找到 Entity 定义${NC}"
        echo -e "${YELLOW}   文件名应该类似: ${feature_name,,}.entity.ts${NC}"
        issues+=("缺少 Entity 定义")
        score=$((score - 25))
    fi
    echo ""
    
    # 2. 检查后端 DTO
    echo -e "${PURPLE}[2/5] 检查后端 DTO${NC}"
    local dto_files=$(find . -name "*${feature_name,,}*.dto.ts" -o -name "*${feature_name}*Dto.ts" 2>/dev/null | grep -v node_modules | grep -v dist)
    if [[ -n "$dto_files" ]]; then
        local dto_count=$(echo "$dto_files" | wc -l | tr -d ' ')
        echo -e "${GREEN}✅ 找到 $dto_count 个 DTO 定义${NC}"
        echo "$dto_files" | head -5
    else
        echo -e "${RED}❌ 未找到 DTO 定义${NC}"
        echo -e "${YELLOW}   文件名应该类似: ${feature_name,,}.dto.ts 或 src/services/api/models/${feature_name}Dto.ts${NC}"
        issues+=("缺少 DTO 定义")
        score=$((score - 25))
    fi
    echo ""
    
    # 3. 检查后端 Controller
    echo -e "${PURPLE}[3/5] 检查后端 Controller${NC}"
    local controller_files=$(find . -name "*${feature_name,,}*.controller.ts" 2>/dev/null | grep -v node_modules | grep -v dist)
    if [[ -n "$controller_files" ]]; then
        echo -e "${GREEN}✅ 找到 Controller 定义${NC}"
        echo "$controller_files"
        
        # 检查 POST 方法定义
        local post_count=$(grep -rn "@Post" $controller_files 2>/dev/null | wc -l | tr -d ' ')
        echo -e "${BLUE}   包含 $post_count 个 POST 接口${NC}"
    else
        echo -e "${RED}❌ 未找到 Controller 定义${NC}"
        echo -e "${YELLOW}   文件名应该类似: ${feature_name,,}.controller.ts${NC}"
        issues+=("缺少 Controller 定义")
        score=$((score - 20))
    fi
    echo ""
    
    # 4. 检查前端 API 调用
    echo -e "${PURPLE}[4/5] 检查前端 API 调用${NC}"
    local api_files=$(find ./src/api -name "*.ts" 2>/dev/null | xargs grep -l "${feature_name}\|${feature_name,,}" 2>/dev/null)
    if [[ -n "$api_files" ]]; then
        echo -e "${GREEN}✅ 找到前端 API 调用${NC}"
        echo "$api_files" | head -3
        
        # 检查 API 函数数量
        local api_count=$(grep -rn "export.*${feature_name}\|${feature_name,,}" ./src/api/*.ts 2>/dev/null | grep -c "function\|const.*=" | tr -d ' ')
        echo -e "${BLUE}   包含约 $api_count 个 API 函数${NC}"
    else
        echo -e "${RED}❌ 未找到前端 API 调用${NC}"
        echo -e "${YELLOW}   应该在 src/api/${feature_name,,}.ts 中定义${NC}"
        issues+=("缺少前端 API 调用")
        score=$((score - 15))
    fi
    echo ""
    
    # 5. 检查前端页面
    echo -e "${PURPLE}[5/5] 检查前端页面${NC}"
    local page_dirs=$(find ./src/pages -type d -iname "*${feature_name}*" 2>/dev/null | grep -v node_modules)
    if [[ -n "$page_dirs" ]]; then
        echo -e "${GREEN}✅ 找到前端页面${NC}"
        echo "$page_dirs"
        
        # 检查页面文件
        for dir in $page_dirs; do
            if [[ -f "$dir/index.tsx" ]]; then
                local line_count=$(wc -l < "$dir/index.tsx" | tr -d ' ')
                echo -e "${BLUE}   $dir/index.tsx ($line_count 行)${NC}"
            fi
        done
    else
        echo -e "${YELLOW}⚠️  未找到对应的前端页面${NC}"
        echo -e "${YELLOW}   可能在: src/pages/${feature_name}/${NC}"
        issues+=("缺少前端页面")
        score=$((score - 10))
    fi
    echo ""
    
    # 打印评分
    echo -e "${CYAN}========================================"
    echo "           检查结果"
    echo "========================================${NC}"
    echo ""
    
    if [[ "$score" -ge 90 ]]; then
        echo -e "数据流完整度: ${GREEN}$score/100 优秀${NC}"
        echo -e "${GREEN}数据流完整：Entity → DTO → Controller → API → UI${NC}"
    elif [[ "$score" -ge 70 ]]; then
        echo -e "数据流完整度: ${YELLOW}$score/100 良好${NC}"
        echo -e "${YELLOW}数据流基本完整，建议补充缺失部分${NC}"
    elif [[ "$score" -ge 50 ]]; then
        echo -e "数据流完整度: ${YELLOW}$score/100 一般${NC}"
        echo -e "${YELLOW}数据流不完整，需要补充${NC}"
    else
        echo -e "数据流完整度: ${RED}$score/100 需要改进${NC}"
        echo -e "${RED}数据流断裂，必须补充${NC}"
    fi
    
    if [[ ${#issues[@]} -gt 0 ]]; then
        echo ""
        echo -e "${YELLOW}发现问题:${NC}"
        for issue in "${issues[@]}"; do
            echo "  - $issue"
        done
    fi
    
    echo ""
    echo -e "${CYAN}========================================"
    echo "           建议"
    echo "========================================${NC}"
    echo ""
    echo "1. 确保数据模型完整：Entity 定义所有字段"
    echo "2. 确保 DTO 完整：包含查询、创建、更新所需的字段"
    echo "3. 确保 Controller 实现：所有 CRUD 操作"
    echo "4. 确保前端 API 封装：与后端 DTO 匹配"
    echo "5. 确保前端 UI 实现：调用封装的 API"
    echo ""
}

# 主函数
main() {
    if [[ $# -eq 0 || "$1" == "-h" || "$1" == "--help" ]]; then
        print_help
        exit 0
    fi
    
    check_dataflow "$1"
}

main "$@"
