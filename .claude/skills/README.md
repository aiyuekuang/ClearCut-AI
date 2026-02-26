# Skills 使用说明

## 技能列表

本项目包含4个核心技能，每个技能都配备了检查脚本：

### 1. 产品设计 (`product-design/`)

产品功能设计、需求分析、用户体验设计和 Schema 设计规范。

**配套脚本**：
```bash
# 检查需求文档完整性
./product-design/scripts/check-requirements.sh docs/需求文档.md

# 检查 Schema 设计规范
./product-design/scripts/check-schema.sh .canon/schema.json
```

### 2. 配置驱动开发 (`config-driven-development/`)

使用配置文件驱动业务逻辑、UI渲染和数据处理的设计模式。

**配套脚本**：
```bash
# 快速检查代码质量
./config-driven-development/scripts/quick-check.sh . all

# 分析单个模块
./config-driven-development/scripts/analyze-module.sh src/pages/Resource

# 完整代码质量检查（生成报告）
./config-driven-development/scripts/code-review.sh -p . -a

# 自动修复常见问题
./config-driven-development/scripts/fix-issues.sh . console
```

### 3. 前后端全链路开发与测试 (`fullstack-integration/`)

配置驱动的前后端全链路开发与测试流程，包括模块盘点、数据流检查和配置化程度检查。

**配套脚本**：
```bash
# 模块盘点与业务功能检查（最优先）
./fullstack-integration/scripts/check-modules.sh -p .

# 检查特定模块的业务功能
./fullstack-integration/scripts/check-modules.sh -p . -m Resource

# 检查数据流完整性（Entity → DTO → API → UI）
./fullstack-integration/scripts/check-dataflow.sh User

# 检查配置化程度
./fullstack-integration/scripts/check-config.sh src/pages/Resource
```

### 4. 技能更新 (`skill-improvement/`)

用于持续改进技能文档，沉淀开发经验和最佳实践。

**配套脚本**：
```bash
# 检查所有技能文档质量
./skill-improvement/scripts/check-skills.sh

# 检查单个技能
./skill-improvement/scripts/check-skills.sh .claude/skills/product-design

# 检查技能同步状态（多项目）
./skill-improvement/scripts/sync-skills.sh /path/project1 /path/project2
```

## 快速开始

### 1. 产品设计阶段

```bash
# 检查需求文档
./product-design/scripts/check-requirements.sh docs/需求文档.md

# 检查 Schema 设计
./product-design/scripts/check-schema.sh .canon/schema.json
```

### 2. 开发阶段

```bash
# 检查数据流完整性
./fullstack-integration/scripts/check-dataflow.sh User

# 快速检查代码问题
./config-driven-development/scripts/quick-check.sh . all

# 检查配置化程度
./fullstack-integration/scripts/check-config.sh src/pages/Resource
```

### 3. 代码质量检查

```bash
# 完整的代码质量检查（生成详细报告）
./config-driven-development/scripts/code-review.sh -p . -o ./reports

# 分析特定模块
./config-driven-development/scripts/analyze-module.sh src/pages/Settings/Users
```

### 4. 代码修复

```bash
# 预览所有问题
./config-driven-development/scripts/fix-issues.sh . preview

# 删除 console.log
./config-driven-development/scripts/fix-issues.sh . console

# 删除 debugger
./config-driven-development/scripts/fix-issues.sh . debugger
```

## 工作流程

### 完整的配置驱动开发流程

```bash
# Step 0: 模块盘点（最优先）⭐ 新增
./fullstack-integration/scripts/check-modules.sh -p .

# Step 1: 产品设计检查
./product-design/scripts/check-requirements.sh docs/需求文档.md
./product-design/scripts/check-schema.sh .canon/schema.json

# Step 2: 数据流检查
./fullstack-integration/scripts/check-dataflow.sh Resource

# Step 3: 开发（编写代码）
# ...

# Step 4: 业务功能完整性检查 ⭐ 新增
./fullstack-integration/scripts/check-modules.sh -p . -m Resource

# Step 5: 配置化检查
./fullstack-integration/scripts/check-config.sh src/pages/Resource

# Step 6: 代码质量检查
./config-driven-development/scripts/code-review.sh -p . -m Resource

# Step 7: 问题修复
./config-driven-development/scripts/fix-issues.sh . preview
./config-driven-development/scripts/fix-issues.sh . console

# Step 8: 技能更新检查
./skill-improvement/scripts/check-skills.sh
```

## 持续改进

### 技能文档维护

```bash
# 定期检查技能文档质量
./skill-improvement/scripts/check-skills.sh

# 多项目技能同步检查
./skill-improvement/scripts/sync-skills.sh
```

## 脚本说明

### 产品设计脚本

| 脚本 | 功能 | 用法 |
|-----|-----|-----|
| check-requirements.sh | 检查需求文档完整性 | `check-requirements.sh docs/需求.md` |
| check-schema.sh | 检查 Schema 设计规范 | `check-schema.sh .canon/schema.json` |

### 配置驱动开发脚本

| 脚本 | 功能 | 用法 |
|-----|-----|-----|
| quick-check.sh | 快速检查（硬编码、any类型等） | `quick-check.sh . all` |
| analyze-module.sh | 单个模块详细分析 | `analyze-module.sh src/pages/User` |
| code-review.sh | 完整代码质量检查（6步） | `code-review.sh -p . -a` |
| fix-issues.sh | 自动修复问题 | `fix-issues.sh . console` |

### 前后端全链路脚本

| 脚本 | 功能 | 用法 |
|-----|-----|-----|
| check-modules.sh | 模块盘点与业务功能检查 ⭐ 新增 | `check-modules.sh -p .` |
| check-dataflow.sh | 检查数据流完整性 | `check-dataflow.sh User` |
| check-config.sh | 检查配置化程度 | `check-config.sh src/pages/Resource` |

### 技能更新脚本

| 脚本 | 功能 | 用法 |
|-----|-----|-----|
| check-skills.sh | 检查技能文档质量 | `check-skills.sh` |
| sync-skills.sh | 检查技能同步状态 | `sync-skills.sh` |

## 常见问题

### 1. 脚本没有执行权限

```bash
chmod +x .claude/skills/**/scripts/*.sh
```

### 2. 脚本找不到项目路径

确保在项目根目录执行脚本，或使用绝对路径。

### 3. 脚本报告存放位置

代码质量检查报告默认存放在 `./code-review-reports/` 目录。

## 技能原则

### 产品设计
- ✅ 充分理解需求背景和业务场景
- ✅ 提供多个方案供选择
- ✅ 详细分析方案的优缺点
- ✅ 竞品分析是必需步骤

### 配置驱动开发
- ✅ 优先配置化：表格列、表单项都应该配置化
- ✅ 使用字典：状态值使用后端字典接口
- ✅ 提取常量：魔法数字提取为常量
- ✅ 复用配置：相似功能共享配置

### 前后端全链路
- ✅ 数据源头验证：永远从数据源头开始验证
- ✅ 数据流完整：Entity → DTO → Controller → API → UI
- ✅ 实际参数测试：测试必须使用真实参数

### 技能更新
- ✅ 经验驱动：从实际问题中总结经验
- ✅ 持续改进：定期回顾和更新技能文档
- ✅ 知识共享：将个人经验转化为团队知识

## 更新日志

### v1.0.0 (2026-01-29)
- 创建4个核心技能
- 为每个技能配套检查脚本
- 建立完整的工作流程
