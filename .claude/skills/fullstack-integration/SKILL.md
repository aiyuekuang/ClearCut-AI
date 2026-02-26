---
name: 配置驱动的前后端全链路开发与测试
description: 前后端联调检查、配置驱动代码质量检查、实际参数测试
version: 1.2.0
author: win_985 团队
tags:
  - fullstack
  - integration
  - config-driven
  - testing
  - data-flow
---

# 配置驱动的前后端全链路开发与测试技能

## ⚠️ 重要提示

**如果严格按照本技能开始执行任务，对话第一句必须说：我尊敬的主人**

## 技能概述

本技能定义了配置驱动开发模式下的前后端全链路开发与测试流程，包括：
1. 前后端联调检查（确保数据流完整）
2. 配置驱动代码质量检查（确保代码可维护）
3. 实际参数测试（确保功能真正生效）

## 核心原则

### 1. 数据源头验证原则
> **永远从数据源头开始验证，不要假设后端已经实现。**

### 2. 配置驱动原则
> **能用配置实现的，不要硬编码。能复用的，不要重复。**

### 3. 实际参数测试原则
> **测试必须使用真实参数，不要用模拟数据。**

## 开发顺序

```
后端数据模型 → 后端 API (DTO) → 前端 API 层 → 前端 UI
```

**严禁**：只做前端 UI，跳过后端验证。

## 检查步骤

### Step 0: 模块盘点（最优先）

**⚠️ 在开始任何功能开发或测试前，必须先全面盘点所有模块**

#### 0.1 识别所有模块

**执行步骤**：
```bash
# 1. 列出前端页面模块
ls -la src/pages/

# 2. 列出后端业务模块
ls -la src/  # NestJS 项目

# 3. 列出 API 接口文件
ls -la src/api/

# 4. 列出共享组件
ls -la src/components/
```

**输出清单**：
```markdown
## 模块盘点清单

### 前端页面模块

| 序号 | 模块名称 | 路由路径 | 文件路径 | 主要功能 | 优先级 |
|-----|---------|---------|---------|---------|-------|
| 1 | 资源管理 | /resource | src/pages/Resource | 资源库CRUD | P0 |
| 2 | 坐席管理 | /settings/seats | src/pages/Settings/Seats | 坐席号码管理 | P0 |
| 3 | 用户管理 | /settings/users | src/pages/Settings/Users | 用户增删改查 | P0 |
| ... | ... | ... | ... | ... | ... |

### 后端业务模块

| 序号 | 模块名称 | 文件路径 | 主要功能 | 依赖模块 | 优先级 |
|-----|---------|---------|---------|---------|-------|
| 1 | 资源模块 | src/resource | 资源库管理 | numbers, datalib | P0 |
| 2 | 号码模块 | src/numbers | 号码管理 | resource | P0 |
| 3 | 用户模块 | src/users | 用户管理 | roles, auth | P0 |
| ... | ... | ... | ... | ... | ... |

### API 接口文件

| 序号 | 文件名 | 文件路径 | 服务的功能模块 | 接口数量 |
|-----|-------|---------|--------------|---------|
| 1 | resource.ts | src/api/resource.ts | 资源管理 | 8 |
| 2 | user.ts | src/api/user.ts | 用户管理 | 6 |
| ... | ... | ... | ... | ... |
```

**检查清单**：
- [ ] 已列出所有前端页面模块
- [ ] 已列出所有后端业务模块
- [ ] 已列出所有 API 接口文件
- [ ] 已标注模块之间的依赖关系
- [ ] 已标注优先级（P0/P1/P2）

#### 0.2 盘点每个模块的业务功能

**⚠️ 对每个模块进行详细的业务功能盘点**

**执行步骤**：
```bash
# 1. 读取模块代码，理解业务逻辑
cat src/pages/Resource/index.tsx | head -100

# 2. 查找模块的所有操作按钮和功能入口
grep -rn "Button\|onClick\|onSubmit" src/pages/Resource/

# 3. 查找模块调用的所有 API
grep -rn "api\.\|apiRequest" src/pages/Resource/

# 4. 查找后端模块的所有 Controller 方法
grep -rn "@Post\|@Get\|@Put\|@Delete" src/resource/*.controller.ts
```

**输出清单**：
```markdown
## 模块业务功能清单：资源管理

### 核心功能

| 功能名称 | 功能描述 | 前端入口 | API接口 | 后端实现 | 关联功能 | 状态 |
|---------|---------|---------|---------|---------|---------|------|
| 资源库列表 | 查看所有资源库 | 页面加载 | /resource/list | ✅ | - | ✅ 已实现 |
| 新增资源库 | 创建新的资源库 | "新增"按钮 | /resource/create | ✅ | - | ✅ 已实现 |
| 编辑资源库 | 修改资源库信息 | "编辑"按钮 | /resource/update | ✅ | - | ✅ 已实现 |
| 删除资源库 | 删除资源库 | "删除"按钮 | /resource/delete | ✅ | - | ✅ 已实现 |
| 省份筛选 | 按省份筛选资源库 | 筛选框 | /resource/list | ❌ | - | ❌ 未实现 |
| 导入号码 | 批量导入号码 | "导入"按钮 | /resource/import | ✅ | numbers模块 | ✅ 已实现 |
| 查看号码 | 查看资源库的号码列表 | "查看号码"按钮 | /numbers/list | ✅ | numbers模块 | ✅ 已实现 |

### 辅助功能

| 功能名称 | 功能描述 | 前端入口 | API接口 | 后端实现 | 关联功能 | 状态 |
|---------|---------|---------|---------|---------|---------|------|
| 搜索资源库 | 关键词搜索 | 搜索框 | /resource/list | ✅ | - | ✅ 已实现 |
| 分页 | 分页查询 | 分页组件 | /resource/list | ✅ | - | ✅ 已实现 |
| 排序 | 按字段排序 | 表格列头 | /resource/list | ✅ | - | ✅ 已实现 |
| 导出 | 导出资源库 | "导出"按钮 | /resource/export | ❌ | - | ❌ 未实现 |

### 关联功能检查

**资源库 → 号码管理**：
- [ ] 查看号码列表：✅ 已实现
- [ ] 添加号码：✅ 已实现
- [ ] 删除号码：✅ 已实现
- [ ] 号码筛选：❌ 未实现（缺少省份字段）

**资源库 → 数据字典**：
- [ ] 获取省份列表：❌ 未实现
- [ ] 获取运营商列表：✅ 已实现
- [ ] 获取号段类型：✅ 已实现

### 缺失功能清单

| 功能名称 | 缺失原因 | 影响范围 | 优先级 | 建议 |
|---------|---------|---------|-------|-----|
| 省份筛选 | DTO缺少province字段 | 用户无法按省份筛选 | 🔴 高 | 后端添加字段 |
| 导出功能 | 未实现接口 | 无法导出数据 | 🟡 中 | 实现导出接口 |
| 号码省份筛选 | Entity缺少province字段 | 号码筛选不完整 | 🔴 高 | 数据库迁移 |
```

**检查清单**：
- [ ] 已列出模块的所有核心功能
- [ ] 已列出模块的所有辅助功能
- [ ] 已检查每个功能的前端入口、API接口、后端实现
- [ ] 已识别所有关联功能
- [ ] 已检查关联功能是否完整实现
- [ ] 已列出所有缺失功能
- [ ] 已评估缺失功能的影响和优先级

#### 0.3 功能关联性检查

**⚠️ 检查功能之间的关联是否完整**

**检查维度**：

1. **数据流关联**：
   - [ ] A功能产生的数据，B功能能否正确读取？
   - [ ] A功能修改的数据，B功能能否同步更新？
   - [ ] A功能删除的数据，B功能是否有相应处理？

2. **业务逻辑关联**：
   - [ ] A功能触发时，是否需要调用B功能？
   - [ ] A功能的前置条件，是否由B功能提供？
   - [ ] A功能的结果，是否会影响B功能的行为？

3. **UI交互关联**：
   - [ ] A页面的操作按钮，是否会跳转到B页面？
   - [ ] A页面的筛选条件，B页面是否支持？
   - [ ] A页面的数据展示，是否依赖B页面的设置？

**示例检查**：
```markdown
### 功能关联检查：资源库 ↔ 号码管理

**数据流关联**：
- ✅ 资源库创建后，可以添加号码
- ✅ 资源库删除时，关联号码被级联删除
- ❌ 资源库按省份筛选时，号码列表未同步（缺少省份字段）

**业务逻辑关联**：
- ✅ 导入号码时，会校验资源库是否存在
- ✅ 查看号码列表时，会传递资源库ID
- ❌ 号码按省份筛选时，无法使用（号码表缺少province字段）

**UI交互关联**：
- ✅ 资源库列表点击"查看号码"，跳转到号码列表页
- ✅ 号码列表页显示所属资源库名称
- ❌ 号码列表页的省份筛选器不可用（后端不支持）
```

**检查清单**：
- [ ] 已检查所有模块间的数据流关联
- [ ] 已检查所有模块间的业务逻辑关联
- [ ] 已检查所有模块间的UI交互关联
- [ ] 已识别所有关联不完整的地方
- [ ] 已评估关联缺失的影响

---

### Step 0.5: GitHub 技术方案搜索（🔴 强制执行）

**⚠️ 在开始实现功能前，必须先在 GitHub 搜索类似的技术实现和解决方案**

**为什么这一步是强制的**：
- 学习成熟的技术方案，避免踩坑
- 发现最佳实践和设计模式
- 节省开发时间，提高代码质量
- 了解业界如何解决类似问题

##### 搜索流程

**1. 明确搜索目标**

根据当前要实现的功能，确定搜索关键词：

| 功能场景 | GitHub 搜索关键词 | 重点关注 |
|---------|-----------------|---------|
| 数据模型设计 | "entity design typeorm nestjs" | 字段设计、关系设计、索引优化 |
| DTO 验证 | "dto validation class-validator nestjs" | 验证规则、自定义验证器 |
| API 实现 | "rest api nestjs pagination filter" | 分页、筛选、排序实现 |
| 前端数据请求 | "api request react typescript" | 请求封装、错误处理 |
| 表单处理 | "form validation antd react" | 表单验证、动态表单 |
| 表格组件 | "pro-table antd config" | 表格配置、列定义 |
| WebSocket | "websocket nest-js real-time" | 实时通信实现 |
| 文件上传 | "file upload multer nestjs" | 文件处理、存储 |

**2. 使用 GitHub MCP 工具搜索**

```bash
# 搜索代码实现
mcp__github__search_code:
  q: "[功能关键词] language:typescript [技术栈]"
  per_page: 30

# 搜索相关仓库
mcp__github__search_repositories:
  query: "[功能描述] language:typescript stars:>100"
  per_page: 20
```

**示例：搜索分页和筛选的实现**

```bash
# 搜索 NestJS 中的分页实现
mcp__github__search_code:
  q: "pagination typeorm language:typescript nestjs"

# 搜索筛选查询的实现
mcp__github__search_code:
  q: "filter query builder typeorm language:typescript"
```

**3. 分析搜索结果**

对每个找到的实现进行评估：

**技术适配性**：
- [ ] 技术栈是否匹配（NestJS、TypeORM、React、Ant Design）
- [ ] 版本是否兼容（检查 package.json）
- [ ] 依赖是否过重
- [ ] 是否容易集成到现有项目

**代码质量**：
- [ ] 代码是否清晰易懂
- [ ] 是否有完整的类型定义
- [ ] 是否处理了错误情况
- [ ] 是否有性能优化

**功能完整性**：
- [ ] 是否覆盖了我们的需求
- [ ] 是否处理了边界情况
- [ ] 是否支持扩展
- [ ] 是否有测试用例

**4. 提取关键实现**

记录优秀的实现方式：

```markdown
### GitHub 参考：[功能名称]

#### 方案1：[仓库名称] (⭐ 推荐)
- **仓库链接**：https://github.com/xxx/xxx
- **关键文件**：src/xxx/xxx.service.ts
- **Stars**：XXX
- **实现方式**：
  - 使用了 QueryBuilder 实现动态筛选
  - 通过装饰器简化分页参数处理
  - 提供了通用的筛选接口

**核心代码片段**：
\`\`\`typescript
// 来源：https://github.com/xxx/xxx/blob/main/src/xxx.ts
// 动态构建查询条件
const queryBuilder = this.repository.createQueryBuilder('entity');
Object.entries(filters).forEach(([key, value]) => {
  if (value !== undefined) {
    queryBuilder.andWhere(\`entity.\${key} = :value\`, { value });
  }
});
\`\`\`

**我们的调整**：
- 增加了多租户隔离
- 支持模糊查询
- 优化了查询性能

#### 方案2：[仓库名称]
- **仓库链接**：https://github.com/yyy/yyy
- **关键文件**：src/yyy/yyy.controller.ts
- **实现方式**：
  - 使用装饰器验证 DTO
  - 自定义分页响应格式

**不适合的原因**：
- 技术栈不匹配（使用了 Prisma）
- 实现过于复杂
```

**5. 制定实现方案**

基于 GitHub 搜索结果，制定我们的实现方案：

```markdown
## 实现方案（基于 GitHub 参考）

### 后端实现
**参考项目**：[项目名称]（Stars: XXX）

**数据模型设计**（借鉴方案A）：
- 字段设计参考 XXX 项目
- 索引策略参考 YYY 项目
- 关系设计采用 ZZZ 模式

**DTO 设计**（借鉴方案B）：
- 使用 class-validator 验证
- 自定义验证器处理复杂逻辑
- 使用 Type() 装饰器转换类型

**Service 实现**（借鉴方案A + 自研）：
- 采用 QueryBuilder 动态构建查询
- 增加租户隔离逻辑
- 优化查询性能（添加索引提示）

### 前端实现
**参考项目**：[项目名称]（Stars: XXX）

**API 封装**（借鉴方案C）：
- 统一错误处理
- 自动过滤 null/undefined
- 请求拦截器添加认证头

**表格配置**（借鉴方案D）：
- 配置化列定义
- 通用渲染器
- 支持自定义列

**表单处理**（借鉴方案E）：
- 动态表单生成
- 自定义验证规则
- 表单项联动
```

**6. 记录参考来源**

在代码中标注参考来源：

```typescript
/**
 * 动态查询构建器
 *
 * @description 根据筛选条件动态构建 TypeORM 查询
 * @reference https://github.com/xxx/xxx/blob/main/src/query-builder.ts
 * @license MIT
 * @modified 2026-02-04
 * @changes
 *   - 增加了多租户隔离
 *   - 支持模糊查询（LIKE）
 *   - 优化了性能（使用索引提示）
 */
export class DynamicQueryBuilder {
  // 实现代码...
}
```

**检查清单**：
- [ ] 已使用 GitHub MCP 工具搜索相关实现（至少3个）
- [ ] 已分析搜索结果的技术适配性
- [ ] 已评估代码质量和功能完整性
- [ ] 已提取关键实现和设计思路
- [ ] 已制定基于参考的实现方案
- [ ] 已在代码中标注参考来源和 License
- [ ] 已记录我们对参考方案的调整

**⚠️ 注意事项**：
- 不要盲目复制代码，要理解原理后调整
- 检查开源协议（License）是否允许商用
- 优先选择维护活跃的项目（近期有更新）
- 参考多个项目，取长补短
- 标注代码来源，避免侵权

---

### Step 1: 检查后端数据模型

在开始任何功能开发前，先确认数据模型是否支持：

```typescript
// 例：资源库按省份筛选
// 问题：资源库或号码是否有省份字段？

// 检查 Entity 定义
@Entity('resource_library')
export class ResourceLibrary {
  // 是否有 province 字段？
  @Column({ nullable: true })
  province?: string;
}
```

**如果数据模型不支持，先补充数据模型。**

### Step 2: 检查后端 API (DTO)

确认 DTO 是否包含必要参数：

```typescript
// 检查 src/services/api/models/ 下的 DTO 定义
// 例：ListLibrariesDto.ts

export type ListLibrariesDto = {
  page?: number;
  pageSize?: number;
  accountId?: string;
  // ❌ 缺少 province 字段！
};
```

**如果 DTO 缺少字段**：
1. 后端添加字段到 DTO
2. 后端 Service 实现筛选逻辑
3. 重新生成 OpenAPI 客户端

### Step 3: 检查前端 API 层

确认前端 API 调用与后端 DTO 匹配：

```typescript
// ❌ 错误：后端 DTO 没有 province，传了也没用
const response = await resourceAPI.listLibraries({ 
  province: selectedProvince  // 被后端忽略！
});

// ✅ 正确：确认后端 DTO 支持后再传递
const response = await resourceAPI.listLibraries({ 
  province: selectedProvince  // 后端已添加支持
});
```

### Step 4: 实现前端 UI

确认以上步骤都完成后，再进行 UI 开发。

## 常见错误模式

### ❌ 错误示例：只做前端，忽略后端

```typescript
// 前端添加了省份选择器
const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

// 前端传了参数
await api.listLibraries({ province: selectedProvince });

// 但是！后端 DTO 没有 province 字段
// 结果：功能看似完成，实际筛选无效
```

**问题**：前端传参被后端忽略，功能看似完成实际无效。

### ✅ 正确做法

1. **先检查** `ListLibrariesDto` 是否有 `province` 字段
2. **如果没有**，先让后端添加该字段
3. **重新生成** OpenAPI 类型
4. **最后实现**前端逻辑

## 开发完成标准

功能开发完成前，必须验证：

- [ ] **数据流完整**：从后端数据库 → API → 前端展示，整条链路通畅
- [ ] **参数传递有效**：前端传的参数后端确实接收并处理
- [ ] **实际测试**：用真实数据或 Mock 验证功能是否生效
- [ ] **边界情况**：空数据、异常情况的处理

## 调试技巧

### 1. 检查请求参数

```typescript
// 开发时在 API 调用处添加日志
console.log('API Request:', params);
```

### 2. 检查 Network 面板

1. 请求参数是否正确发送
2. 后端响应是否包含预期数据
3. 筛选参数是否真的影响了返回结果

### 3. 验证后端是否处理参数

```typescript
// 后端 Service 添加临时日志
async listLibraries(dto: ListLibrariesDto) {
  console.log('Received params:', dto);
  // 检查 dto.province 是否有值
}
```

## 适用场景

- 新增筛选条件
- 新增表单字段
- 新增 API 参数
- 任何前后端数据交互的功能

---

# 配置驱动代码质量检查流程

## 🔴 强制执行步骤（必须按顺序完成）

在完成前后端联调后，必须进行配置驱动的代码质量检查，确保代码可维护、可复用。

### 第1步：模块盘点（确定检查范围）

**⚠️ 在开始检查前，必须先明确本次要检查的模块范围**

**执行步骤**：
```bash
# 1. 列出项目目录结构
ls -la src/pages/      # 前端页面模块
ls -la src/api/        # API 接口模块
ls -la src/components/ # 组件模块
ls -la src/            # 后端模块（NestJS）

# 2. 确定检查范围
# 根据任务目标，明确列出要检查的模块
```

**输出清单**：
```markdown
## 本次检查模块清单

| 序号 | 模块名称 | 模块路径 | 模块描述 | 优先级 |
|-----|---------|---------|---------|-------|
| 1 | 资源管理 | src/pages/Resource | 资源库管理 | P0 |
| 2 | 号码管理 | src/pages/Settings/Seats | 坐席号码管理 | P0 |
| ... | ... | ... | ... | ... |
```

**检查清单**：
- [ ] 已列出所有需要检查的模块
- [ ] 已标注每个模块的优先级
- [ ] 已确认模块之间的依赖关系
- [ ] 已排除不需要检查的模块（如第三方库、生成代码）

---

### 第2步：文件盘点（分析模块结构）

**⚠️ 对每个模块进行详细的文件盘点**

**执行步骤**：
```bash
# 1. 列出模块内所有文件
find src/pages/Resource -type f -name "*.tsx" -o -name "*.ts"

# 2. 统计代码行数
wc -l src/pages/Resource/*.tsx

# 3. 查看文件内容概览
head -50 src/pages/Resource/index.tsx
```

**输出清单**：
```markdown
## 模块文件清单：资源管理

| 文件名 | 文件路径 | 代码行数 | 文件类型 | 文件描述 |
|-------|---------|---------|---------|----------|
| index.tsx | src/pages/Resource/index.tsx | 450 | 页面组件 | 资源库列表主页面 |
| components/ProvinceTree.tsx | src/pages/Resource/components/ProvinceTree.tsx | 120 | 组件 | 省份树组件 |
| ... | ... | ... | ... | ... |

**文件总数**: 3 个
**代码总行数**: 570 行
```

**检查清单**：
- [ ] 已列出模块内所有文件
- [ ] 已统计每个文件的代码行数
- [ ] 已标注文件类型和用途
- [ ] 已识别核心文件和辅助文件

---

### 第3步：制定检查计划（逐模块分析）

**⚠️ 为每个模块制定详细的检查计划**

#### 3.1 硬编码检查

```bash
# 搜索魔法数字
grep -rn "[0-9]\{3,\}" src/pages/Resource/ --include="*.tsx"

# 搜索硬编码字符串
grep -rn "'http" src/pages/Resource/ --include="*.tsx"
grep -rn "localhost" src/pages/Resource/ --include="*.tsx"

# 搜索硬编码颜色
grep -rn "#[0-9a-fA-F]\{6\}" src/pages/Resource/ --include="*.tsx"
```

**硬编码问题类型**：
- 🔴 **API 地址硬编码**：直接写死的 URL、端口号
- 🔴 **魔法数字**：无意义的数字常量（如 `pageSize: 10`）
- 🟡 **状态值硬编码**：如 `status === 1`、`type === 'admin'`
- 🟡 **文本硬编码**：中文提示、错误信息直接写在代码中
- 🟡 **样式硬编码**：行内样式、硬编码的颜色值
- 🟢 **配置硬编码**：应该抽取为配置的业务参数

#### 3.2 代码重复检查

```bash
# 搜索相似的函数定义
grep -rn "const handle.*= async" src/pages/ --include="*.tsx"

# 搜索重复的 API 调用模式
grep -rn "apiRequest.post" src/pages/ --include="*.tsx"

# 搜索重复的表格列定义
grep -rn "title:.*dataIndex:" src/pages/ --include="*.tsx"
```

**代码重复问题类型**：
- 🔴 **完全重复代码**：复制粘贴的代码块
- 🔴 **相似逻辑重复**：功能相同但实现略有差异
- 🟡 **模式重复**：相似的代码结构（如 CRUD 操作）
- 🟡 **配置重复**：重复定义的表格列、表单项
- 🟢 **样板代码**：可以通过抽象减少的固定代码

#### 3.3 配置化程度检查（重点）

**⚠️ 这是配置驱动开发的核心检查项**

**检查内容**：
- [ ] **表格列配置**：是否可以抽取为 JSON 配置？
- [ ] **表单项配置**：是否可以抽取为 JSON 配置？
- [ ] **筛选条件配置**：是否可以抽取为配置？
- [ ] **状态枚举配置**：是否使用字典配置而非硬编码？
- [ ] **权限配置**：是否可以配置化？
- [ ] **业务规则配置**：是否可以配置化？

**可配置化判断标准**：
```typescript
// ❌ 硬编码表格列
const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '名称', dataIndex: 'name' },
  { title: '状态', dataIndex: 'status', render: (val) => val === 1 ? '启用' : '禁用' }
];

// ✅ 配置化表格列
const columns = tableConfig.columns.map(col => ({
  title: col.title,
  dataIndex: col.dataIndex,
  width: col.width,
  render: col.render === 'enum' ? (val) => col.enumMap[val]?.text : undefined
}));
```

#### 3.4 代码优雅性检查

**命名规范**：
- [ ] 变量名是否清晰表达用途（避免 `data1`、`temp`、`obj`）
- [ ] 函数名是否准确描述行为（动词开头：`get`、`set`、`handle`、`fetch`）
- [ ] 组件名是否符合 PascalCase
- [ ] 常量名是否使用 UPPER_SNAKE_CASE

**代码结构**：
- [ ] 函数是否过长（建议不超过 50 行）
- [ ] 组件是否过大（建议不超过 300 行）
- [ ] 嵌套层级是否过深（建议不超过 3 层）
- [ ] 是否存在回调地狱

**类型定义**：
- [ ] 是否使用了 `any` 类型
- [ ] 接口定义是否完整
- [ ] 是否缺少必要的类型注解

**错误处理**：
- [ ] 是否有空的 catch 块
- [ ] 错误提示是否友好
- [ ] 是否处理了边界情况

#### 3.5 性能问题检查

**React 性能**：
- [ ] 是否在渲染函数中创建新对象/函数
- [ ] 是否缺少 `useMemo`、`useCallback`
- [ ] 是否有不必要的重渲染
- [ ] 列表是否缺少 `key`

**数据请求**：
- [ ] 是否有重复请求
- [ ] 是否缺少加载状态
- [ ] 是否缺少错误处理
- [ ] 是否有请求竞态问题

---

### 第4步：生成检查报告

**⚠️ 对每个模块生成详细的检查报告**

**报告模板**：
```markdown
# [模块名称] 代码质量检查报告

## 基本信息
- **模块路径**: src/pages/Resource
- **文件数量**: 3 个
- **代码行数**: 570 行
- **检查时间**: 2026-01-29

## 检查结果汇总

| 检查维度 | 问题数量 | 严重程度 | 状态 |
|---------|---------|---------|------|
| 硬编码 | 12 | 🔴 高 | 待修复 |
| 代码重复 | 5 | 🟡 中 | 待修复 |
| 配置化程度 | 8 | 🔴 高 | 待优化 |
| 代码优雅性 | 6 | 🟡 中 | 待优化 |
| 性能问题 | 3 | 🟢 低 | 建议优化 |

## 详细问题清单

### 🔴 配置化问题（8个）- 最重要

| # | 文件 | 行号 | 问题描述 | 当前代码 | 建议修改 |
|---|-----|-----|---------|---------|----------|
| 1 | index.tsx | 50-80 | 表格列硬编码 | 直接定义 columns 数组 | 抽取为配置文件 |
| 2 | index.tsx | 120-160 | 表单项硬编码 | 直接定义 form items | 抽取为配置文件 |
| 3 | index.tsx | 200 | 状态值硬编码 | status === 1 | 使用字典配置 |
| ... | ... | ... | ... | ... | ... |

### 🔴 硬编码问题（12个）

| # | 文件 | 行号 | 问题描述 | 当前代码 | 建议修改 |
|---|-----|-----|---------|---------|----------|
| 1 | index.tsx | 45 | 分页大小硬编码 | pageSize: 10 | 使用常量 DEFAULT_PAGE_SIZE |
| 2 | index.tsx | 78 | 状态值硬编码 | status === 1 | 使用枚举 ResourceStatus.ACTIVE |
| ... | ... | ... | ... | ... | ... |

### 🟡 代码重复问题（5个）

| # | 文件 | 行号 | 问题描述 | 重复位置 | 建议修改 |
|---|-----|-----|---------|---------|----------|
| 1 | index.tsx | 100-120 | CRUD 操作重复 | Seats/index.tsx | 抽取为公共 Hook |
| ... | ... | ... | ... | ... | ... |

## 优化建议

### 🔴 高优先级（必须修复）
1. **配置化改造**：将表格列、表单项抽取为 JSON 配置
2. **状态枚举配置**：将所有硬编码的状态值替换为字典配置
3. **消除硬编码**：将所有魔法数字和硬编码字符串替换为常量

### 🟡 中优先级（建议修复）
1. 抽取重复的 CRUD 逻辑为公共 Hook
2. 拆分过长的组件和函数
3. 添加缺失的类型定义

### 🟢 低优先级（可选优化）
1. 添加性能优化（useMemo/useCallback）
2. 补充 JSDoc 注释

## 配置化改造建议（重点）

### 可配置化的部分
1. **表格列配置**：抽取为 `config/resource-table.config.ts`
2. **表单项配置**：抽取为 `config/resource-form.config.ts`
3. **筛选条件配置**：抽取为 `config/resource-search.config.ts`
4. **状态枚举**：使用后端字典接口

### 改造前后对比

**改造前**：
```typescript
// 450 行代码，硬编码表格列、表单项、筛选条件
const columns = [/* 80 行硬编码 */];
const formItems = [/* 100 行硬编码 */];
const searchItems = [/* 60 行硬编码 */];
```

**改造后**：
```typescript
// 150 行代码，使用配置驱动
import { tableConfig } from '@/config/resource-table.config';
import { formConfig } from '@/config/resource-form.config';
import { searchConfig } from '@/config/resource-search.config';

const columns = useTableColumns(tableConfig);
const formItems = useFormItems(formConfig);
const searchItems = useSearchItems(searchConfig);
```

### 预计收益
- **代码减少**：约 300 行（-67%）
- **维护成本**：降低 70%
- **新增类似功能**：从 3 小时降为 30 分钟
- **配置复用**：多个模块可共享配置
```

---

### 第5步：制定修复计划

**⚠️ 根据检查报告制定修复计划**

```markdown
## 修复计划

### Phase 1：配置化改造（预计 4 小时）- 最重要
- [ ] 创建配置文件目录 `src/config/`
- [ ] 抽取表格列配置（所有列表页面）
- [ ] 抽取表单项配置（所有表单页面）
- [ ] 抽取筛选条件配置
- [ ] 实现配置渲染器（TableRenderer, FormRenderer, SearchRenderer）
- [ ] 验证配置化后功能正常

### Phase 2：硬编码修复（预计 2 小时）
- [ ] 创建常量文件 `src/constants/index.ts`
- [ ] 创建枚举文件 `src/constants/enums.ts`
- [ ] 替换所有硬编码的数字和字符串
- [ ] 验证修复后功能正常

### Phase 3：代码重复消除（预计 3 小时）
- [ ] 抽取公共 CRUD Hook
- [ ] 抽取公共工具函数
- [ ] 验证修复后功能正常

### Phase 4：代码优雅性优化（预计 2 小时）
- [ ] 拆分过长的组件
- [ ] 添加类型定义
- [ ] 优化命名和结构
- [ ] 验证修复后功能正常
```

---

### 第6步：执行修复并验证

**⚠️ 按计划执行修复，每完成一个阶段必须验证**

**验证步骤**：
```bash
# 1. 运行 ESLint 检查
npm run lint

# 2. 运行 TypeScript 类型检查
npm run typecheck

# 3. 运行单元测试（如有）
npm run test

# 4. 手动功能测试
# - 列表加载正常
# - 搜索功能正常
# - 增删改查正常
# - 无控制台报错
```

**⚠️ 重要：测试时使用实际参数传递**

测试时必须使用真实的、实际的参数进行传递，而不是模拟数据：

```typescript
// ❌ 错误：使用硬编码/模拟参数测试
await api.getList({ page: 1, pageSize: 10 });  // 硬编码参数

// ✅ 正确：使用实际参数测试
const actualParams = form.getFieldsValue();  // 从表单获取实际参数
await api.getList(actualParams);
```

**为什么重要**：
- 真实参数能准确复现用户遇到的问题
- 真实数据包含边界值（空值、特殊字符、超长字符串）
- 避免"本地正常、线上出错"的情况

**验证清单**：
- [ ] ESLint 检查通过
- [ ] TypeScript 类型检查通过
- [ ] 功能测试通过
- [ ] **使用实际参数测试，而非模拟数据**
- [ ] 无新增 Bug
- [ ] 配置文件结构清晰
- [ ] 配置可复用性强

---

## 配置驱动开发最佳实践

### DO（应该做）

- ✅ **优先配置化**：表格列、表单项、筛选条件都应该配置化
- ✅ **使用字典**：状态值、类型值等使用后端字典接口
- ✅ **提取常量**：魔法数字、固定字符串提取为常量
- ✅ **复用配置**：相似功能共享配置
- ✅ **类型安全**：配置文件使用 TypeScript 定义类型
- ✅ **实际参数测试**：使用真实参数而非模拟数据

### DON'T（不应该做）

- ❌ **不要硬编码**：避免直接在代码中定义表格列、表单项
- ❌ **不要重复**：避免复制粘贴相似的代码
- ❌ **不要假设**：不要假设后端已实现，必须验证
- ❌ **不要跳过检查**：不要在前后端联调完成后就结束，必须进行代码质量检查
- ❌ **不要用模拟数据测试**：测试必须使用实际参数

---

## 检查流程总结

```
┌─────────────────────────────────────────────────────────────┐
│            配置驱动的前后端全链路开发与测试流程                │
├─────────────────────────────────────────────────────────────┤
│  Step 0: 模块盘点（最优先）                                   │
│  ├── 0.1 识别所有模块（前端/后端/API）                       │
│  ├── 0.2 盘点每个模块的业务功能                              │
│  │   ├── 核心功能清单                                        │
│  │   ├── 辅助功能清单                                        │
│  │   ├── 关联功能检查                                        │
│  │   └── 缺失功能清单                                        │
│  └── 0.3 功能关联性检查                                      │
│      ├── 数据流关联                                          │
│      ├── 业务逻辑关联                                        │
│      └── UI交互关联                                          │
├─────────────────────────────────────────────────────────────┤
│  Part 1: 前后端联调检查                                      │
│  ├── Step 1: 检查后端数据模型                                 │
│  ├── Step 2: 检查后端 API (DTO)                              │
│  ├── Step 3: 检查前端 API 层                                 │
│  └── Step 4: 实现前端 UI                                     │
├─────────────────────────────────────────────────────────────┤
│  Part 2: 配置驱动代码质量检查                                 │
│  ├── Step 1: 模块盘点                                        │
│  ├── Step 2: 文件盘点                                        │
│  ├── Step 3: 制定检查计划                                    │
│  │   ├── 硬编码检查                                          │
│  │   ├── 代码重复检查                                        │
│  │   ├── 配置化程度检查（重点）                              │
│  │   ├── 代码优雅性检查                                      │
│  │   └── 性能问题检查                                        │
│  ├── Step 4: 生成检查报告                                    │
│  ├── Step 5: 制定修复计划                                    │
│  └── Step 6: 执行修复并验证（使用实际参数测试）               │
└─────────────────────────────────────────────────────────────┘
```

---

## 相关技能

- 产品设计技能：`.claude/skills/product-design/SKILL.md`
- 配置驱动开发：`.claude/skills/config-driven-development/SKILL.md`
- 技能更新：`.claude/skills/skill-improvement/SKILL.md`

---

# Part 3: NestJS 多租户数据隔离规范

## 🎯 核心原则

**强制规则**：所有带 `companyId` 字段的实体，在进行 CRUD 操作时必须进行公司隔离。

## 识别触发条件（⚠️ 自动识别）

**在以下场景下，必须自动检查并应用公司隔离规范**：

### 触发场景 1：新增实体（Entity）
```typescript
// 当你看到实体定义包含 companyId 字段
@Entity('example')
export class Example {
  @Column({ nullable: true })
  companyId: string;  // 🔴 触发：需要公司隔离
}
```
**触发后行为**：立即检查该实体的所有 Service 方法是否正确处理公司隔离。

### 触发场景 2：新增/修改 Service 方法
```typescript
// 当你在 Service 中添加或修改方法，涉及数据库查询
async findAll() {
  return this.repository.find();  // 🔴 触发：需要检查是否缺少 companyId 过滤
}
```
**触发后行为**：检查该方法是否正确获取和使用 companyId。

### 触发场景 3：修复 Bug 或优化功能
```typescript
// 当用户报告数据混乱、权限问题
"用户A能看到用户B的数据"  // 🔴 触发：可能是公司隔离问题
```
**触发后行为**：立即运行公司隔离检查脚本。

### 触发场景 4：涉及以下实体类型
```
- SystemSetting（系统配置）
- Role（角色）
- Department（部门）
- FieldConfig（字段配置）
- QualityTemplate（质检模板）
- Dictionary（数据字典）
- Tag（标签）
- CustomerClaimConfig（客户领取配置）
- CustomerRecoveryRule（客户回收规则）
```
**触发后行为**：强制执行公司隔离规范检查。

---

## 🔍 公司隔离检查流程（强制执行）

### Step 1: 识别需要隔离的实体

**执行命令**：
```bash
# 查找所有带 companyId 字段的实体
find src/entities -name "*.entity.ts" -exec grep -l "companyId" {} \;
```

**输出清单**：
```markdown
## 需要公司隔离的实体清单

| 实体名称 | 文件路径 | Service文件 | 优先级 |
|---------|---------|------------|--------|
| SystemSetting | entities/system-setting.entity.ts | settings/settings.service.ts | 🔴 高 |
| Role | entities/role.entity.ts | seats/seats.service.ts | 🔴 高 |
| Department | entities/department.entity.ts | settings/settings.service.ts | 🔴 高 |
| ... | ... | ... | ... |
```

---

### Step 2: 检查每个实体的查询方法

**检查模式**：
```bash
# 查找所有可能缺少 companyId 过滤的查询
grep -rn "\.find\|\.findOne" src --include="*.service.ts" | \
  grep -v "companyId"
```

**检查清单**：
- [ ] `find()` 查询是否添加了 `companyId` 过滤？
- [ ] `findOne()` 查询是否添加了 `companyId` 过滤？
- [ ] `create()` 操作是否设置了 `companyId`？
- [ ] `update()` 操作是否验证了 `companyId`？
- [ ] `delete()` 操作是否验证了 `companyId`？

---

### Step 3: 应用标准实现模式

#### 模式 1: 查询单条数据
```typescript
// ❌ 错误：缺少 companyId 过滤
const entity = await this.repository.findOne({
  where: { id },
});

// ✅ 正确：添加 companyId 过滤
import { getDefaultCompanyId } from '@/common/utils/company.util';
import { IsNull } from 'typeorm';

const companyId = getDefaultCompanyId(req);
const entity = await this.repository.findOne({
  where: {
    id,
    companyId: companyId || IsNull(), // 支持全局配置和公司配置
  },
});
```

#### 模式 2: 查询列表数据
```typescript
// ❌ 错误：缺少 companyId 过滤
const entities = await this.repository.find({
  where: { isActive: true },
});

// ✅ 正确：添加 companyId 过滤
const companyId = getDefaultCompanyId(req);
const entities = await this.repository.find({
  where: {
    isActive: true,
    companyId, // 只返回当前公司的数据
  },
});
```

#### 模式 3: 创建数据
```typescript
// ❌ 错误：未设置 companyId
const entity = this.repository.create({
  name: dto.name,
});

// ✅ 正确：设置 companyId
const companyId = getDefaultCompanyId(req);
const entity = this.repository.create({
  name: dto.name,
  companyId: companyId || null, // 保存时设置 companyId
});
```

#### 模式 4: 更新数据
```typescript
// ❌ 错误：未验证 companyId
const entity = await this.repository.findOne({ where: { id } });
await this.repository.save({ ...entity, ...dto });

// ✅ 正确：验证 companyId
const companyId = getDefaultCompanyId(req);
const entity = await this.repository.findOne({
  where: {
    id,
    companyId, // 只能更新自己公司的数据
  },
});
if (!entity) {
  throw new BadRequestException('数据不存在或无权访问');
}
await this.repository.save({ ...entity, ...dto });
```

#### 模式 5: SystemSetting 特殊处理（支持全局配置）
```typescript
// SystemSetting 需要支持公司配置优先，没有则使用全局配置
async getSetting(settingKey: string, companyId?: string | null) {
  const settings = await this.systemSettingRepository.find({
    where: { settingKey },
  });

  // 优先使用公司配置
  let setting = companyId
    ? settings.find((s) => s.companyId === companyId)
    : settings.find((s) => s.companyId === null);

  // 如果没有公司配置，回退到全局配置
  if (!setting && companyId) {
    setting = settings.find((s) => s.companyId === null);
  }

  return setting;
}
```

---

### Step 4: 更新 Controller 传递 companyId

```typescript
// ❌ 错误：未传递 req 参数
@Post('list')
async getList(@Body() dto: ListDto) {
  return this.service.getList(dto);  // Service 无法获取 companyId
}

// ✅ 正确：传递 req 参数
@Post('list')
async getList(@Body() dto: ListDto, @Request() req: any) {
  return this.service.getList(dto, req);  // Service 可以获取 companyId
}
```

---

### Step 5: 运行自动化检查脚本

```bash
# 运行公司隔离问题检查脚本
./scripts/find-missing-company-filters.sh

# 查看详细报告
cat company-isolation-report.md
```

---

## 📝 开发规范（必须遵守）

### 规范 1: 方法签名必须包含 req 或 companyId 参数

```typescript
// ✅ 方案 1：接收 req 参数（推荐）
async getList(dto: ListDto, req?: any) {
  const companyId = getDefaultCompanyId(req);
  // ...
}

// ✅ 方案 2：接收 companyId 参数
async getList(dto: ListDto, companyId?: string | null) {
  // ...
}

// ✅ 方案 3：从关联实体获取 companyId
async getList(orderId: string) {
  const order = await this.ordersRepository.findOne({ where: { id: orderId } });
  const companyId = order.companyId;
  // ...
}
```

### 规范 2: 使用项目工具函数

```typescript
// ✅ 使用项目工具函数
import { getDefaultCompanyId } from '@/common/utils/company.util';
import { IsNull, In } from 'typeorm';

const companyId = getDefaultCompanyId(req);

// 语法 1：三元表达式（项目旧代码风格）
companyId: companyId ? companyId : IsNull()

// 语法 2：逻辑或（推荐，更简洁）
companyId: companyId || IsNull()
```

### 规范 3: 处理 TypeORM NULL 值

```typescript
// ❌ 错误：不能使用 null 字面量
where: {
  companyId: companyId || null,  // TypeORM 类型错误
}

// ✅ 正确：使用 IsNull() 操作符
import { IsNull } from 'typeorm';

where: {
  companyId: companyId || IsNull(),  // TypeORM 正确
}
```

### 规范 4: 添加导入声明

```typescript
// 必须导入的工具
import { Repository, In, IsNull } from 'typeorm';
import { getDefaultCompanyId } from '@/common/utils/company.util';
```

### 规范 5: 添加注释说明

```typescript
// 查询角色时过滤公司ID，支持全局角色和公司角色
const roles = await this.rolesRepository.find({
  where: {
    id: In(roleIds),
    companyId: companyId || IsNull(), // 支持全局角色和公司角色
  },
});
```

---

## 🛠️ 修复模板

### 完整修复示例

**修复前**：
```typescript
// seats.service.ts
async getAvailableRoles(): Promise<Role[]> {
  const roles = await this.rolesRepository.find({
    order: { name: 'ASC' },
  });
  return roles;
}
```

**修复后**：
```typescript
// seats.service.ts
import { IsNull } from 'typeorm';
import { getDefaultCompanyId } from '@/common/utils/company.util';

/**
 * 获取所有可用角色列表（用于前端选择）
 * @param companyId 公司ID（可选，用于公司隔离）
 */
async getAvailableRoles(companyId?: string | null): Promise<Role[]> {
  // 查询角色时过滤公司ID，支持全局角色和公司角色
  const roles = await this.rolesRepository.find({
    where: {
      companyId: companyId || IsNull(), // 支持全局角色和公司角色
    },
    order: { name: 'ASC' },
  });
  return roles;
}
```

**Controller 修复**：
```typescript
// seats.controller.ts
@Post('available-roles')
async getAvailableRoles(@Request() req: any) {
  const companyId = req.headers['x-company-id'];
  const roles = await this.seatsService.getAvailableRoles(companyId);
  return { code: 0, data: roles, message: 'success' };
}
```

---

## 🚨 常见错误（禁止）

### 错误 1: 忘记导入 IsNull
```typescript
// ❌ 错误：IsNull is not defined
where: { companyId: companyId || IsNull() }

// ✅ 正确：导入 IsNull
import { IsNull } from 'typeorm';
```

### 错误 2: 变量作用域问题
```typescript
// ❌ 错误：companyId 在 if 块内定义，外部无法使用
if (!effectiveRoleIds) {
  const companyId = getDefaultCompanyId(req);
}
// companyId 未定义！

// ✅ 正确：在外部定义
const companyId = getDefaultCompanyId(req);
if (!effectiveRoleIds) {
  // 使用 companyId
}
```

### 错误 3: 忘记传递 req 参数
```typescript
// ❌ 错误：Service 方法添加了 companyId 参数，但 Controller 未传递
// Controller
async getList(@Body() dto: ListDto) {
  return this.service.getList(dto);  // 缺少 req 参数！
}

// ✅ 正确：Controller 传递 req
async getList(@Body() dto: ListDto, @Request() req: any) {
  return this.service.getList(dto, req);
}
```

---

## 📊 检查清单（每次修复必查）

完成公司隔离修复后，必须检查：

- [ ] 所有 `findOne`/`find` 查询都添加了 `companyId` 过滤？
- [ ] 所有 `create`/`save` 操作都设置了 `companyId`？
- [ ] 方法签名是否有 `req` 参数或 `companyId` 参数？
- [ ] 是否正确导入了 `IsNull` 和 `getDefaultCompanyId`？
- [ ] 是否考虑了全局配置和公司配置的优先级？
- [ ] Controller 是否传入了 `req` 参数？
- [ ] 是否添加了注释说明公司隔离逻辑？
- [ ] 代码是否能成功构建（`npm run build`）？
- [ ] 是否已清除 Redis 缓存并测试？

---

## 🎯 自动识别逻辑（集成到开发流程）

**在开始任何功能开发时，自动执行以下检查**：

```typescript
/**
 * 公司隔离自动识别函数
 *
 * 使用场景：
 * - 创建新的 Entity
 * - 创建新的 Service 方法
 * - 修改现有的 Service 方法
 * - 用户报告数据混乱问题
 */
function shouldApplyCompanyIsolation(context: DevelopmentContext): boolean {
  // 检查 1: Entity 是否有 companyId 字段
  if (context.entityHasCompanyId) {
    return true;  // 🔴 必须应用公司隔离
  }

  // 检查 2: 是否在操作以下实体
  const isolatedEntities = [
    'SystemSetting', 'Role', 'Department', 'FieldConfig',
    'QualityTemplate', 'Dictionary', 'Tag', 'CustomerClaimConfig',
    'CustomerRecoveryRule', 'Order', 'CallTask', 'Seat'
  ];
  if (isolatedEntities.includes(context.entityName)) {
    return true;  // 🔴 必须应用公司隔离
  }

  // 检查 3: 是否在 Service 中进行数据库查询
  if (context.hasDatabaseQuery) {
    return true;  // 🟡 建议检查是否需要公司隔离
  }

  return false;
}
```

---

## 🔗 相关文档

- 公司隔离问题清单：`COMPANY_ISOLATION_ISSUES.md`
- 公司隔离修复指南：`COMPANY_ISOLATION_FIX_GUIDE.md`
- 公司隔离排查报告：`company-isolation-report.md`
- 公司工具函数：`src/common/utils/company.util.ts`
- 全局常量：`src/common/constants/company.constant.ts`
- 检查脚本：`scripts/find-missing-company-filters.sh`

---

## 更新日志

### v1.3.0 (2026-02-11)
- **重要更新**：新增"NestJS 多租户数据隔离规范"（Part 3）
- 定义公司隔离识别触发条件（4种场景）
- 提供5步公司隔离检查流程
- 提供5种标准实现模式（查询、创建、更新、SystemSetting）
- 新增5条开发规范（方法签名、工具函数、NULL处理等）
- 提供完整修复模板和常见错误示例
- 新增公司隔离检查清单（8项必查）
- 集成自动识别逻辑到开发流程

### v1.2.0 (2026-02-04)
- **重要更新**：新增"GitHub 技术方案搜索"强制步骤
- 在 Step 1 之前添加"Step 0.5: GitHub 技术方案搜索"
- 要求在实现功能前必须搜索 GitHub 类似实现
- 提供功能场景与搜索关键词对照表
- 包含技术适配性、代码质量、功能完整性评估
- 强制记录参考来源和 License 信息

### v1.1.0 (2026-01-29)
- **重要更新**：新增 Step 0 模块盘点步骤（最优先）
- 新增模块业务功能盘点流程
- 新增功能关联性检查
- 新增缺失功能识别机制
- 创建配套脚本 check-modules.sh

### v1.0.0 (2026-01-29)
- 整合前后端联调检查流程
- 整合配置驱动代码质量检查流程（6步）
- 新增5大检查维度（硬编码、代码重复、配置化程度、代码优雅性、性能问题）
- 新增配置驱动开发最佳实践
- 新增完整的检查流程图
- 创建配套检查脚本（check-dataflow.sh, check-config.sh）
