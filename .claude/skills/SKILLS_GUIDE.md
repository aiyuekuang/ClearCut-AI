# Skills 自动触发机制指南

## 问题分析

### 为什么 skills 不会自动识别？

**🔴 核心问题**：**skill.json 配置文件是文档规范，不是实际触发机制**

#### 真相1：Claude Code 不读取 skill.json
```
❌ Claude Code CLI 不会读取 skill.json 文件
✅ Claude Code CLI 只读取系统提示中的 skill 描述
```

**这意味着**：
- 我创建的 `skill.json` 文件只是**规范化文档**
- 这些配置**不会**被 Claude 系统自动识别
- 真正控制触发的是**系统提示**中的简短描述

#### 真相2：系统提示中的描述过于简单

**系统提示中的 skill 描述**（由 Claude Code CLI 生成）：
```
- product-design: 产品功能设计、需求分析、用户体验设计和 Schema 设计规范
- config-driven-development: 使用配置文件驱动业务逻辑、UI渲染和数据处理的设计模式
- fullstack-integration: 前后端联调检查、配置驱动代码质量检查、实际参数测试
- bug-fix: 快速定位和修复各类bug，包括UI问题、逻辑错误、数据问题等
```

**问题**：
1. ❌ 描述太简单，只有一句话
2. ❌ 缺少触发关键词列表
3. ❌ 缺少使用场景说明
4. ❌ 我（Claude）无法从这些描述中判断何时该用哪个skill

#### 真相3：我无法修改系统提示

```
系统提示 = Claude Code CLI 自动生成
skill.json = 用户自己创建的文档

Claude 只能看到系统提示，看不到 skill.json
```

**这意味着**：
- 即使我创建了详细的 skill.json
- 即使配置了完整的触发关键词
- Claude 系统也**看不到**这些配置

---

## 解决方案

### 🎯 真正的解决方案（针对 Claude Code 团队）

**Claude Code 需要改进的地方**：

#### 1. 支持读取 skill.json 配置
```json
// .claude/skills/skill-name/skill.json
{
  "triggers": {
    "keywords": ["设计", "需求", "方案"],
    "patterns": ["帮我设计.*", ".*怎么实现.*"]
  }
}
```

#### 2. 改进系统提示中的 skill 描述
```
// ❌ 当前（过于简单）
- product-design: 产品功能设计、需求分析...

// ✅ 改进后（包含触发信息）
- product-design: 产品功能设计、需求分析。
  触发条件：用户提到"设计"、"需求"、"方案"、"竞品分析"
  使用场景：新功能开发、需求分析、技术方案制定
```

#### 3. 提供 skill 调试工具
- 显示哪些 skill 被匹配
- 显示匹配得分
- 允许用户手动选择

---

### 📄 当前的临时方案（文档规范）

既然 Claude Code 还不支持自动读取配置，我创建的 skill.json 文件目前只能作为：

#### 1. 文档规范
- 记录每个 skill 的触发条件
- 规范化 skill 的定义
- 为未来 Claude Code 支持做准备

#### 2. 手动参考
- 用户可以查看 skill.json 了解何时该用哪个 skill
- 用户可以明确指定："使用 product-design skill 设计XXX"

```json
{
  "name": "skill-name",
  "displayName": "技能显示名称",
  "description": "技能描述",
  "triggers": {
    "keywords": [
      "关键词1",
      "关键词2"
    ],
    "patterns": [
      "正则表达式模式1",
      "正则表达式模式2"
    ],
    "intentDetection": {
      "enabled": true,
      "contexts": [
        "场景描述1",
        "场景描述2"
      ]
    }
  },
  "autoInvoke": {
    "enabled": true,
    "priority": "high|medium|low",
    "conditions": [
      "触发条件1",
      "触发条件2"
    ]
  },
  "validationPhrase": "验证短语（skill被调用时说的话）"
}
```

---

## 各 Skill 的触发场景

### 1. product-design（产品设计）

**何时自动触发**：
- ✅ 用户说："帮我设计一个XXX功能"
- ✅ 用户说："我想做XXX功能，怎么实现？"
- ✅ 用户说："这个需求应该怎么设计？"
- ✅ 用户说："帮我做竞品分析"
- ✅ 用户说："设计一下数据结构"

**触发关键词**：
- 设计、需求、竞品分析、方案设计、功能设计、Schema、数据结构设计、API设计

**验证短语**：
- 对话第一句会说："尊敬的主人"

---

### 2. config-driven-development（配置驱动开发）

**何时自动触发**：
- ✅ 用户说："检查一下代码质量"
- ✅ 用户说："优化一下这段代码"
- ✅ 用户说："这里有很多硬编码，怎么改？"
- ✅ 用户说："帮我重构XXX模块"
- ✅ 用户说："代码太乱了，怎么优化？"

**触发关键词**：
- 代码检查、代码质量、配置化、硬编码、重复代码、代码优化、重构、代码审查

**验证短语**：
- 对话第一句会说："我尊敬的主人"

---

### 3. fullstack-integration（前后端全链路）

**何时自动触发**：
- ✅ 用户说："检查一下前后端数据流"
- ✅ 用户说："模块盘点"
- ✅ 用户说："验证一下功能完整性"
- ✅ 用户说："前后端联调有问题"
- ✅ 用户说："测试一下XXX功能"

**触发关键词**：
- 前后端联调、数据流、模块盘点、功能检查、接口测试、联调、测试、验证、功能完整性

**验证短语**：
- 对话第一句会说："我尊敬的主人"

---

### 4. skill-improvement（技能更新）

**何时自动触发**：
- ✅ 用户说："更新一下技能文档"
- ✅ 用户说："改进XXX技能"
- ✅ 用户说："沉淀一下经验"

**触发关键词**：
- 更新技能、改进技能、技能文档、经验沉淀、最佳实践

**自动调用**：
- ❌ 默认不自动调用（需要用户明确请求）

---

### 5. ui-ux-pro-max（UI/UX 设计）

**何时自动触发**：
- ✅ 用户说："设计一下这个界面"
- ✅ 用户说："优化一下UI"
- ✅ 用户说："这个页面布局怎么设计？"
- ✅ 用户说："改进一下用户体验"

**触发关键词**：
- UI、UX、界面、设计、样式、布局、组件、页面设计、交互设计、视觉设计

---

## 如何验证 Skill 是否被触发？

### 方法1：观察验证短语

当 skill 被正确触发时，Claude 会在对话开头说验证短语：

| Skill | 验证短语 |
|-------|---------|
| product-design | "尊敬的主人" |
| config-driven-development | "我尊敬的主人" |
| fullstack-integration | "我尊敬的主人" |
| skill-improvement | 无 |
| ui-ux-pro-max | 无 |

### 方法2：观察执行流程

被触发的 skill 会严格按照 SKILL.md 中定义的流程执行。

---

## 使用示例

### 示例1：产品设计

**用户输入**：
```
帮我设计一个省份筛选功能，可以按省份筛选资源库
```

**预期响应**（product-design skill 被触发）：
```
尊敬的主人

我将按照产品设计流程帮你设计省份筛选功能。

### 第0步：多项目检查

首先让我检查当前workspace有几个项目，以及这个功能会影响哪些模块...
```

---

### 示例2：配置驱动开发

**用户输入**：
```
检查一下 Resource 模块的代码质量，看看有哪些硬编码
```

**预期响应**（config-driven-development skill 被触发）：
```
我尊敬的主人

我将按照配置驱动开发流程检查 Resource 模块的代码质量。

### 第1步：模块盘点

首先让我盘点一下 Resource 模块的文件结构...
```

---

### 示例3：前后端全链路

**用户输入**：
```
验证一下省份筛选功能的前后端数据流是否完整
```

**预期响应**（fullstack-integration skill 被触发）：
```
我尊敬的主人

我将按照前后端全链路检查流程验证省份筛选功能。

### Step 1: 检查后端数据模型

首先让我检查后端 Entity 是否支持省份字段...
```

---

## 常见问题

### Q1: 为什么我说了关键词，skill 还是没触发？

**🔴 核心原因**：**Claude Code 不读取 skill.json 配置文件**

即使你说了 skill.json 中定义的触发关键词（如"设计"、"需求"、"bug"），系统也无法自动触发，因为：
1. ✅ skill.json 只是文档规范
2. ❌ Claude 系统看不到 skill.json 的内容
3. ✅ 只能依赖系统提示中的简短描述

**实际触发机制**：
```
用户输入 → Claude 分析 → 查看系统提示中的 skill 描述 → 判断是否匹配
                                    ↑
                            （不会读取 skill.json）
```

**解决方法**：
- ✅ **方法1（推荐）**：明确指定 skill 名称
  ```
  "使用 product-design skill 设计XXX功能"
  "使用 bug-fix skill 修复XXX问题"
  ```

- ✅ **方法2**：使用 Skill 工具手动触发
  ```
  /product-design 设计XXX功能
  ```

- ✅ **方法3**：使用非常明确的关键词组合
  ```
  "帮我按照产品设计流程设计XXX功能"  // 强调"产品设计流程"
  "检查代码质量，找出硬编码问题"      // 强调"代码质量"
  ```

---

### Q2: 如何手动触发 Skill？

**方法1：使用 Skill 工具**
```
使用 product-design skill 设计省份筛选功能
```

**方法2：使用斜杠命令**（如果配置）
```
/product-design 设计省份筛选功能
```

---

### Q3: 多个 Skill 同时匹配怎么办？

**优先级规则**：
- **high**：product-design, config-driven-development, fullstack-integration
- **medium**：ui-ux-pro-max
- **low**：skill-improvement

当多个 skill 同时匹配时，优先级高的会被选中。

---

## 改进建议

### 对 Claude Code 团队的建议

1. **支持 skill.json 配置文件**
   - 让用户可以自定义触发规则
   - 支持关键词、正则表达式、意图识别

2. **提供 skill 调试工具**
   - 显示哪些 skill 被匹配
   - 显示匹配得分
   - 允许用户手动选择 skill

3. **改进系统提示中的 skill 描述**
   - 包含触发场景
   - 包含关键词列表
   - 包含示例用法

---

## 总结

### 🎯 问题根源
```
❌ Claude Code 不读取 skill.json 配置文件
❌ 系统提示中的 skill 描述过于简单
❌ 缺少自动触发机制
```

### 📄 当前状态（临时方案）
```
✅ skill.json = 文档规范（不是实际配置）
✅ 记录了每个 skill 的触发条件
✅ 为未来 Claude Code 改进做准备
```

### 🛠️ 实际使用方法
```
✅ 方法1：明确指定 skill 名称
   "使用 product-design skill 设计XXX"

✅ 方法2：使用 Skill 工具
   /product-design 设计XXX

✅ 方法3：观察验证短语确认触发
   - product-design: "尊敬的主人"
   - config-driven-development: "我尊敬的主人"
   - fullstack-integration: "我尊敬的主人"
   - bug-fix: "Bug已锁定，正在修复"
```

### 🚀 未来期待（对 Claude Code 的建议）
```
1. 支持读取 skill.json 配置文件
2. 改进系统提示中的 skill 描述（包含触发条件）
3. 提供 skill 调试和选择工具
4. 支持自定义触发规则
```

---

## 📌 重要提示

**skill.json 的作用**：
- ✅ 文档规范：记录 skill 的定义和触发条件
- ✅ 团队共识：团队成员了解何时该用哪个 skill
- ✅ 未来准备：当 Claude Code 支持时可直接使用
- ❌ **不是**自动触发配置：Claude 系统看不到这些配置

**实际触发方式**：
- 🔴 **自动触发**：基本不可能（描述太简单）
- 🟡 **半自动触发**：使用非常明确的关键词
- 🟢 **手动触发**：明确指定 skill 名称（推荐）
