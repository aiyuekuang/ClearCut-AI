#!/bin/bash
# =============================================================================
# 模块盘点与业务功能检查脚本
# 用于全面盘点项目模块及其业务功能完整性
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
    echo -e "${CYAN}  模块盘点与业务功能检查工具${NC}"
    echo -e "${CYAN}======================================${NC}"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -p, --project <路径>    项目根目录路径"
    echo "  -m, --module <模块>     检查特定模块"
    echo "  -o, --output <目录>     报告输出目录"
    echo "  -h, --help              显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 -p .                 # 盘点当前项目所有模块"
    echo "  $0 -p . -m Resource     # 检查特定模块"
    echo ""
}

# 打印日志
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "\n${PURPLE}========================================${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}========================================${NC}\n"
}

# 默认参数
PROJECT_ROOT="."
OUTPUT_DIR="./module-reports"
TARGET_MODULE=""

# 解析参数
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -p|--project)
                PROJECT_ROOT="$2"
                shift 2
                ;;
            -m|--module)
                TARGET_MODULE="$2"
                shift 2
                ;;
            -o|--output)
                OUTPUT_DIR="$2"
                shift 2
                ;;
            -h|--help)
                print_help
                exit 0
                ;;
            *)
                log_error "未知选项: $1"
                print_help
                exit 1
                ;;
        esac
    done
}

# Step 0.1: 识别所有模块
identify_modules() {
    log_step "Step 0.1: 识别所有模块"
    
    local report_file="$OUTPUT_DIR/01-modules-inventory.md"
    
    echo "# 模块盘点报告" > "$report_file"
    echo "" >> "$report_file"
    echo "**检查时间**: $(date '+%Y-%m-%d %H:%M:%S')" >> "$report_file"
    echo "**项目路径**: $PROJECT_ROOT" >> "$report_file"
    echo "" >> "$report_file"
    
    # 1. 前端页面模块
    echo "## 前端页面模块" >> "$report_file"
    echo "" >> "$report_file"
    
    if [[ -d "$PROJECT_ROOT/src/pages" ]]; then
        echo "| 序号 | 模块名称 | 路由路径 | 文件路径 | 文件数量 | 优先级 |" >> "$report_file"
        echo "|-----|---------|---------|---------|---------|-------|" >> "$report_file"
        
        local count=1
        for dir in "$PROJECT_ROOT/src/pages"/*; do
            if [[ -d "$dir" && $(basename "$dir") != "." && $(basename "$dir") != ".." ]]; then
                local module_name=$(basename "$dir")
                local file_count=$(find "$dir" -type f \( -name "*.tsx" -o -name "*.ts" \) 2>/dev/null | wc -l | tr -d ' ')
                local route_path="/${module_name,,}"
                
                # 尝试从路由文件获取路径
                if [[ -f "$PROJECT_ROOT/.umirc.ts" ]]; then
                    local found_route=$(grep -A 5 "path.*$module_name" "$PROJECT_ROOT/.umirc.ts" 2>/dev/null | head -1 | sed 's/.*path.*:\s*["\x27]\([^"\x27]*\)["\x27].*/\1/')
                    if [[ -n "$found_route" ]]; then
                        route_path="$found_route"
                    fi
                fi
                
                echo "| $count | $module_name | $route_path | src/pages/$module_name | $file_count | P0 |" >> "$report_file"
                log_info "前端模块: $module_name ($file_count 文件)"
                ((count++))
            fi
        done
    else
        echo "未找到前端页面模块" >> "$report_file"
    fi
    
    echo "" >> "$report_file"
    
    # 2. 后端业务模块
    echo "## 后端业务模块" >> "$report_file"
    echo "" >> "$report_file"
    
    if [[ -d "$PROJECT_ROOT/src" ]]; then
        echo "| 序号 | 模块名称 | 文件路径 | Controller | Service | Entity | 优先级 |" >> "$report_file"
        echo "|-----|---------|---------|-----------|---------|--------|-------|" >> "$report_file"
        
        local count=1
        for dir in "$PROJECT_ROOT/src"/*; do
            if [[ -d "$dir" && $(basename "$dir") != "." && $(basename "$dir") != ".." ]]; then
                local module_name=$(basename "$dir")
                
                # 跳过一些特殊目录
                if [[ "$module_name" =~ ^(common|config|entities|migrations|utils|types)$ ]]; then
                    continue
                fi
                
                # 检查是否有 controller 或 service
                local has_controller="❌"
                local has_service="❌"
                local has_entity="❌"
                
                if ls "$dir"/*.controller.ts 2>/dev/null | grep -q .; then
                    has_controller="✅"
                fi
                
                if ls "$dir"/*.service.ts 2>/dev/null | grep -q .; then
                    has_service="✅"
                fi
                
                if [[ -d "$PROJECT_ROOT/src/entities" ]]; then
                    if ls "$PROJECT_ROOT/src/entities"/*${module_name}*.entity.ts 2>/dev/null | grep -q .; then
                        has_entity="✅"
                    fi
                fi
                
                if [[ "$has_controller" == "✅" || "$has_service" == "✅" ]]; then
                    echo "| $count | $module_name | src/$module_name | $has_controller | $has_service | $has_entity | P0 |" >> "$report_file"
                    log_info "后端模块: $module_name (C:$has_controller S:$has_service E:$has_entity)"
                    ((count++))
                fi
            fi
        done
    fi
    
    echo "" >> "$report_file"
    
    # 3. API 接口文件
    echo "## API 接口文件" >> "$report_file"
    echo "" >> "$report_file"
    
    if [[ -d "$PROJECT_ROOT/src/api" ]]; then
        echo "| 序号 | 文件名 | 文件路径 | 导出函数数 | 代码行数 |" >> "$report_file"
        echo "|-----|-------|---------|-----------|---------|" >> "$report_file"
        
        local count=1
        for file in "$PROJECT_ROOT/src/api"/*.ts; do
            if [[ -f "$file" && $(basename "$file") != "index.ts" ]]; then
                local file_name=$(basename "$file")
                local export_count=$(grep -c "export.*function\|export const.*=" "$file" 2>/dev/null || echo "0")
                local line_count=$(wc -l < "$file" 2>/dev/null | tr -d ' ')
                
                echo "| $count | $file_name | src/api/$file_name | $export_count | $line_count |" >> "$report_file"
                log_info "API文件: $file_name ($export_count 函数)"
                ((count++))
            fi
        done
    else
        echo "未找到 API 接口文件" >> "$report_file"
    fi
    
    log_success "模块识别完成: $report_file"
}

# Step 0.2: 盘点模块业务功能
inventory_module_features() {
    local module_name="$1"
    local module_path="$2"
    
    log_step "Step 0.2: 盘点模块业务功能 - $module_name"
    
    local report_file="$OUTPUT_DIR/02-features-$module_name.md"
    
    echo "# 模块业务功能清单：$module_name" > "$report_file"
    echo "" >> "$report_file"
    echo "**检查时间**: $(date '+%Y-%m-%d %H:%M:%S')" >> "$report_file"
    echo "**模块路径**: $module_path" >> "$report_file"
    echo "" >> "$report_file"
    
    # 分析前端功能
    if [[ -d "$module_path" && -f "$module_path/index.tsx" ]]; then
        echo "## 核心功能" >> "$report_file"
        echo "" >> "$report_file"
        echo "| 功能名称 | 功能描述 | 前端入口 | API调用 | 状态 |" >> "$report_file"
        echo "|---------|---------|---------|---------|------|" >> "$report_file"
        
        # 查找按钮和操作
        local buttons=$(grep -n "Button\|onClick" "$module_path/index.tsx" 2>/dev/null | head -20)
        
        # 查找 API 调用
        local api_calls=$(grep -n "api\.\|apiRequest\|Service\." "$module_path/index.tsx" 2>/dev/null | head -20)
        
        if [[ -n "$buttons" ]]; then
            echo "$buttons" | while IFS= read -r line; do
                local line_num=$(echo "$line" | cut -d: -f1)
                local content=$(echo "$line" | cut -d: -f2-)
                
                # 提取按钮文本
                local btn_text=$(echo "$content" | sed -n 's/.*>\([^<>]*\)<\/Button.*/\1/p' | tr -d ' ')
                if [[ -z "$btn_text" ]]; then
                    btn_text=$(echo "$content" | sed -n 's/.*title=["'\'']\([^"'\'']*\)["'\''].*/\1/p')
                fi
                
                if [[ -n "$btn_text" ]]; then
                    echo "| $btn_text | 用户操作 | 第${line_num}行 | 待识别 | 🔍 待检查 |" >> "$report_file"
                fi
            done
        fi
        
        echo "" >> "$report_file"
        
        # API 调用分析
        echo "## API 调用清单" >> "$report_file"
        echo "" >> "$report_file"
        echo "| API名称 | 调用位置 | 功能描述 |" >> "$report_file"
        echo "|--------|---------|---------|" >> "$report_file"
        
        if [[ -n "$api_calls" ]]; then
            echo "$api_calls" | while IFS= read -r line; do
                local line_num=$(echo "$line" | cut -d: -f1)
                local api_name=$(echo "$line" | sed -n 's/.*\.\([a-zA-Z_][a-zA-Z0-9_]*\)(.*/\1/p')
                
                if [[ -n "$api_name" ]]; then
                    echo "| $api_name | 第${line_num}行 | - |" >> "$report_file"
                fi
            done
        fi
    fi
    
    echo "" >> "$report_file"
    
    # 检查后端实现
    local backend_module_path="$PROJECT_ROOT/src/${module_name,,}"
    if [[ -d "$backend_module_path" ]]; then
        echo "## 后端实现检查" >> "$report_file"
        echo "" >> "$report_file"
        
        # 检查 Controller
        local controller_file=$(find "$backend_module_path" -name "*.controller.ts" 2>/dev/null | head -1)
        if [[ -f "$controller_file" ]]; then
            echo "### Controller 接口" >> "$report_file"
            echo "" >> "$report_file"
            echo "| 接口路径 | HTTP方法 | 描述 | 行号 |" >> "$report_file"
            echo "|---------|---------|-----|-----|" >> "$report_file"
            
            grep -n "@Post\|@Get\|@Put\|@Delete" "$controller_file" 2>/dev/null | while IFS= read -r line; do
                local line_num=$(echo "$line" | cut -d: -f1)
                local method=$(echo "$line" | sed -n 's/.*@\([A-Z][a-z]*\).*/\1/p')
                local path=$(echo "$line" | sed -n "s/.*['\"]\\([^'\"]*\\)['\"].*/\\1/p")
                
                if [[ -n "$method" ]]; then
                    echo "| $path | $method | - | 第${line_num}行 |" >> "$report_file"
                fi
            done
            
            echo "" >> "$report_file"
        else
            echo "❌ 未找到 Controller 文件" >> "$report_file"
            echo "" >> "$report_file"
        fi
    fi
    
    log_success "功能盘点完成: $report_file"
}

# Step 0.3: 功能关联性检查
check_feature_relations() {
    local module_name="$1"
    
    log_step "Step 0.3: 功能关联性检查 - $module_name"
    
    local report_file="$OUTPUT_DIR/03-relations-$module_name.md"
    
    echo "# 功能关联性检查：$module_name" > "$report_file"
    echo "" >> "$report_file"
    echo "**检查时间**: $(date '+%Y-%m-%d %H:%M:%S')" >> "$report_file"
    echo "" >> "$report_file"
    
    echo "## 数据流关联检查" >> "$report_file"
    echo "" >> "$report_file"
    echo "检查 $module_name 与其他模块的数据流关联..." >> "$report_file"
    echo "" >> "$report_file"
    
    # 查找模块间的导入关系
    local module_path="$PROJECT_ROOT/src/pages/$module_name"
    if [[ -d "$module_path" ]]; then
        echo "### 前端依赖模块" >> "$report_file"
        echo "" >> "$report_file"
        
        # 查找 import 语句
        grep -rh "^import.*from" "$module_path" --include="*.tsx" --include="*.ts" 2>/dev/null | \
            grep -v "react\|antd\|@ant-design\|lodash\|dayjs" | \
            sort -u | head -20 >> "$report_file"
        
        echo "" >> "$report_file"
    fi
    
    echo "## 业务逻辑关联检查" >> "$report_file"
    echo "" >> "$report_file"
    echo "检查是否存在跨模块的业务逻辑调用..." >> "$report_file"
    echo "" >> "$report_file"
    
    # 查找跨模块的 API 调用
    if [[ -d "$module_path" ]]; then
        local other_api_calls=$(grep -rn "api\." "$module_path" --include="*.tsx" --include="*.ts" 2>/dev/null | \
            grep -v "api\.${module_name,,}" | head -10)
        
        if [[ -n "$other_api_calls" ]]; then
            echo "发现跨模块 API 调用:" >> "$report_file"
            echo "\`\`\`" >> "$report_file"
            echo "$other_api_calls" >> "$report_file"
            echo "\`\`\`" >> "$report_file"
        else
            echo "✅ 未发现跨模块 API 调用" >> "$report_file"
        fi
    fi
    
    echo "" >> "$report_file"
    
    echo "## UI交互关联检查" >> "$report_file"
    echo "" >> "$report_file"
    echo "检查页面跳转和交互关系..." >> "$report_file"
    echo "" >> "$report_file"
    
    # 查找页面跳转
    if [[ -d "$module_path" ]]; then
        local navigation=$(grep -rn "history\.push\|navigate\|Link.*to=" "$module_path" --include="*.tsx" 2>/dev/null | head -10)
        
        if [[ -n "$navigation" ]]; then
            echo "发现页面跳转:" >> "$report_file"
            echo "\`\`\`" >> "$report_file"
            echo "$navigation" >> "$report_file"
            echo "\`\`\`" >> "$report_file"
        else
            echo "✅ 未发现页面跳转" >> "$report_file"
        fi
    fi
    
    log_success "关联检查完成: $report_file"
}

# 主函数
main() {
    parse_args "$@"
    
    echo -e "${CYAN}"
    echo "========================================"
    echo "  模块盘点与业务功能检查工具"
    echo "========================================"
    echo -e "${NC}"
    
    log_info "项目路径: $PROJECT_ROOT"
    log_info "输出目录: $OUTPUT_DIR"
    
    if [[ ! -d "$PROJECT_ROOT/src" ]]; then
        log_error "项目 src 目录不存在"
        exit 1
    fi
    
    # 创建输出目录
    mkdir -p "$OUTPUT_DIR"
    
    # Step 0.1: 识别所有模块
    identify_modules
    
    # 如果指定了特定模块，只检查该模块
    if [[ -n "$TARGET_MODULE" ]]; then
        local module_path="$PROJECT_ROOT/src/pages/$TARGET_MODULE"
        if [[ ! -d "$module_path" ]]; then
            log_error "模块不存在: $TARGET_MODULE"
            exit 1
        fi
        
        inventory_module_features "$TARGET_MODULE" "$module_path"
        check_feature_relations "$TARGET_MODULE"
    else
        # 检查所有前端模块
        if [[ -d "$PROJECT_ROOT/src/pages" ]]; then
            for dir in "$PROJECT_ROOT/src/pages"/*; do
                if [[ -d "$dir" ]]; then
                    local module_name=$(basename "$dir")
                    inventory_module_features "$module_name" "$dir"
                    check_feature_relations "$module_name"
                fi
            done
        fi
    fi
    
    echo ""
    echo -e "${GREEN}========================================"
    echo "       检查完成！"
    echo "========================================"
    echo -e "${NC}"
    echo ""
    log_info "报告已生成到: $OUTPUT_DIR"
}

main "$@"
