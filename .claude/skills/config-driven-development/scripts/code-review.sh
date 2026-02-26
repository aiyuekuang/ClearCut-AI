#!/bin/bash
# =============================================================================
# 代码质量检查主脚本
# 用于执行配置驱动开发的代码质量检查流程
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 默认配置
PROJECT_ROOT=""
OUTPUT_DIR="./code-review-reports"
MODULES=""
CHECK_ALL=false

# 打印帮助信息
print_help() {
    echo -e "${CYAN}======================================${NC}"
    echo -e "${CYAN}  代码质量检查工具 v1.0.0${NC}"
    echo -e "${CYAN}======================================${NC}"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -p, --project <路径>    项目根目录路径 (必需)"
    echo "  -m, --modules <模块>    要检查的模块，逗号分隔 (可选)"
    echo "  -o, --output <目录>     报告输出目录 (默认: ./code-review-reports)"
    echo "  -a, --all               检查所有模块"
    echo "  -h, --help              显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 -p /path/to/project -m Settings/Users,Settings/Roles"
    echo "  $0 -p /path/to/project -a"
    echo ""
}

# 打印带颜色的消息
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
    echo -e "${PURPLE}  Step $1: $2${NC}"
    echo -e "${PURPLE}========================================${NC}\n"
}

# 解析命令行参数
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -p|--project)
                PROJECT_ROOT="$2"
                shift 2
                ;;
            -m|--modules)
                MODULES="$2"
                shift 2
                ;;
            -o|--output)
                OUTPUT_DIR="$2"
                shift 2
                ;;
            -a|--all)
                CHECK_ALL=true
                shift
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

    # 验证必需参数
    if [[ -z "$PROJECT_ROOT" ]]; then
        log_error "必须指定项目根目录 (-p)"
        print_help
        exit 1
    fi

    if [[ ! -d "$PROJECT_ROOT" ]]; then
        log_error "项目目录不存在: $PROJECT_ROOT"
        exit 1
    fi
}

# Step 1: 模块盘点
step1_module_inventory() {
    log_step "1" "模块盘点"
    
    local report_file="$OUTPUT_DIR/01-module-inventory.md"
    
    echo "# 模块盘点报告" > "$report_file"
    echo "" >> "$report_file"
    echo "**检查时间**: $(date '+%Y-%m-%d %H:%M:%S')" >> "$report_file"
    echo "**项目路径**: $PROJECT_ROOT" >> "$report_file"
    echo "" >> "$report_file"
    
    echo "## 前端页面模块" >> "$report_file"
    echo "" >> "$report_file"
    
    if [[ -d "$PROJECT_ROOT/src/pages" ]]; then
        echo "| 序号 | 模块名称 | 模块路径 | 文件数量 |" >> "$report_file"
        echo "|-----|---------|---------|---------|" >> "$report_file"
        
        local count=1
        for dir in "$PROJECT_ROOT/src/pages"/*; do
            if [[ -d "$dir" ]]; then
                local module_name=$(basename "$dir")
                local file_count=$(find "$dir" -type f \( -name "*.tsx" -o -name "*.ts" \) 2>/dev/null | wc -l | tr -d ' ')
                echo "| $count | $module_name | src/pages/$module_name | $file_count |" >> "$report_file"
                ((count++))
            fi
        done
    else
        echo "未找到 src/pages 目录" >> "$report_file"
    fi
    
    echo "" >> "$report_file"
    echo "## API 模块" >> "$report_file"
    echo "" >> "$report_file"
    
    if [[ -d "$PROJECT_ROOT/src/api" ]]; then
        echo "| 序号 | 文件名 | 文件路径 | 代码行数 |" >> "$report_file"
        echo "|-----|-------|---------|---------|" >> "$report_file"
        
        local count=1
        for file in "$PROJECT_ROOT/src/api"/*.ts; do
            if [[ -f "$file" ]]; then
                local file_name=$(basename "$file")
                local line_count=$(wc -l < "$file" | tr -d ' ')
                echo "| $count | $file_name | src/api/$file_name | $line_count |" >> "$report_file"
                ((count++))
            fi
        done
    else
        echo "未找到 src/api 目录" >> "$report_file"
    fi
    
    echo "" >> "$report_file"
    echo "## 组件模块" >> "$report_file"
    echo "" >> "$report_file"
    
    if [[ -d "$PROJECT_ROOT/src/components" ]]; then
        echo "| 序号 | 组件名称 | 组件路径 | 文件数量 |" >> "$report_file"
        echo "|-----|---------|---------|---------|" >> "$report_file"
        
        local count=1
        for dir in "$PROJECT_ROOT/src/components"/*; do
            if [[ -d "$dir" ]]; then
                local comp_name=$(basename "$dir")
                local file_count=$(find "$dir" -type f \( -name "*.tsx" -o -name "*.ts" \) 2>/dev/null | wc -l | tr -d ' ')
                echo "| $count | $comp_name | src/components/$comp_name | $file_count |" >> "$report_file"
                ((count++))
            fi
        done
    else
        echo "未找到 src/components 目录" >> "$report_file"
    fi
    
    log_success "模块盘点完成: $report_file"
}

# Step 2: 文件盘点
step2_file_inventory() {
    log_step "2" "文件盘点"
    
    local report_file="$OUTPUT_DIR/02-file-inventory.md"
    
    echo "# 文件盘点报告" > "$report_file"
    echo "" >> "$report_file"
    echo "**检查时间**: $(date '+%Y-%m-%d %H:%M:%S')" >> "$report_file"
    echo "" >> "$report_file"
    
    # 统计总体情况
    local total_tsx=$(find "$PROJECT_ROOT/src" -name "*.tsx" 2>/dev/null | wc -l | tr -d ' ')
    local total_ts=$(find "$PROJECT_ROOT/src" -name "*.ts" 2>/dev/null | wc -l | tr -d ' ')
    local total_lines=$(find "$PROJECT_ROOT/src" \( -name "*.tsx" -o -name "*.ts" \) -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}')
    
    echo "## 总体统计" >> "$report_file"
    echo "" >> "$report_file"
    echo "| 指标 | 数量 |" >> "$report_file"
    echo "|-----|-----|" >> "$report_file"
    echo "| TSX 文件数 | $total_tsx |" >> "$report_file"
    echo "| TS 文件数 | $total_ts |" >> "$report_file"
    echo "| 代码总行数 | $total_lines |" >> "$report_file"
    echo "" >> "$report_file"
    
    echo "## 大文件列表 (>200行)" >> "$report_file"
    echo "" >> "$report_file"
    echo "| 文件路径 | 代码行数 | 建议 |" >> "$report_file"
    echo "|---------|---------|-----|" >> "$report_file"
    
    find "$PROJECT_ROOT/src" \( -name "*.tsx" -o -name "*.ts" \) -exec wc -l {} + 2>/dev/null | \
        sort -rn | head -20 | while read lines file; do
        if [[ "$lines" -gt 200 && "$file" != "total" ]]; then
            local rel_path="${file#$PROJECT_ROOT/}"
            local suggestion="考虑拆分"
            if [[ "$lines" -gt 500 ]]; then
                suggestion="🔴 强烈建议拆分"
            elif [[ "$lines" -gt 300 ]]; then
                suggestion="🟡 建议拆分"
            fi
            echo "| $rel_path | $lines | $suggestion |" >> "$report_file"
        fi
    done
    
    log_success "文件盘点完成: $report_file"
}

# Step 3: 硬编码检查
step3_hardcode_check() {
    log_step "3" "硬编码检查"
    
    local report_file="$OUTPUT_DIR/03-hardcode-check.md"
    
    echo "# 硬编码检查报告" > "$report_file"
    echo "" >> "$report_file"
    echo "**检查时间**: $(date '+%Y-%m-%d %H:%M:%S')" >> "$report_file"
    echo "" >> "$report_file"
    
    # 检查 API 地址硬编码
    echo "## 🔴 API 地址硬编码" >> "$report_file"
    echo "" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    grep -rn "http://" "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null | \
        grep -v "node_modules" | grep -v ".umi" | head -50 >> "$report_file" || echo "未发现问题" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    echo "" >> "$report_file"
    
    # 检查 localhost 硬编码
    echo "## 🔴 localhost 硬编码" >> "$report_file"
    echo "" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    grep -rn "localhost" "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null | \
        grep -v "node_modules" | grep -v ".umi" | head -50 >> "$report_file" || echo "未发现问题" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    echo "" >> "$report_file"
    
    # 检查魔法数字
    echo "## 🟡 魔法数字 (3位以上数字)" >> "$report_file"
    echo "" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    grep -rn "[^a-zA-Z0-9_][0-9]\{3,\}[^a-zA-Z0-9_]" "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null | \
        grep -v "node_modules" | grep -v ".umi" | grep -v "// " | head -50 >> "$report_file" || echo "未发现问题" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    echo "" >> "$report_file"
    
    # 检查硬编码颜色
    echo "## 🟡 硬编码颜色值" >> "$report_file"
    echo "" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    grep -rn "#[0-9a-fA-F]\{6\}" "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null | \
        grep -v "node_modules" | grep -v ".umi" | head -50 >> "$report_file" || echo "未发现问题" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    echo "" >> "$report_file"
    
    # 检查状态值硬编码
    echo "## 🟡 状态值硬编码" >> "$report_file"
    echo "" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    grep -rn "=== [0-9]" "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null | \
        grep -v "node_modules" | grep -v ".umi" | head -50 >> "$report_file" || echo "未发现问题" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    
    log_success "硬编码检查完成: $report_file"
}

# Step 4: 代码重复检查
step4_duplicate_check() {
    log_step "4" "代码重复检查"
    
    local report_file="$OUTPUT_DIR/04-duplicate-check.md"
    
    echo "# 代码重复检查报告" > "$report_file"
    echo "" >> "$report_file"
    echo "**检查时间**: $(date '+%Y-%m-%d %H:%M:%S')" >> "$report_file"
    echo "" >> "$report_file"
    
    # 检查重复的表格列定义
    echo "## 🟡 重复的表格列定义模式" >> "$report_file"
    echo "" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    grep -rn "title:.*dataIndex:" "$PROJECT_ROOT/src" --include="*.tsx" 2>/dev/null | \
        grep -v "node_modules" | grep -v ".umi" | head -30 >> "$report_file" || echo "未发现问题" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    echo "" >> "$report_file"
    
    # 检查重复的 API 调用
    echo "## 🟡 API 调用模式统计" >> "$report_file"
    echo "" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    grep -rh "apiRequest\.\|Service\." "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null | \
        grep -v "node_modules" | grep -v ".umi" | sort | uniq -c | sort -rn | head -20 >> "$report_file" || echo "未发现问题" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    echo "" >> "$report_file"
    
    # 检查重复的事件处理函数
    echo "## 🟡 事件处理函数模式" >> "$report_file"
    echo "" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    grep -rn "const handle.*= async\|const handle.*= ()" "$PROJECT_ROOT/src" --include="*.tsx" 2>/dev/null | \
        grep -v "node_modules" | grep -v ".umi" | head -30 >> "$report_file" || echo "未发现问题" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    echo "" >> "$report_file"
    
    # 检查重复的 useState 模式
    echo "## 🟢 useState 使用统计" >> "$report_file"
    echo "" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    grep -rh "useState<" "$PROJECT_ROOT/src" --include="*.tsx" 2>/dev/null | \
        grep -v "node_modules" | grep -v ".umi" | sort | uniq -c | sort -rn | head -20 >> "$report_file" || echo "未发现问题" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    
    log_success "代码重复检查完成: $report_file"
}

# Step 5: 代码质量检查
step5_quality_check() {
    log_step "5" "代码质量检查"
    
    local report_file="$OUTPUT_DIR/05-quality-check.md"
    
    echo "# 代码质量检查报告" > "$report_file"
    echo "" >> "$report_file"
    echo "**检查时间**: $(date '+%Y-%m-%d %H:%M:%S')" >> "$report_file"
    echo "" >> "$report_file"
    
    # 检查 any 类型使用
    echo "## 🟡 any 类型使用" >> "$report_file"
    echo "" >> "$report_file"
    local any_count=$(grep -rn ": any" "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null | \
        grep -v "node_modules" | grep -v ".umi" | wc -l | tr -d ' ')
    echo "**发现 any 类型使用: $any_count 处**" >> "$report_file"
    echo "" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    grep -rn ": any" "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null | \
        grep -v "node_modules" | grep -v ".umi" | head -30 >> "$report_file" || echo "未发现问题" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    echo "" >> "$report_file"
    
    # 检查空 catch 块
    echo "## 🔴 空的 catch 块" >> "$report_file"
    echo "" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    grep -rn "catch.*{[[:space:]]*}" "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null | \
        grep -v "node_modules" | grep -v ".umi" | head -20 >> "$report_file" || echo "未发现问题" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    echo "" >> "$report_file"
    
    # 检查 console.log
    echo "## 🟡 console.log 使用" >> "$report_file"
    echo "" >> "$report_file"
    local console_count=$(grep -rn "console\.log" "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null | \
        grep -v "node_modules" | grep -v ".umi" | wc -l | tr -d ' ')
    echo "**发现 console.log: $console_count 处**" >> "$report_file"
    echo "" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    grep -rn "console\.log" "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null | \
        grep -v "node_modules" | grep -v ".umi" | head -30 >> "$report_file" || echo "未发现问题" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    echo "" >> "$report_file"
    
    # 检查 TODO/FIXME 注释
    echo "## 🟢 TODO/FIXME 注释" >> "$report_file"
    echo "" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    grep -rn "TODO\|FIXME" "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null | \
        grep -v "node_modules" | grep -v ".umi" | head -30 >> "$report_file" || echo "未发现问题" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    
    log_success "代码质量检查完成: $report_file"
}

# Step 6: 生成汇总报告
step6_summary_report() {
    log_step "6" "生成汇总报告"
    
    local report_file="$OUTPUT_DIR/00-summary-report.md"
    
    echo "# 代码质量检查汇总报告" > "$report_file"
    echo "" >> "$report_file"
    echo "**检查时间**: $(date '+%Y-%m-%d %H:%M:%S')" >> "$report_file"
    echo "**项目路径**: $PROJECT_ROOT" >> "$report_file"
    echo "" >> "$report_file"
    
    echo "## 检查结果概览" >> "$report_file"
    echo "" >> "$report_file"
    
    # 统计各类问题数量
    local http_count=$(grep -rn "http://" "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".umi" | wc -l | tr -d ' ')
    local localhost_count=$(grep -rn "localhost" "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".umi" | wc -l | tr -d ' ')
    local any_count=$(grep -rn ": any" "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".umi" | wc -l | tr -d ' ')
    local console_count=$(grep -rn "console\.log" "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".umi" | wc -l | tr -d ' ')
    
    echo "| 检查项 | 问题数量 | 严重程度 | 状态 |" >> "$report_file"
    echo "|-------|---------|---------|------|" >> "$report_file"
    
    # HTTP 硬编码
    if [[ "$http_count" -gt 0 ]]; then
        echo "| HTTP 地址硬编码 | $http_count | 🔴 高 | 待修复 |" >> "$report_file"
    else
        echo "| HTTP 地址硬编码 | 0 | ✅ | 通过 |" >> "$report_file"
    fi
    
    # localhost 硬编码
    if [[ "$localhost_count" -gt 0 ]]; then
        echo "| localhost 硬编码 | $localhost_count | 🔴 高 | 待修复 |" >> "$report_file"
    else
        echo "| localhost 硬编码 | 0 | ✅ | 通过 |" >> "$report_file"
    fi
    
    # any 类型
    if [[ "$any_count" -gt 10 ]]; then
        echo "| any 类型使用 | $any_count | 🟡 中 | 待优化 |" >> "$report_file"
    elif [[ "$any_count" -gt 0 ]]; then
        echo "| any 类型使用 | $any_count | 🟢 低 | 可选优化 |" >> "$report_file"
    else
        echo "| any 类型使用 | 0 | ✅ | 通过 |" >> "$report_file"
    fi
    
    # console.log
    if [[ "$console_count" -gt 20 ]]; then
        echo "| console.log | $console_count | 🟡 中 | 待清理 |" >> "$report_file"
    elif [[ "$console_count" -gt 0 ]]; then
        echo "| console.log | $console_count | 🟢 低 | 可选清理 |" >> "$report_file"
    else
        echo "| console.log | 0 | ✅ | 通过 |" >> "$report_file"
    fi
    
    echo "" >> "$report_file"
    echo "## 详细报告" >> "$report_file"
    echo "" >> "$report_file"
    echo "- [模块盘点报告](./01-module-inventory.md)" >> "$report_file"
    echo "- [文件盘点报告](./02-file-inventory.md)" >> "$report_file"
    echo "- [硬编码检查报告](./03-hardcode-check.md)" >> "$report_file"
    echo "- [代码重复检查报告](./04-duplicate-check.md)" >> "$report_file"
    echo "- [代码质量检查报告](./05-quality-check.md)" >> "$report_file"
    echo "" >> "$report_file"
    
    echo "## 优化建议" >> "$report_file"
    echo "" >> "$report_file"
    echo "### 高优先级" >> "$report_file"
    echo "1. 消除所有 HTTP/localhost 硬编码" >> "$report_file"
    echo "2. 清理空的 catch 块" >> "$report_file"
    echo "" >> "$report_file"
    echo "### 中优先级" >> "$report_file"
    echo "1. 减少 any 类型使用，定义具体类型" >> "$report_file"
    echo "2. 清理不必要的 console.log" >> "$report_file"
    echo "3. 抽取重复的表格列配置" >> "$report_file"
    echo "" >> "$report_file"
    echo "### 低优先级" >> "$report_file"
    echo "1. 拆分过大的组件文件" >> "$report_file"
    echo "2. 补充 JSDoc 注释" >> "$report_file"
    echo "3. 处理 TODO/FIXME 注释" >> "$report_file"
    
    log_success "汇总报告生成完成: $report_file"
}

# 主函数
main() {
    parse_args "$@"
    
    echo -e "${CYAN}"
    echo "========================================"
    echo "       代码质量检查工具 v1.0.0"
    echo "========================================"
    echo -e "${NC}"
    
    log_info "项目路径: $PROJECT_ROOT"
    log_info "输出目录: $OUTPUT_DIR"
    
    # 创建输出目录
    mkdir -p "$OUTPUT_DIR"
    
    # 执行各步骤
    step1_module_inventory
    step2_file_inventory
    step3_hardcode_check
    step4_duplicate_check
    step5_quality_check
    step6_summary_report
    
    echo ""
    echo -e "${GREEN}========================================"
    echo "       检查完成！"
    echo "========================================"
    echo -e "${NC}"
    echo ""
    log_info "报告已生成到: $OUTPUT_DIR"
    log_info "请查看 00-summary-report.md 获取汇总信息"
}

# 运行主函数
main "$@"
