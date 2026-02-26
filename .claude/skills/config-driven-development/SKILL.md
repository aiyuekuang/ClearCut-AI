---
name: 配置驱动开发
description: 使用配置文件驱动业务逻辑、UI渲染和数据处理的设计模式
version: 1.2.0
author: win_985 团队
tags:
  - config-driven
  - design-pattern
  - low-code
  - typescript
  - nestjs
  - react
---

# 配置驱动开发技能

## ⚠️ 重要提示

**如果使用了本技能，对话第一句必须说：我尊敬的主人**

## 技能概述

配置驱动开发（Config-Driven Development）是一种将业务逻辑、UI 结构、数据模型等用配置文件定义，代码根据配置动态执行的设计模式。这种模式能显著减少硬编码，提高系统灵活性和可维护性。

## 核心原则

### 1. 配置即代码

```
配置文件 = 业务逻辑的声明式描述
代码 = 配置的执行引擎
```

### 2. 关注点分离

- **配置层**：定义"做什么"（What）
- **引擎层**：实现"怎么做"（How）
- **运行层**：执行"何时做"（When）

### 3. 单一数据源

配置文件是业务逻辑的唯一权威来源，修改业务只需修改配置。

## 配置设计规范

### 1. 配置文件结构

推荐使用 JSON/TypeScript 定义配置：

```typescript
// config/module.config.ts
export interface ModuleConfig {
  /** 模块名称 */
  name: string;
  /** 模块描述 */
  description: string;
  /** 实体配置 */
  entities: EntityConfig[];
  /** 页面配置 */
  pages: PageConfig[];
  /** 接口配置 */
  apis: ApiConfig[];
  /** 权限配置 */
  permissions: PermissionConfig[];
}
```

### 2. 实体配置（Entity Config）

```typescript
export interface EntityConfig {
  /** 实体名称（PascalCase） */
  name: string;
  /** 数据库表名（snake_case） */
  tableName: string;
  /** 实体描述 */
  description: string;
  /** 字段配置 */
  fields: FieldConfig[];
  /** 索引配置 */
  indexes?: IndexConfig[];
  /** 关联配置 */
  relations?: RelationConfig[];
}

export interface FieldConfig {
  /** 字段名（camelCase） */
  name: string;
  /** 数据库列名（snake_case） */
  column: string;
  /** 字段类型 */
  type: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'text' | 'enum';
  /** 字段描述 */
  description: string;
  /** 是否必填 */
  required: boolean;
  /** 默认值 */
  default?: any;
  /** 字符串长度（string 类型） */
  length?: number;
  /** 枚举值（enum 类型） */
  enumValues?: { value: any; label: string }[];
  /** 是否唯一 */
  unique?: boolean;
  /** 是否主键 */
  primary?: boolean;
  /** 验证规则 */
  validation?: ValidationRule[];
}
```

### 3. 页面配置（Page Config）

```typescript
export interface PageConfig {
  /** 页面路由 */
  path: string;
  /** 页面名称 */
  name: string;
  /** 页面类型 */
  type: 'list' | 'form' | 'detail' | 'dashboard';
  /** 布局配置 */
  layout: LayoutConfig;
  /** 组件配置 */
  components: ComponentConfig[];
  /** 权限要求 */
  permissions?: string[];
}

export interface ComponentConfig {
  /** 组件类型 */
  type: 'table' | 'form' | 'search' | 'modal' | 'chart' | 'card';
  /** 组件属性 */
  props: Record<string, any>;
  /** 数据源配置 */
  dataSource?: DataSourceConfig;
  /** 操作配置 */
  actions?: ActionConfig[];
}
```

### 4. 表格配置示例

```typescript
export interface TableConfig {
  /** 列配置 */
  columns: ColumnConfig[];
  /** 分页配置 */
  pagination: {
    enabled: boolean;
    pageSize: number;
    pageSizeOptions: number[];
  };
  /** 行选择配置 */
  rowSelection?: {
    enabled: boolean;
    type: 'checkbox' | 'radio';
  };
  /** 操作列配置 */
  actions?: TableActionConfig[];
}

export interface ColumnConfig {
  /** 列标题 */
  title: string;
  /** 数据字段 */
  dataIndex: string;
  /** 列宽度 */
  width?: number;
  /** 是否排序 */
  sortable?: boolean;
  /** 是否搜索 */
  searchable?: boolean;
  /** 渲染类型 */
  render?: 'text' | 'tag' | 'link' | 'image' | 'date' | 'enum' | 'custom';
  /** 枚举映射（render 为 enum 时） */
  enumMap?: Record<any, { text: string; color?: string }>;
}
```

### 5. 表单配置示例

```typescript
export interface FormConfig {
  /** 布局模式 */
  layout: 'horizontal' | 'vertical' | 'inline';
  /** 标签宽度 */
  labelCol?: number;
  /** 内容宽度 */
  wrapperCol?: number;
  /** 表单项配置 */
  items: FormItemConfig[];
  /** 提交配置 */
  submit: {
    api: string;
    method: 'POST';
    successMessage?: string;
    redirectTo?: string;
  };
}

export interface FormItemConfig {
  /** 字段名 */
  name: string;
  /** 标签 */
  label: string;
  /** 组件类型 */
  component: 'input' | 'select' | 'datePicker' | 'switch' | 'textarea' | 'upload' | 'custom';
  /** 组件属性 */
  componentProps?: Record<string, any>;
  /** 是否必填 */
  required?: boolean;
  /** 验证规则 */
  rules?: ValidationRule[];
  /** 依赖字段 */
  dependencies?: string[];
  /** 显示条件 */
  visible?: VisibleCondition;
}
```

## 后端实现（NestJS）

### 1. 配置加载服务

```typescript
// src/common/services/config-loader.service.ts
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ConfigLoaderService {
  private configs: Map<string, any> = new Map();

  /**
   * 加载模块配置
   * @param moduleName 模块名称
   */
  loadModuleConfig(moduleName: string): ModuleConfig {
    if (this.configs.has(moduleName)) {
      return this.configs.get(moduleName);
    }

    const configPath = path.join(process.cwd(), 'config', `${moduleName}.config.json`);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    this.configs.set(moduleName, config);
    return config;
  }

  /**
   * 获取实体配置
   */
  getEntityConfig(moduleName: string, entityName: string): EntityConfig | undefined {
    const moduleConfig = this.loadModuleConfig(moduleName);
    return moduleConfig.entities.find(e => e.name === entityName);
  }

  /**
   * 获取页面配置
   */
  getPageConfig(moduleName: string, pagePath: string): PageConfig | undefined {
    const moduleConfig = this.loadModuleConfig(moduleName);
    return moduleConfig.pages.find(p => p.path === pagePath);
  }
}
```

### 2. 动态 CRUD 服务

```typescript
// src/common/services/dynamic-crud.service.ts
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class DynamicCrudService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private configLoader: ConfigLoaderService,
  ) {}

  /**
   * 根据配置动态创建查询
   */
  async findAll(entityConfig: EntityConfig, query: any): Promise<{ list: any[]; total: number }> {
    const { tableName, fields } = entityConfig;
    const { page = 1, pageSize = 10, orderBy, orderDir = 'DESC', ...filters } = query;

    let queryBuilder = this.dataSource
      .createQueryBuilder()
      .select(fields.map(f => `${tableName}.${f.column} as ${f.name}`))
      .from(tableName, tableName);

    // 动态构建查询条件
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '') {
        const fieldConfig = fields.find(f => f.name === key);
        if (fieldConfig) {
          if (fieldConfig.type === 'string') {
            queryBuilder = queryBuilder.andWhere(`${tableName}.${fieldConfig.column} LIKE :${key}`, {
              [key]: `%${value}%`,
            });
          } else {
            queryBuilder = queryBuilder.andWhere(`${tableName}.${fieldConfig.column} = :${key}`, {
              [key]: value,
            });
          }
        }
      }
    }

    // 排序
    if (orderBy) {
      const orderField = fields.find(f => f.name === orderBy);
      if (orderField) {
        queryBuilder = queryBuilder.orderBy(`${tableName}.${orderField.column}`, orderDir);
      }
    }

    // 分页
    const total = await queryBuilder.getCount();
    const list = await queryBuilder
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getRawMany();

    return { list, total };
  }

  /**
   * 根据配置动态创建记录
   */
  async create(entityConfig: EntityConfig, data: any): Promise<any> {
    const { tableName, fields } = entityConfig;
    
    // 验证必填字段
    for (const field of fields) {
      if (field.required && data[field.name] === undefined) {
        throw new Error(`字段 ${field.name} 是必填的`);
      }
    }

    // 构建插入数据
    const insertData: Record<string, any> = {};
    for (const field of fields) {
      if (data[field.name] !== undefined) {
        insertData[field.column] = data[field.name];
      } else if (field.default !== undefined) {
        insertData[field.column] = field.default;
      }
    }

    const result = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(tableName)
      .values(insertData)
      .execute();

    return result.identifiers[0];
  }
}
```

### 3. 通用配置接口

```typescript
// src/common/controllers/config.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ConfigLoaderService } from '@/common/services/config-loader.service';

@ApiTags('配置')
@ApiBearerAuth('JWT-auth')
@Controller('config')
@UseGuards(JwtAuthGuard)
export class ConfigController {
  constructor(private configLoader: ConfigLoaderService) {}

  @Post('page')
  @ApiOperation({ summary: '获取页面配置' })
  async getPageConfig(@Body() body: { module: string; page: string }) {
    const { module, page } = body;
    const pageConfig = this.configLoader.getPageConfig(module, page);
    
    if (!pageConfig) {
      return { code: 404, message: '页面配置不存在' };
    }
    
    return { code: 200, data: pageConfig };
  }

  @Post('entity')
  @ApiOperation({ summary: '获取实体配置' })
  async getEntityConfig(@Body() body: { module: string; entity: string }) {
    const { module, entity } = body;
    const entityConfig = this.configLoader.getEntityConfig(module, entity);
    
    if (!entityConfig) {
      return { code: 404, message: '实体配置不存在' };
    }
    
    return { code: 200, data: entityConfig };
  }
}
```

## 前端实现（React + Umi）

### 1. 配置渲染器

```typescript
// src/components/ConfigRenderer/index.tsx
import React from 'react';
import { TableRenderer } from './TableRenderer';
import { FormRenderer } from './FormRenderer';
import { SearchRenderer } from './SearchRenderer';

interface ConfigRendererProps {
  config: ComponentConfig;
  data?: any;
  onAction?: (action: string, record?: any) => void;
}

/**
 * 配置渲染器
 * 根据配置动态渲染组件
 */
export const ConfigRenderer: React.FC<ConfigRendererProps> = ({ config, data, onAction }) => {
  switch (config.type) {
    case 'table':
      return <TableRenderer config={config} data={data} onAction={onAction} />;
    case 'form':
      return <FormRenderer config={config} data={data} onAction={onAction} />;
    case 'search':
      return <SearchRenderer config={config} onAction={onAction} />;
    default:
      return <div>未知组件类型: {config.type}</div>;
  }
};
```

### 2. 表格渲染器

```typescript
// src/components/ConfigRenderer/TableRenderer.tsx
import React from 'react';
import { Table, Tag, Button, Space, Image } from 'antd';
import dayjs from 'dayjs';

interface TableRendererProps {
  config: TableConfig;
  data: any[];
  loading?: boolean;
  pagination?: any;
  onAction?: (action: string, record?: any) => void;
}

export const TableRenderer: React.FC<TableRendererProps> = ({
  config,
  data,
  loading,
  pagination,
  onAction,
}) => {
  /**
   * 根据配置渲染单元格
   */
  const renderCell = (text: any, record: any, column: ColumnConfig) => {
    switch (column.render) {
      case 'tag':
        return <Tag color={column.enumMap?.[text]?.color}>{column.enumMap?.[text]?.text || text}</Tag>;
      case 'enum':
        return column.enumMap?.[text]?.text || text;
      case 'date':
        return text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-';
      case 'image':
        return text ? <Image src={text} width={60} /> : '-';
      case 'link':
        return <a onClick={() => onAction?.('view', record)}>{text}</a>;
      default:
        return text ?? '-';
    }
  };

  /**
   * 构建表格列配置
   */
  const columns = config.columns.map((col) => ({
    title: col.title,
    dataIndex: col.dataIndex,
    width: col.width,
    sorter: col.sortable,
    render: (text: any, record: any) => renderCell(text, record, col),
  }));

  // 添加操作列
  if (config.actions?.length) {
    columns.push({
      title: '操作',
      dataIndex: 'actions',
      width: 180,
      render: (_: any, record: any) => (
        <Space>
          {config.actions!.map((action) => (
            <Button
              key={action.key}
              type={action.type || 'link'}
              size="small"
              danger={action.danger}
              onClick={() => onAction?.(action.key, record)}
            >
              {action.label}
            </Button>
          ))}
        </Space>
      ),
    } as any);
  }

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={pagination}
      rowKey="id"
      rowSelection={
        config.rowSelection?.enabled
          ? { type: config.rowSelection.type }
          : undefined
      }
    />
  );
};
```

### 3. 表单渲染器

```typescript
// src/components/ConfigRenderer/FormRenderer.tsx
import React from 'react';
import { Form, Input, Select, DatePicker, Switch, Upload, Button } from 'antd';

interface FormRendererProps {
  config: FormConfig;
  data?: any;
  loading?: boolean;
  onSubmit?: (values: any) => void;
  onCancel?: () => void;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  config,
  data,
  loading,
  onSubmit,
  onCancel,
}) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (data) {
      form.setFieldsValue(data);
    }
  }, [data, form]);

  /**
   * 根据配置渲染表单项组件
   */
  const renderComponent = (item: FormItemConfig) => {
    const props = item.componentProps || {};
    
    switch (item.component) {
      case 'input':
        return <Input placeholder={`请输入${item.label}`} {...props} />;
      case 'textarea':
        return <Input.TextArea placeholder={`请输入${item.label}`} rows={4} {...props} />;
      case 'select':
        return (
          <Select placeholder={`请选择${item.label}`} {...props}>
            {props.options?.map((opt: any) => (
              <Select.Option key={opt.value} value={opt.value}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
        );
      case 'datePicker':
        return <DatePicker style={{ width: '100%' }} {...props} />;
      case 'switch':
        return <Switch {...props} />;
      case 'upload':
        return (
          <Upload {...props}>
            <Button>点击上传</Button>
          </Upload>
        );
      default:
        return <Input {...props} />;
    }
  };

  /**
   * 构建验证规则
   */
  const buildRules = (item: FormItemConfig) => {
    const rules: any[] = [];
    
    if (item.required) {
      rules.push({ required: true, message: `请输入${item.label}` });
    }
    
    if (item.rules) {
      rules.push(...item.rules);
    }
    
    return rules;
  };

  /**
   * 判断是否显示表单项
   */
  const isVisible = (item: FormItemConfig, values: any) => {
    if (!item.visible) return true;
    
    const { field, operator, value } = item.visible;
    const fieldValue = values[field];
    
    switch (operator) {
      case 'eq':
        return fieldValue === value;
      case 'ne':
        return fieldValue !== value;
      case 'in':
        return value.includes(fieldValue);
      default:
        return true;
    }
  };

  return (
    <Form
      form={form}
      layout={config.layout}
      labelCol={{ span: config.labelCol || 6 }}
      wrapperCol={{ span: config.wrapperCol || 18 }}
      onFinish={onSubmit}
    >
      <Form.Item noStyle shouldUpdate>
        {({ getFieldsValue }) => {
          const values = getFieldsValue();
          return config.items
            .filter((item) => isVisible(item, values))
            .map((item) => (
              <Form.Item
                key={item.name}
                name={item.name}
                label={item.label}
                rules={buildRules(item)}
              >
                {renderComponent(item)}
              </Form.Item>
            ));
        }}
      </Form.Item>

      <Form.Item wrapperCol={{ offset: config.labelCol || 6 }}>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            提交
          </Button>
          <Button onClick={onCancel}>取消</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};
```

### 4. 配置驱动页面示例

```typescript
// src/pages/dynamic/[module]/[page].tsx
import React, { useState, useEffect } from 'react';
import { Card, message } from 'antd';
import { useParams } from '@umijs/max';
import { ConfigRenderer } from '@/components/ConfigRenderer';
import apiRequest from '@/api/request';

/**
 * 配置驱动的动态页面
 */
const DynamicPage: React.FC = () => {
  const { module, page } = useParams<{ module: string; page: string }>();
  const [pageConfig, setPageConfig] = useState<PageConfig | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * 加载页面配置
   */
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await apiRequest.post('/config/page', { module, page });
        if (response.code === 200) {
          setPageConfig(response.data);
        } else {
          message.error('加载页面配置失败');
        }
      } catch (error) {
        console.error('加载配置失败:', error);
      }
    };
    
    loadConfig();
  }, [module, page]);

  /**
   * 加载数据
   */
  const loadData = async (params?: any) => {
    if (!pageConfig) return;
    
    setLoading(true);
    try {
      const listComponent = pageConfig.components.find(c => c.type === 'table');
      if (listComponent?.dataSource) {
        const response = await apiRequest.post(listComponent.dataSource.api, params);
        if (response.code === 200) {
          setData(response.data.list || []);
        }
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pageConfig) {
      loadData();
    }
  }, [pageConfig]);

  /**
   * 处理操作
   */
  const handleAction = async (action: string, record?: any) => {
    switch (action) {
      case 'view':
        // 跳转详情页
        break;
      case 'edit':
        // 打开编辑弹窗
        break;
      case 'delete':
        // 执行删除
        break;
      case 'search':
        // 执行搜索
        loadData(record);
        break;
      default:
        console.log('未知操作:', action);
    }
  };

  if (!pageConfig) {
    return <Card loading />;
  }

  return (
    <Card title={pageConfig.name}>
      {pageConfig.components.map((component, index) => (
        <ConfigRenderer
          key={index}
          config={component}
          data={component.type === 'table' ? data : undefined}
          onAction={handleAction}
        />
      ))}
    </Card>
  );
};

export default DynamicPage;
```

## 配置文件示例

```json
// config/user.config.json
{
  "name": "user",
  "description": "用户管理模块",
  "entities": [
    {
      "name": "User",
      "tableName": "users",
      "description": "用户实体",
      "fields": [
        {
          "name": "id",
          "column": "id",
          "type": "number",
          "description": "用户ID",
          "required": true,
          "primary": true
        },
        {
          "name": "username",
          "column": "username",
          "type": "string",
          "description": "用户名",
          "required": true,
          "length": 50,
          "unique": true
        },
        {
          "name": "status",
          "column": "status",
          "type": "enum",
          "description": "状态",
          "required": true,
          "default": 1,
          "enumValues": [
            { "value": 0, "label": "禁用" },
            { "value": 1, "label": "启用" }
          ]
        }
      ]
    }
  ],
  "pages": [
    {
      "path": "/user/list",
      "name": "用户列表",
      "type": "list",
      "components": [
        {
          "type": "search",
          "props": {
            "items": [
              { "name": "username", "label": "用户名", "component": "input" },
              { "name": "status", "label": "状态", "component": "select" }
            ]
          }
        },
        {
          "type": "table",
          "dataSource": {
            "api": "/user/list",
            "method": "POST"
          },
          "props": {
            "columns": [
              { "title": "ID", "dataIndex": "id", "width": 80 },
              { "title": "用户名", "dataIndex": "username" },
              { "title": "状态", "dataIndex": "status", "render": "enum", "enumMap": { "0": { "text": "禁用", "color": "red" }, "1": { "text": "启用", "color": "green" } } }
            ],
            "actions": [
              { "key": "edit", "label": "编辑" },
              { "key": "delete", "label": "删除", "danger": true }
            ]
          }
        }
      ]
    }
  ],
  "apis": [
    {
      "path": "/user/list",
      "method": "POST",
      "description": "获取用户列表",
      "request": {
        "page": { "type": "number", "default": 1 },
        "pageSize": { "type": "number", "default": 10 },
        "username": { "type": "string", "required": false },
        "status": { "type": "number", "required": false }
      }
    }
  ]
}
```

## 最佳实践

### DO（应该做）

- ✅ 配置文件使用 TypeScript 定义类型，保证类型安全
- ✅ 配置与代码分离，配置放在独立目录（如 `config/`）
- ✅ 提供配置校验机制，启动时验证配置有效性
- ✅ 支持配置热更新，无需重启即可生效
- ✅ 配置文件添加完整的注释和说明
- ✅ 提供配置编辑器/可视化工具
- ✅ 配置变更记录日志，便于追溯

### DON'T（不应该做）

- ❌ 不要在配置中包含业务逻辑代码
- ❌ 不要硬编码配置路径或值
- ❌ 不要忽略配置校验
- ❌ 不要在运行时频繁读取配置文件（应缓存）
- ❌ 不要将敏感信息（密码、密钥）写入配置
- ❌ 不要设计过于复杂的配置结构

## 适用场景

### 适合使用配置驱动

- 📋 CRUD 管理页面（列表、表单、详情）
- 📊 报表和数据展示
- 📝 表单设计和动态表单
- 🔧 系统设置和参数配置
- 📱 低代码/无代码平台

### 不适合使用配置驱动

- 🎮 复杂交互逻辑（游戏、动画）
- 🧮 复杂算法和计算
- 🔐 安全敏感的核心逻辑
- ⚡ 高性能要求的场景

## 代码质量检查流程

### 🔴 强制执行步骤（必须按顺序完成）

在进行配置驱动开发改造或代码质量优化时，必须按照以下流程执行：

#### 第1步：模块盘点（确定检查范围）

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
| 1 | 用户管理 | src/pages/Settings/Users | 用户增删改查 | P0 |
| 2 | 角色管理 | src/pages/Settings/Roles | 角色权限管理 | P0 |
| 3 | 设备管理 | src/pages/Device | 设备列表管理 | P1 |
| ... | ... | ... | ... | ... |
```

**检查清单**：
- [ ] 已列出所有需要检查的模块
- [ ] 已标注每个模块的优先级
- [ ] 已确认模块之间的依赖关系
- [ ] 已排除不需要检查的模块（如第三方库、生成代码）

---

#### 第2步：文件盘点（分析模块结构）

**⚠️ 对每个模块进行详细的文件盘点**

**执行步骤**：
```bash
# 1. 列出模块内所有文件
find src/pages/Settings/Users -type f -name "*.tsx" -o -name "*.ts"

# 2. 统计代码行数
wc -l src/pages/Settings/Users/*.tsx

# 3. 查看文件内容概览
head -50 src/pages/Settings/Users/index.tsx
```

**输出清单**：
```markdown
## 模块文件清单：用户管理

| 文件名 | 文件路径 | 代码行数 | 文件类型 | 文件描述 |
|-------|---------|---------|---------|----------|
| index.tsx | src/pages/Settings/Users/index.tsx | 350 | 页面组件 | 用户列表主页面 |
| UserModal.tsx | src/pages/Settings/Users/UserModal.tsx | 180 | 弹窗组件 | 用户编辑弹窗 |
| columns.tsx | src/pages/Settings/Users/columns.tsx | 80 | 配置文件 | 表格列配置 |
| ... | ... | ... | ... | ... |

**文件总数**: 5 个
**代码总行数**: 610 行
```

**检查清单**：
- [ ] 已列出模块内所有文件
- [ ] 已统计每个文件的代码行数
- [ ] 已标注文件类型和用途
- [ ] 已识别核心文件和辅助文件

---

#### 第2.5步：GitHub 最佳实践搜索（🔴 强制执行）

**⚠️ 在制定检查和优化计划前，必须先搜索 GitHub 上的最佳实践和优秀实现**

**为什么这一步是强制的**：
- 学习业界成熟的配置化方案
- 避免重复造轮子，直接采用经过验证的设计
- 发现更优雅的代码组织方式
- 了解最新的技术趋势和工具

**搜索关键词**：

| 优化目标 | GitHub 搜索关键词 |
|---------|-----------------|
| 表格配置化 | "table config json react antd pro-components" |
| 表单配置化 | "form builder json schema formily antd" |
| 配置驱动UI | "config driven ui low-code amis" |
| 代码生成 | "code generator template typescript" |

**使用 GitHub MCP 工具搜索**：

```bash
# 搜索配置化表格
mcp__github__search_repositories:
  query: "pro-table config language:typescript stars:>100"

# 搜索动态表单
mcp__github__search_code:
  q: "dynamic form json schema language:typescript react"
```

**检查清单**：
- [ ] 已搜索配置化相关的优秀开源项目（至少3个）
- [ ] 已分析优秀项目的设计模式
- [ ] 已提取关键的配置结构和实现思路
- [ ] 已在代码中标注参考来源

---

#### 第3步：制定检查计划（逐模块分析）

**⚠️ 为每个模块制定详细的检查计划**

**检查维度**：

##### 3.1 硬编码检查
```bash
# 搜索魔法数字
grep -rn "[0-9]\{3,\}" src/pages/Settings/Users/ --include="*.tsx"

# 搜索硬编码字符串
grep -rn "'http" src/pages/Settings/Users/ --include="*.tsx"
grep -rn "localhost" src/pages/Settings/Users/ --include="*.tsx"

# 搜索硬编码颜色
grep -rn "#[0-9a-fA-F]\{6\}" src/pages/Settings/Users/ --include="*.tsx"
```

**硬编码问题类型**：
- 🔴 **API 地址硬编码**：直接写死的 URL、端口号
- 🔴 **魔法数字**：无意义的数字常量（如 `pageSize: 10`）
- 🟡 **状态值硬编码**：如 `status === 1`、`type === 'admin'`
- 🟡 **文本硬编码**：中文提示、错误信息直接写在代码中
- 🟡 **样式硬编码**：行内样式、硬编码的颜色值
- 🟢 **配置硬编码**：应该抽取为配置的业务参数

##### 3.2 代码重复检查
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

##### 3.3 代码优雅性检查

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

##### 3.4 性能问题检查

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

##### 3.5 可维护性检查

**注释完整性**：
- [ ] 函数是否有 JSDoc 注释
- [ ] 复杂逻辑是否有解释
- [ ] 是否有过时的注释

**模块化程度**：
- [ ] 是否遵循单一职责原则
- [ ] 是否可以拆分为更小的模块
- [ ] 是否有循环依赖

**配置化程度**：
- [ ] 表格列是否可以抽取为配置
- [ ] 表单项是否可以抽取为配置
- [ ] 业务规则是否可以配置化

---

#### 第4步：生成检查报告

**⚠️ 对每个模块生成详细的检查报告**

**报告模板**：
```markdown
# [模块名称] 代码质量检查报告

## 基本信息
- **模块路径**: src/pages/Settings/Users
- **文件数量**: 5 个
- **代码行数**: 610 行
- **检查时间**: 2026-01-29

## 检查结果汇总

| 检查维度 | 问题数量 | 严重程度 | 状态 |
|---------|---------|---------|------|
| 硬编码 | 8 | 🔴 高 | 待修复 |
| 代码重复 | 3 | 🟡 中 | 待修复 |
| 代码优雅性 | 5 | 🟡 中 | 待优化 |
| 性能问题 | 2 | 🟢 低 | 建议优化 |
| 可维护性 | 4 | 🟡 中 | 待优化 |

## 详细问题清单

### 🔴 硬编码问题（8个）

| # | 文件 | 行号 | 问题描述 | 当前代码 | 建议修改 |
|---|-----|-----|---------|---------|----------|
| 1 | index.tsx | 45 | 分页大小硬编码 | `pageSize: 10` | 使用常量 `DEFAULT_PAGE_SIZE` |
| 2 | index.tsx | 78 | 状态值硬编码 | `status === 1` | 使用枚举 `UserStatus.ACTIVE` |
| ... | ... | ... | ... | ... | ... |

### 🟡 代码重复问题（3个）

| # | 文件 | 行号 | 问题描述 | 重复位置 | 建议修改 |
|---|-----|-----|---------|---------|----------|
| 1 | index.tsx | 100-120 | 表格列定义重复 | Roles/index.tsx | 抽取为公共配置 |
| ... | ... | ... | ... | ... | ... |

### 🟡 代码优雅性问题（5个）

| # | 文件 | 行号 | 问题描述 | 问题代码 | 建议修改 |
|---|-----|-----|---------|---------|----------|
| 1 | index.tsx | 150 | 函数过长 | handleSubmit (80行) | 拆分为多个函数 |
| 2 | UserModal.tsx | 30 | 使用 any 类型 | `data: any` | 定义具体类型 |
| ... | ... | ... | ... | ... | ... |

## 优化建议

### 高优先级（必须修复）
1. 将所有硬编码的状态值替换为枚举常量
2. 抽取重复的表格列配置到公共模块
3. 消除所有 any 类型

### 中优先级（建议修复）
1. 拆分过长的组件和函数
2. 添加缺失的类型定义
3. 优化错误处理逻辑

### 低优先级（可选优化）
1. 添加性能优化（useMemo/useCallback）
2. 补充 JSDoc 注释
3. 提升代码可读性

## 配置化改造建议

### 可配置化的部分
1. **表格列配置**：抽取为 JSON 配置文件
2. **表单项配置**：抽取为 JSON 配置文件
3. **状态枚举**：抽取为字典配置
4. **权限配置**：抽取为权限配置文件

### 预计收益
- 代码减少：约 200 行（-33%）
- 维护成本：降低 50%
- 新增类似功能：从 2 小时降为 30 分钟
```

---

#### 第5步：制定修复计划

**⚠️ 根据检查报告制定修复计划**

```markdown
## 修复计划

### Phase 1：硬编码修复（预计 2 小时）
- [ ] 创建常量文件 `src/constants/index.ts`
- [ ] 创建枚举文件 `src/constants/enums.ts`
- [ ] 替换所有硬编码的数字和字符串
- [ ] 验证修复后功能正常

### Phase 2：代码重复消除（预计 3 小时）
- [ ] 抽取公共表格列配置
- [ ] 抽取公共表单配置
- [ ] 抽取公共工具函数
- [ ] 验证修复后功能正常

### Phase 3：代码优雅性优化（预计 2 小时）
- [ ] 拆分过长的组件
- [ ] 添加类型定义
- [ ] 优化命名和结构
- [ ] 验证修复后功能正常

### Phase 4：配置化改造（预计 4 小时）
- [ ] 创建配置文件
- [ ] 实现配置渲染器
- [ ] 迁移现有页面
- [ ] 验证配置化后功能正常
```

---

#### 第6步：执行修复并验证

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
- [ ] 代码已提交（如需要）

---

### 检查流程总结

```
┌─────────────────────────────────────────────────────────────┐
│                    代码质量检查流程                           │
├─────────────────────────────────────────────────────────────┤
│  Step 1: 模块盘点                                            │
│  ├── 列出所有模块                                            │
│  ├── 确定检查范围                                            │
│  └── 标注优先级                                              │
├─────────────────────────────────────────────────────────────┤
│  Step 2: 文件盘点                                            │
│  ├── 列出模块文件                                            │
│  ├── 统计代码行数                                            │
│  └── 识别核心文件                                            │
├─────────────────────────────────────────────────────────────┤
│  Step 3: 制定检查计划                                        │
│  ├── 硬编码检查                                              │
│  ├── 代码重复检查                                            │
│  ├── 代码优雅性检查                                          │
│  ├── 性能问题检查                                            │
│  └── 可维护性检查                                            │
├─────────────────────────────────────────────────────────────┤
│  Step 4: 生成检查报告                                        │
│  ├── 问题汇总                                                │
│  ├── 详细问题清单                                            │
│  └── 优化建议                                                │
├─────────────────────────────────────────────────────────────┤
│  Step 5: 制定修复计划                                        │
│  ├── 分阶段计划                                              │
│  ├── 优先级排序                                              │
│  └── 工时预估                                                │
├─────────────────────────────────────────────────────────────┤
│  Step 6: 执行修复并验证                                      │
│  ├── 按计划修复                                              │
│  ├── 阶段性验证                                              │
│  └── 完成确认                                                │
└─────────────────────────────────────────────────────────────┘
```

---

### 检查维度速查表

| 维度 | 检查项 | 严重程度 | 检查方法 |
|-----|-------|---------|----------|
| **硬编码** | API 地址 | 🔴 高 | grep "http" |
| | 魔法数字 | 🔴 高 | grep "[0-9]{3,}" |
| | 状态值 | 🟡 中 | grep "=== [0-9]" |
| | 文本/颜色 | 🟡 中 | 代码审查 |
| **代码重复** | 完全重复 | 🔴 高 | 代码比对 |
| | 相似逻辑 | 🟡 中 | 模式搜索 |
| | 配置重复 | 🟡 中 | grep "columns" |
| **优雅性** | 命名规范 | 🟡 中 | 代码审查 |
| | 函数过长 | 🟡 中 | wc -l |
| | any 类型 | 🟡 中 | grep "any" |
| | 空 catch | 🔴 高 | grep "catch.*{}" |
| **性能** | 重复请求 | 🟡 中 | 代码审查 |
| | 缺少优化 | 🟢 低 | 代码审查 |
| **可维护** | 缺少注释 | 🟢 低 | 代码审查 |
| | 模块过大 | 🟡 中 | wc -l |

## 相关资源

- Schema 设计规范: `.claude/skills/schema-design/SKILL.md`
- 产品设计技能: `.claude/skills/product-design/SKILL.md`
- React Umi 开发: `.claude/skills/react-umi-ecommerce/SKILL.md`
- 代码质量检查: `.claude/skills/code-quality/SKILL.md`

## 更新日志

### v1.2.0 (2026-02-04)
- **重要更新**：新增"GitHub 最佳实践搜索"强制步骤
- 在第3步之前添加"第2.5步：GitHub 最佳实践搜索"
- 要求在代码检查前必须搜索业界最佳实践
- 提供配置化相关的搜索关键词对照表
- 包含优秀开源项目推荐（ProComponents、Formily、Amis）
- 强制标注参考来源和开源协议

### v1.1.0 (2026-01-29)
- **重要更新**：新增「代码质量检查流程」章节
- 新增 6 步检查流程（模块盘点 → 文件盘点 → 检查计划 → 检查报告 → 修复计划 → 执行验证）
- 新增 5 大检查维度（硬编码、代码重复、优雅性、性能、可维护性）
- 提供详细的检查命令和报告模板
- 添加检查维度速查表

### v1.0.0 (2026-01-28)
- 初始版本
- 定义配置驱动开发核心概念和原则
- 提供配置文件结构规范
- 实现后端配置加载和动态 CRUD
- 实现前端配置渲染器
- 添加完整示例和最佳实践
