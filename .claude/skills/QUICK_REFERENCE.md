# Skills 快速参考

## 🎯 4个核心技能

```
.claude/skills/
├── product-design/          # 产品设计与需求分析
├── config-driven-development/  # 配置驱动开发
├── fullstack-integration/   # 前后端全链路开发与测试
└── skill-improvement/       # 技能更新与改进
```

## 📋 常用命令速查

### 产品设计阶段

```bash
# 检查需求文档
./product-design/scripts/check-requirements.sh docs/需求.md

# 检查 Schema 设计
./product-design/scripts/check-schema.sh .canon/schema.json
```

### 开发阶段

```bash
# 🌟 模块盘点（最优先）
./fullstack-integration/scripts/check-modules.sh -p .

# 检查数据流：Entity → DTO → API → UI
./fullstack-integration/scripts/check-dataflow.sh User

# 快速代码检查
./config-driven-development/scripts/quick-check.sh . all
```

### 质量检查

```bash
# 检查配置化程度
./fullstack-integration/scripts/check-config.sh src/pages/Resource

# 完整代码质量检查
./config-driven-development/scripts/code-review.sh -p . -a

# 分析单个模块
./config-driven-development/scripts/analyze-module.sh src/pages/User
```

### 问题修复

```bash
# 预览所有问题
./config-driven-development/scripts/fix-issues.sh . preview

# 删除 console.log
./config-driven-development/scripts/fix-issues.sh . console
```

### 技能维护

```bash
# 检查技能文档质量
./skill-improvement/scripts/check-skills.sh

# 检查多项目技能同步
./skill-improvement/scripts/sync-skills.sh
```

## 🔄 完整工作流

```bash
# 0️⃣ 模块盘点（最优先）🌟 新增
./fullstack-integration/scripts/check-modules.sh -p .

# 1️⃣ 产品设计
./product-design/scripts/check-requirements.sh docs/需求.md
./product-design/scripts/check-schema.sh .canon/schema.json

# 2️⃣ 数据流检查
./fullstack-integration/scripts/check-dataflow.sh Resource

# 3️⃣ 开发...

# 4️⃣ 业务功能完整性检查 🌟 新增
./fullstack-integration/scripts/check-modules.sh -p . -m Resource

# 5️⃣ 配置化检查
./fullstack-integration/scripts/check-config.sh src/pages/Resource

# 6️⃣ 代码质量
./config-driven-development/scripts/code-review.sh -p . -a

# 7️⃣ 问题修复
./config-driven-development/scripts/fix-issues.sh . console

# 8️⃣ 技能更新
./skill-improvement/scripts/check-skills.sh
```

## 📊 脚本功能矩阵

| 技能 | 脚本数 | 主要功能 |
|-----|-------|---------|
| product-design | 2 | 需求文档检查、Schema设计检查 |
| config-driven-development | 4 | 快速检查、模块分析、代码审查、问题修复 |
| fullstack-integration | 3 🌟 | **模块盘点、业务功能检查**、数据流检查、配置化检查 |
| skill-improvement | 2 | 技能文档检查、同步检查 |

## 🎨 输出示例

### 快速检查输出

```
========== 硬编码检查 ==========
🔴 HTTP 地址硬编码:    发现 5 处
🔴 localhost 硬编码:   发现 3 处
🟡 状态值硬编码:       发现 12 处
```

### 配置化检查输出

```
配置化程度: 75/100 良好
发现问题:
  - 表格列部分硬编码
  - 状态值硬编码 (12 处)
优化建议:
  - 将表格列定义抽取为配置文件
  - 使用枚举或字典配置替代硬编码状态值
```

### 数据流检查输出

```
[1/5] 检查后端 Entity
✅ 找到 Entity 定义

[2/5] 检查后端 DTO
✅ 找到 3 个 DTO 定义

[3/5] 检查后端 Controller
✅ 找到 Controller 定义
   包含 5 个 POST 接口

[4/5] 检查前端 API 调用
✅ 找到前端 API 调用
   包含约 5 个 API 函数

[5/5] 检查前端页面
✅ 找到前端页面

数据流完整度: 100/100 优秀
数据流完整：Entity → DTO → Controller → API → UI
```

## ⚡ 快捷别名（可选）

在 `~/.bashrc` 或 `~/.zshrc` 中添加：

```bash
alias check-req="./product-design/scripts/check-requirements.sh"
alias check-schema="./product-design/scripts/check-schema.sh"
alias check-flow="./fullstack-integration/scripts/check-dataflow.sh"
alias check-config="./fullstack-integration/scripts/check-config.sh"
alias quick-check="./config-driven-development/scripts/quick-check.sh . all"
alias code-review="./config-driven-development/scripts/code-review.sh -p ."
alias check-skills="./skill-improvement/scripts/check-skills.sh"
```

使用示例：
```bash
check-req docs/需求.md
check-flow User
quick-check
code-review -a
```

## 📖 详细文档

- 完整使用说明：`README.md`
- 各技能详细说明：`<技能名>/SKILL.md`

## 💡 核心原则

### 产品设计
✅ 竞品分析 → ✅ 需求完整 → ✅ Schema规范

### 配置驱动
✅ 配置优先 → ✅ 避免硬编码 → ✅ 提高复用

### 全链路开发
✅ 模块盘点优先 → ✅ 数据源验证 → ✅ 数据流完整 → ✅ 实际参数测试 → ✅ 功能关联完整

### 技能更新
✅ 经验沉淀 → ✅ 持续改进 → ✅ 知识共享
