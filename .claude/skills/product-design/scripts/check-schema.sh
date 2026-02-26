#!/bin/bash
# =============================================================================
# Schema 设计检查脚本
# 用于检查 .canon/schema.json 的完整性和规范性
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
    echo -e "${CYAN}  Schema 设计检查工具${NC}"
    echo -e "${CYAN}======================================${NC}"
    echo ""
    echo "用法: $0 [schema文件路径]"
    echo ""
    echo "示例:"
    echo "  $0                    # 检查 .canon/schema.json"
    echo "  $0 config/schema.json # 检查指定文件"
    echo ""
}

# 检查 JSON 格式
check_json_format() {
    local schema_file="$1"
    
    if command -v python3 &> /dev/null; then
        python3 -c "import json; json.load(open('$schema_file'))" 2>&1
        return $?
    elif command -v node &> /dev/null; then
        node -e "require('fs').readFileSync('$schema_file', 'utf8'); JSON.parse(require('fs').readFileSync('$schema_file', 'utf8'))" 2>&1
        return $?
    else
        echo "警告: 未找到 python3 或 node，跳过 JSON 格式检查"
        return 0
    fi
}

# 检查 Schema
check_schema() {
    local schema_file="${1:-.canon/schema.json}"
    
    if [[ ! -f "$schema_file" ]]; then
        echo -e "${RED}错误: Schema 文件不存在: $schema_file${NC}"
        echo -e "${YELLOW}提示: 请先创建 Schema 文件${NC}"
        exit 1
    fi
    
    echo -e "${CYAN}"
    echo "========================================"
    echo "       Schema 设计检查工具"
    echo "========================================"
    echo -e "${NC}"
    echo "文件路径: $schema_file"
    echo ""
    
    local score=100
    local issues=()
    
    # 1. 检查 JSON 格式
    echo -e "${BLUE}[1/7] 检查 JSON 格式${NC}"
    local json_error=$(check_json_format "$schema_file" 2>&1)
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✅ JSON 格式正确${NC}"
    else
        echo -e "${RED}❌ JSON 格式错误${NC}"
        echo "错误信息: $json_error"
        issues+=("JSON 格式错误")
        score=$((score - 50))
    fi
    
    # 2. 检查模块定义
    echo -e "${BLUE}[2/7] 检查模块定义${NC}"
    if grep -q '"modules"' "$schema_file"; then
        local module_count=$(grep -o '"[^"]*":' "$schema_file" | grep -v "modules\|entities\|apis\|pages\|fields" | wc -l | tr -d ' ')
        echo -e "${GREEN}✅ 已定义模块 (约 $module_count 个)${NC}"
    else
        echo -e "${RED}❌ 缺少模块定义${NC}"
        issues+=("缺少模块定义")
        score=$((score - 20))
    fi
    
    # 3. 检查实体定义
    echo -e "${BLUE}[3/7] 检查实体定义${NC}"
    if grep -q '"entities"' "$schema_file"; then
        echo -e "${GREEN}✅ 已定义实体${NC}"
        
        # 检查字段定义
        if grep -q '"fields"' "$schema_file"; then
            echo -e "${GREEN}  ✅ 包含字段定义${NC}"
        else
            echo -e "${YELLOW}  ⚠️  建议添加详细字段定义${NC}"
            issues+=("字段定义不完整")
            score=$((score - 5))
        fi
    else
        echo -e "${YELLOW}⚠️  建议添加实体定义${NC}"
        issues+=("缺少实体定义")
        score=$((score - 10))
    fi
    
    # 4. 检查 API 定义
    echo -e "${BLUE}[4/7] 检查 API 定义${NC}"
    if grep -q '"apis"' "$schema_file"; then
        echo -e "${GREEN}✅ 已定义 API${NC}"
        
        # 检查 HTTP 方法
        if grep -q '"method"' "$schema_file"; then
            echo -e "${GREEN}  ✅ 包含 HTTP 方法${NC}"
        fi
        
        # 检查请求/响应定义
        if grep -q '"request"\|"response"' "$schema_file"; then
            echo -e "${GREEN}  ✅ 包含请求/响应定义${NC}"
        else
            echo -e "${YELLOW}  ⚠️  建议添加请求/响应定义${NC}"
            issues+=("API 请求/响应定义不完整")
            score=$((score - 5))
        fi
    else
        echo -e "${YELLOW}⚠️  建议添加 API 定义${NC}"
        issues+=("缺少 API 定义")
        score=$((score - 10))
    fi
    
    # 5. 检查页面定义
    echo -e "${BLUE}[5/7] 检查页面定义${NC}"
    if grep -q '"pages"' "$schema_file"; then
        echo -e "${GREEN}✅ 已定义页面${NC}"
    else
        echo -e "${YELLOW}⚠️  建议添加页面定义${NC}"
        issues+=("缺少页面定义")
        score=$((score - 5))
    fi
    
    # 6. 检查描述文档
    echo -e "${BLUE}[6/7] 检查描述文档${NC}"
    if grep -q '"description"' "$schema_file"; then
        local desc_count=$(grep -c '"description"' "$schema_file")
        if [[ "$desc_count" -gt 5 ]]; then
            echo -e "${GREEN}✅ 描述文档充分 ($desc_count 处)${NC}"
        else
            echo -e "${YELLOW}⚠️  描述文档较少 ($desc_count 处)，建议补充${NC}"
            score=$((score - 3))
        fi
    else
        echo -e "${RED}❌ 缺少描述文档${NC}"
        issues+=("缺少描述文档")
        score=$((score - 10))
    fi
    
    # 7. 检查依赖关系
    echo -e "${BLUE}[7/7] 检查依赖关系${NC}"
    if grep -q '"dependencies"' "$schema_file"; then
        echo -e "${GREEN}✅ 已声明模块依赖${NC}"
    else
        echo -e "${BLUE}ℹ️  未声明模块依赖（可选）${NC}"
    fi
    
    # 统计信息
    echo ""
    echo -e "${CYAN}========================================"
    echo "           统计信息"
    echo "========================================${NC}"
    echo ""
    
    local line_count=$(wc -l < "$schema_file" | tr -d ' ')
    echo "文件行数: $line_count"
    
    local file_size=$(ls -lh "$schema_file" | awk '{print $5}')
    echo "文件大小: $file_size"
    
    # 打印评分
    echo ""
    echo -e "${CYAN}========================================"
    echo "           检查结果"
    echo "========================================${NC}"
    echo ""
    
    if [[ "$score" -ge 90 ]]; then
        echo -e "规范性评分: ${GREEN}$score/100 优秀${NC}"
    elif [[ "$score" -ge 70 ]]; then
        echo -e "规范性评分: ${YELLOW}$score/100 良好${NC}"
    elif [[ "$score" -ge 50 ]]; then
        echo -e "规范性评分: ${YELLOW}$score/100 一般${NC}"
    else
        echo -e "规范性评分: ${RED}$score/100 需要改进${NC}"
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
    echo "1. 确保每个模块都有完整的 entities、apis、pages 定义"
    echo "2. 为每个实体定义详细的 fields（类型、必填、默认值）"
    echo "3. 为每个 API 定义 request 和 response 结构"
    echo "4. 添加充分的 description 说明"
    echo "5. 声明模块间的 dependencies 关系"
    echo ""
}

# 主函数
main() {
    if [[ "$1" == "-h" || "$1" == "--help" ]]; then
        print_help
        exit 0
    fi
    
    check_schema "$1"
}

main "$@"
