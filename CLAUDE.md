# ClearCut-AI 项目规范

## 项目概述
ClearCut-AI (清剪) — 面向中文口播视频创作者的一键智能剪辑桌面应用。

## 技术栈
| 层级 | 技术 | 版本 |
|------|------|------|
| 桌面框架 | Electron | 33.x |
| 前端框架 | React | 19.x |
| 类型系统 | TypeScript | 5.x |
| 构建工具 | Vite | 6.x |
| 状态管理 | Zustand | 5.x |
| UI 组件库 | shadcn/ui + Radix |  |
| CSS | Tailwind CSS | 4.x |
| AI 引擎 | Python FastAPI Sidecar |  |

## 目录结构
```
electron/           # Electron 主进程
  main.ts           # 主进程入口
  preload.ts        # 预加载脚本
  ipc/              # IPC 处理器
  providers/        # LLM Provider 管理
src/                # React 前端
  app/              # 应用入口 + 路由
  components/       # 通用组件
    ui/             # shadcn/ui 基础组件
  pages/            # 页面
    home/           # 首页 (项目管理)
    editor/         # 编辑器主页
    settings/       # 设置页面
  stores/           # Zustand 状态管理
  hooks/            # 自定义 Hooks
  services/         # API 服务封装
  types/            # TypeScript 类型定义
  config/           # 配置文件 (配置驱动)
  lib/              # 工具函数
ai-engine/          # Python AI 引擎
  main.py           # FastAPI 入口
  routers/          # API 路由
  services/         # 核心服务
  templates/        # 字幕模板
```

## 编码规范

### TypeScript
- 使用 `type` 而非 `interface`（除非需要 declaration merging）
- 禁止使用 `any`，使用 `unknown` + 类型守卫
- 函数式组件使用箭头函数
- 文件命名：组件 PascalCase，工具 camelCase

### React
- 状态管理统一使用 Zustand
- 组件 props 就近定义 type
- 使用 shadcn/ui 组件，避免自己写基础 UI
- 路由使用 React Router v7

### CSS
- Tailwind CSS 优先，避免自定义 CSS
- 使用 CSS 变量定义主题色
- 暗色主题通过 `.dark` class 切换

### Electron IPC
- Channel 命名：`模块:动作`，如 `provider:list`, `project:import`
- Preload 统一通过 `window.api.模块.方法()` 暴露
- 主进程不直接操作 UI

### 配置驱动
- 模块配置放在 `src/config/` 目录
- 配置定义 "做什么"，引擎实现 "怎么做"
- 新增功能优先考虑能否通过配置实现

## IPC Channel 清单
| Channel | 说明 |
|---------|------|
| `provider:*` | LLM 提供商管理 |
| `project:*` | 项目管理 (导入/列表/删除) |
| `video:*` | 视频处理 (提取音频/导出) |
| `transcript:*` | 转录服务 |
| `subtitle:*` | 字幕生成/样式 |
| `settings:*` | 通用设置 |
| `app:*` | 应用级 (窗口/更新) |

## 商用合规
- 全部依赖 MIT/BSD/Apache 许可证
- FFmpeg 通过 CLI 调用 (独立进程)，LGPL 合规
- FunASR 模型需在"关于"页面注明出处
