---
name: Bug修复专家
description: 快速定位和修复各类bug，包括UI问题、逻辑错误、数据问题等
version: 1.0.0
author: win_985 团队
tags:
  - bug-fix
  - debugging
  - troubleshooting
---

# Bug修复专家技能

## ⚠️ 重要提示

**如果使用了本技能，对话第一句必须说：Bug已锁定，正在修复**

## 技能概述

本技能提供快速、系统化的bug定位和修复流程，适用于：
- UI/UX 问题（样式、布局、交互）
- 业务逻辑错误
- 数据问题（查询、过滤、显示）
- 性能问题
- 兼容性问题

## 核心原则

### 1. 快速定位原则
> **先定位问题，再修复。不要盲目改代码。**

### 2. 最小修改原则
> **只改必须改的，不要过度优化。**

### 3. 验证测试原则
> **修复后必须验证，确保问题真正解决。**

---

## Bug修复流程

### Step 1: 理解问题

**明确问题描述**：
- [ ] 问题现象是什么？（截图、描述）
- [ ] 预期行为是什么？
- [ ] 实际行为是什么？
- [ ] 复现步骤是什么？
- [ ] 影响范围是多大？

**问题分类**：
- 🎨 **UI/UX 问题**：样式、布局、交互、动画
- 🧮 **逻辑问题**：计算错误、流程错误、状态错误
- 📊 **数据问题**：查询错误、过滤错误、显示错误
- ⚡ **性能问题**：加载慢、卡顿、内存泄漏
- 🔧 **配置问题**：环境、依赖、构建

---

### Step 2: 快速定位

#### 2.1 查找相关文件

```bash
# 方法1：根据页面路径查找
# 例：用户下拉菜单 → src/layouts/index.tsx

# 方法2：根据关键词搜索
grep -rn "关键词" src/ --include="*.tsx" --include="*.ts"

# 方法3：根据组件名搜索
grep -rn "ComponentName" src/ --include="*.tsx"
```

#### 2.2 定位问题代码

```bash
# 查看文件内容
cat src/path/to/file.tsx | head -100

# 搜索具体问题相关代码
grep -n "className\|style\|onClick" src/path/to/file.tsx
```

#### 2.3 分析问题原因

**UI/UX 问题常见原因**：
- [ ] CSS 样式冲突
- [ ] z-index 层级问题
- [ ] position 定位问题
- [ ] overflow 隐藏问题
- [ ] 拖动区域覆盖可点击元素

**逻辑问题常见原因**：
- [ ] 条件判断错误
- [ ] 状态管理错误
- [ ] 事件处理错误
- [ ] 异步处理错误

**数据问题常见原因**：
- [ ] API 参数错误
- [ ] 数据过滤错误
- [ ] 数据格式转换错误
- [ ] 缓存问题

---

### Step 3: 制定修复方案

**修复方案要求**：
- ✅ 简单直接（不要过度设计）
- ✅ 最小改动（只改必要的地方）
- ✅ 向后兼容（不破坏现有功能）
- ✅ 可验证性（修复后可以测试）

**常见修复模式**：

#### 模式1：调整CSS样式
```typescript
// 问题：元素被遮挡
// 修复：调整 z-index 或 position

// ❌ 修复前
<div style={{ position: 'fixed', zIndex: 999 }}>

// ✅ 修复后
<div style={{ position: 'fixed', zIndex: 1001 }}>
```

#### 模式2：调整布局区域
```typescript
// 问题：拖动区域覆盖按钮
// 修复：减小拖动区域范围

// ❌ 修复前
<div style={{ right: 46 }}>  // 太小，覆盖了右侧按钮

// ✅ 修复后
<div style={{ right: 200 }}>  // 为右侧按钮留出空间
```

#### 模式3：添加条件判断
```typescript
// 问题：某些情况下逻辑错误
// 修复：添加边界检查

// ❌ 修复前
const result = data.map(item => item.value);

// ✅ 修复后
const result = data?.length > 0 ? data.map(item => item.value) : [];
```

---

### Step 4: 执行修复

```bash
# 1. 备份原文件（可选）
cp src/path/to/file.tsx src/path/to/file.tsx.bak

# 2. 使用 Edit 工具修改文件
# （通过 Claude 的 Edit 工具）

# 3. 验证语法正确
npm run lint
```

---

### Step 5: 验证修复

**验证步骤**：
```bash
# 1. 构建检查
npm run build

# 2. 启动开发服务器
npm run dev

# 3. 手动测试
# - 复现问题的步骤
# - 验证问题是否解决
# - 检查是否引入新问题

# 4. 检查控制台
# - 是否有报错
# - 是否有警告
```

**验证清单**：
- [ ] 问题是否解决？
- [ ] 是否引入新问题？
- [ ] 是否影响其他功能？
- [ ] 控制台是否有报错？
- [ ] 构建是否成功？

---

## 常见Bug类型与修复

### 1. UI 层级问题

**问题**：元素被遮挡、无法点击

**定位**：
```bash
# 搜索 z-index
grep -n "zIndex\|z-index" src/path/to/file.tsx

# 搜索 position
grep -n "position.*fixed\|position.*absolute" src/path/to/file.tsx
```

**修复**：
- 调整 `z-index` 值
- 调整 `position` 属性
- 减小覆盖区域范围

---

### 2. 窗口拖动区域问题

**问题**：拖动区域覆盖了可点击元素

**定位**：
```typescript
// Electron 窗口拖动区域
style={{ WebkitAppRegion: 'drag' }}
```

**修复**：
```typescript
// ❌ 修复前：拖动区域太大
<div style={{
  WebkitAppRegion: 'drag',
  right: 46,  // 太小，覆盖了右侧按钮
}}>

// ✅ 修复后：为按钮留出空间
<div style={{
  WebkitAppRegion: 'drag',
  right: 200,  // 为用户下拉菜单和其他按钮留出足够空间
}}>
```

---

### 3. 下拉菜单无法点击

**问题**：Dropdown 无法展开

**常见原因**：
1. 被其他元素遮挡（z-index）
2. 被拖动区域覆盖（WebkitAppRegion）
3. 事件被阻止（stopPropagation）
4. 父元素 overflow 隐藏

**修复步骤**：
1. 检查 z-index
2. 检查拖动区域范围
3. 添加 `WebkitAppRegion: 'no-drag'` 到可点击元素
4. 调整 overflow 属性

---

### 4. 数据过滤问题

**问题**：筛选不生效、数据显示错误

**定位**：
```bash
# 搜索 API 调用
grep -n "api\.\|apiRequest" src/path/to/file.tsx

# 搜索过滤逻辑
grep -n "filter\|where" src/path/to/file.tsx
```

**修复**：
- 检查 API 参数是否正确传递
- 检查后端 DTO 是否支持该参数
- 检查前端是否过滤了 null/undefined

---

## 修复模板

### 窗口拖动区域问题修复模板

```typescript
// src/layouts/index.tsx

// 修复前
<div
  style={{
    position: 'fixed',
    top: 0,
    left: 80,
    right: 46,  // ❌ 太小，覆盖了右侧按钮
    height: 48,
    zIndex: 999,
    WebkitAppRegion: 'drag',
  }}
/>

// 修复后
<div
  style={{
    position: 'fixed',
    top: 0,
    left: 80,
    right: 200,  // ✅ 为右侧按钮留出足够空间（用户下拉菜单 + 其他按钮）
    height: 48,
    zIndex: 999,
    WebkitAppRegion: 'drag',
  }}
/>
```

**修复说明**：
- **问题**：窗口拖动区域覆盖了用户下拉菜单，导致无法点击
- **原因**：`right: 46` 太小，没有为右侧按钮留出足够空间
- **修复**：将 `right` 调整为 `200`，为用户下拉菜单和其他按钮留出空间
- **影响**：拖动区域变小，但不影响正常使用，且解决了下拉菜单点击问题

---

## 验证清单

修复完成后，必须验证：

- [ ] ✅ 问题是否解决？（测试原问题场景）
- [ ] ✅ 是否引入新问题？（测试相关功能）
- [ ] ✅ 是否影响其他功能？（测试拖动功能）
- [ ] ✅ 控制台是否有报错？（检查开发者工具）
- [ ] ✅ 构建是否成功？（npm run build）
- [ ] ✅ 代码是否符合规范？（npm run lint）

---

## 最佳实践

### DO（应该做）

- ✅ **快速定位**：先找到问题代码再修复
- ✅ **最小修改**：只改必要的地方
- ✅ **添加注释**：说明修复原因
- ✅ **验证测试**：修复后必须验证
- ✅ **记录问题**：记录问题原因和修复方案

### DON'T（不应该做）

- ❌ **不要盲目修改**：不理解问题就改代码
- ❌ **不要过度优化**：修复bug时顺便重构
- ❌ **不要忽略测试**：改完就提交
- ❌ **不要破坏兼容**：修复导致其他功能失效
- ❌ **不要硬编码**：用临时方案代替正确修复

---

## 相关技能

- 产品设计技能：`.claude/skills/product-design/SKILL.md`
- 配置驱动开发：`.claude/skills/config-driven-development/SKILL.md`
- 前后端全链路：`.claude/skills/fullstack-integration/SKILL.md`

---

## 更新日志

### v1.0.0 (2026-02-11)
- 初始版本
- 定义Bug修复流程（5步）
- 提供常见Bug类型与修复方法
- 添加窗口拖动区域问题修复模板
- 添加验证清单和最佳实践
