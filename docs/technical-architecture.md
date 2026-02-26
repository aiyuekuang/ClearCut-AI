# ClearCut-AI 技术架构设计文档

> 版本: 2.0.0
> 更新日期: 2026-02-26

---

## 1. 产品定位

**ClearCut-AI** 是一款面向中文口播视频创作者的智能剪辑桌面应用。

**核心理念**: 编辑文字 = 编辑视频

**目标用户**: 知识博主、教程录制者、Vlog 创作者、播客录制者

**差异化优势**:
- 中文 ASR 原生优化（Paraformer-Large）
- 完全本地处理，隐私安全
- 桌面应用 GUI，体验好
- AI 智能分析（废话/坏镜头/重复检测）
- 智能字幕生成 + 多种样式模板

---

## 2. 系统架构

```
┌──────────────────────────────────────────────────────────┐
│                   Electron 桌面应用                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │              React + TypeScript UI                 │  │
│  │                                                    │  │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │  │
│  │  │ 文本编辑器│ │ 视频预览  │ │ 波形时间线         │  │  │
│  │  │(编辑=剪辑)│ │          │ │                   │  │  │
│  │  └──────────┘ └──────────┘ └───────────────────┘  │  │
│  │                                                    │  │
│  │  ┌──────────────────┐ ┌────────────────────────┐  │  │
│  │  │ 项目管理 / 设置   │ │ 字幕样式编辑器         │  │  │
│  │  └──────────────────┘ └────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
│                          │ IPC                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │             Electron Main Process                  │  │
│  │                                                    │  │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │  │
│  │  │ FFmpeg   │ │ 文件管理  │ │ Python Sidecar    │  │  │
│  │  │ CLI 调用  │ │          │ │ 管理              │  │  │
│  │  └──────────┘ └──────────┘ └───────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
│                          │ HTTP / Stdio                   │
│  ┌────────────────────────────────────────────────────┐  │
│  │            Python AI 引擎 (Sidecar)                │  │
│  │                                                    │  │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │  │
│  │  │ FunASR   │ │Silero VAD│ │ LLM 分析           │  │  │
│  │  │Paraformer│ │(静音检测) │ │(废话/坏镜头)       │  │  │
│  │  └──────────┘ └──────────┘ └───────────────────┘  │  │
│  │                                                    │  │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │  │
│  │  │ faster-  │ │ stable-ts│ │ 字幕引擎           │  │  │
│  │  │ whisper  │ │(词级对齐) │ │(pysubs2 + pycaps) │  │  │
│  │  └──────────┘ └──────────┘ └───────────────────┘  │  │
│  │                                                    │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │ 文本分析引擎 (填充词检测 / 重复检测)          │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 3. 技术选型

### 3.1 前端层

| 组件 | 选型 | 版本 | 许可证 | 理由 |
|------|------|------|--------|------|
| 桌面框架 | Electron | 33.x | MIT | 生态成熟，视频应用验证充分 |
| UI 框架 | React | 19.x | MIT | 组件生态丰富 |
| 类型系统 | TypeScript | 5.x | Apache-2.0 | 类型安全 |
| 构建工具 | Vite | 6.x | MIT | 快速 HMR |
| 状态管理 | Zustand | 5.x | MIT | 轻量、简洁 |
| UI 组件库 | shadcn/ui | latest | MIT | 可定制、美观 |
| CSS 方案 | Tailwind CSS | 4.x | MIT | 快速开发 |
| 视频播放 | video.js | 8.x | Apache-2.0 | 功能全面 |
| 波形渲染 | wavesurfer.js | 7.x | BSD-3 | 专业音频可视化 |

### 3.2 AI 引擎层 (Python Sidecar)

| 组件 | 选型 | 许可证 | 商用合规 | 理由 |
|------|------|--------|---------|------|
| 中文 ASR | FunASR Paraformer-Large | MIT(代码) + 自定义(模型) | 需注明出处 | 中文最佳开源模型，1300万+ 下载 |
| 多语言 ASR | faster-whisper (large-v3) | MIT | 完全免费 | 4x 加速，多语言覆盖 |
| 词级时间戳 | stable-ts | MIT | 完全免费 | Whisper 增强，精确词级别时间戳 |
| 语音检测 | Silero VAD | MIT | 完全免费 | 1ms 级检测 |
| 视频处理 | FFmpeg CLI | LGPL/GPL | CLI 调用合规 | 全格式支持，最成熟 |
| LLM 分析 | Claude/GPT API | 商业 API | 按量付费 | 废话识别、内容优化建议 |
| Python 框架 | FastAPI | MIT | 完全免费 | 高性能 HTTP 服务 |

### 3.3 字幕引擎层

| 组件 | 选型 | 许可证 | 商用合规 | 理由 |
|------|------|--------|---------|------|
| 字幕文件操作 | pysubs2 | MIT | 完全免费 | 零依赖，支持 SSA/ASS/SRT/VTT 格式 |
| 动画字幕渲染 | pycaps | MIT | 完全免费 | CSS 控制动画，TikTok 风格，CLI + Python API |
| 视频合成 | MoviePy | MIT | 完全免费 | Python 视频编辑，TextClip/SubtitlesClip |
| 简易字幕烧录 | Captacity | MIT | 完全免费 | 极简集成，词高亮/描边/阴影 |
| ASS 烧录 | FFmpeg `ass` 滤镜 | LGPL | CLI 调用合规 | ASS 原生渲染，卡拉OK/动画 |

### 3.4 许可证合规总结

> **原则**: 全链路 MIT/BSD/Apache 许可证，零许可费用，完全可闭源商用。

**合规要求清单**:

| 要求 | 做法 |
|------|------|
| FunASR 模型归属 | "关于"页面注明：语音识别技术由 FunASR (阿里巴巴达摩院) 提供 |
| FFmpeg LGPL 合规 | 通过 `child_process.spawn` 调用 CLI，属于独立进程，不受 GPL 传染 |
| 各 MIT/BSD 库 | 在应用内保留版权声明（通常在"开源许可"页面列出） |

**已排除的组件** (许可证不兼容):

| 组件 | 许可证 | 排除原因 |
|------|--------|---------|
| VideoCaptioner | GPL-3.0 | 衍生作品必须开源，闭源商业产品不能用 |
| Remotion | 自定义商业许可 | 公司超 3 人必须付费购买许可证 |
| PyonFX | LGPL-3.0 | 修改源码需开源修改部分，风险中等 |

### 3.5 通信方案

```
Electron Renderer (React)
    │
    │  IPC (contextBridge)
    ▼
Electron Main Process
    │
    ├── FFmpeg CLI (child_process.spawn)
    │     ├── 音频提取
    │     ├── 视频拼接导出
    │     └── ASS 字幕烧录
    │
    └── Python Sidecar (HTTP localhost:8765)
            │
            ├── FastAPI REST API
            ├── WebSocket (实时进度推送)
            └── SSE (流式转录结果)
```

---

## 4. 核心处理管线

### 4.1 视频导入与分析流程

```
1. 导入视频文件
   ↓
2. FFmpeg 提取音频 (16kHz WAV)
   ↓
3. Silero VAD 语音活动检测
   ├── 标记有声段 (speech segments)
   └── 标记静音段 (silence segments)
   ↓
4. ASR 转录 (FunASR Paraformer / faster-whisper)
   ├── 句级转录
   └── 词级时间戳对齐 (stable-ts)
   ↓
5. 智能分析
   ├── 静音段标记 (来自 VAD)
   ├── 填充词检测 (正则匹配中文语气词)
   ├── 重复段检测 (文本相似度分析)
   ├── 废片识别 (不完整句子/口误)
   └── LLM 内容分析 (可选，需 API Key)
   ↓
6. 生成编辑建议
   ├── 自动标记建议删除的段落
   ├── 按类型分类 (静音/废话/重复/坏镜头)
   └── 置信度评分
   ↓
7. 输出到编辑界面
```

### 4.2 字幕生成管线

```
1. 转录结果 (来自 4.1 步骤 4)
   ├── 句级文本 + 时间戳
   └── 词级文本 + 时间戳 (stable-ts)
   ↓
2. 字幕文件生成 (pysubs2)
   ├── 生成 SRT (简单字幕，纯文本 + 时间)
   └── 生成 ASS (高级字幕，含样式/动画)
   ↓
3. 样式应用 (分级方案)
   │
   ├─ [基础] ASS 样式 → FFmpeg ass 滤镜直出
   │   └ 字体/颜色/描边/阴影/位置/简单动画
   │
   ├─ [进阶] pycaps CSS 动画渲染
   │   └ TikTok 风格逐词弹出/高亮/卡拉OK
   │
   └─ [极简] Captacity 一行代码集成
       └ 词高亮/描边/阴影，快速出片
   ↓
4. 预览与调整
   ├── 前端实时预览字幕效果
   ├── 用户选择模板/自定义样式
   └── 调整字体/颜色/位置/动画
   ↓
5. 烧录输出
   ├── 硬字幕：FFmpeg 将字幕烧录到视频
   └── 软字幕：导出独立 SRT/ASS 文件
```

#### 4.2.1 字幕样式分级方案

**MVP (v1.0) — ASS + FFmpeg 直出**

```python
# 使用 pysubs2 生成 ASS 字幕文件
import pysubs2

subs = pysubs2.SSAFile()
style = pysubs2.SSAStyle(
    fontname="Plus Jakarta Sans",
    fontsize=22,
    primarycolor=pysubs2.Color(255, 255, 255),    # 白色文字
    outlinecolor=pysubs2.Color(0, 0, 0),           # 黑色描边
    outline=2,
    shadow=1,
    bold=True,
    alignment=2,  # 底部居中
)
subs.styles["Default"] = style

# 从转录结果填充字幕事件
for segment in transcript.segments:
    event = pysubs2.SSAEvent(
        start=pysubs2.make_time(s=segment.start_time),
        end=pysubs2.make_time(s=segment.end_time),
        text=segment.text,
    )
    subs.events.append(event)

subs.save("output.ass")

# FFmpeg 烧录
# ffmpeg -i input.mp4 -vf "ass=output.ass" -c:a copy output_with_subs.mp4
```

ASS 格式原生支持的样式能力：
- 字体/字号/加粗/斜体
- 文字颜色 + 描边颜色 + 阴影颜色
- 描边宽度 + 阴影偏移
- 位置（9 点定位 + 像素级精确定位 `\pos`）
- 透明度渐变（`\fad` 渐入渐出）
- 卡拉OK 逐词高亮（`\k` 标签，精确到每个字的时长）
- 旋转/缩放/移动动画（`\t` + `\move`）
- 多行字幕 + 自动换行

**v2.0 — pycaps TikTok 风格动画**

```python
from pycaps import VideoCaptioner

captioner = VideoCaptioner(
    video_path="input.mp4",
    template="modern",              # 预制模板
    animation="pop",                # 弹出动画 (pop/fade/slide/bounce)
    highlight_color="#E11D48",       # ClearCut 品牌红
    font="Plus Jakarta Sans",
    font_size=28,
)
captioner.render("output.mp4")
```

pycaps 额外能力（超越 ASS）：
- CSS3 动画系统（fade、pop、slide、bounce）
- 模板系统（预定义 + 自定义 + 分享）
- 词级别标记（正则/词表/AI 触发特定动画）
- Puppeteer/Playwright 渲染引擎（像素级精确）
- 完全离线运行

**v2.0 — Captacity 极简方案（备选）**

```python
import captacity

captacity.add_captions(
    video_file="input.mp4",
    output_file="output.mp4",
    font="/path/to/PlusJakartaSans.ttf",
    font_size=28,
    font_color="white",
    stroke_color="black",
    stroke_width=2,
    highlight_current_word=True,
    word_highlight_color="#E11D48",
)
```

### 4.3 视频导出流程

```
1. 用户在文本编辑器中确认/修改编辑决策
   ↓
2. 计算保留片段的时间线
   ↓
3. 字幕处理 (可选)
   ├── 根据编辑后的时间线重新对齐字幕
   ├── 应用用户选择的样式模板
   └── 生成 ASS/SRT 文件
   ↓
4. FFmpeg 导出
   ├── 视频拼接 (concat)
   ├── 字幕烧录 (可选，ass 滤镜)
   ├── 导出 MP4 (可选分辨率/码率)
   ├── 导出独立 SRT/ASS 字幕文件
   └── 导出时间线 (Premiere XML / FCPXML / EDL)
   ↓
5. 输出成品文件
```

---

## 5. 数据模型

### 5.1 项目模型

```typescript
interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  sourceVideo: string;       // 原始视频路径
  extractedAudio: string;    // 提取的音频路径
  duration: number;          // 视频时长 (秒)
  resolution: string;        // 分辨率
  fps: number;               // 帧率
  status: ProjectStatus;     // 处理状态
}

enum ProjectStatus {
  IMPORTED = 'imported',
  EXTRACTING_AUDIO = 'extracting_audio',
  DETECTING_SPEECH = 'detecting_speech',
  TRANSCRIBING = 'transcribing',
  ANALYZING = 'analyzing',
  READY = 'ready',
  EXPORTING = 'exporting',
  COMPLETED = 'completed',
}
```

### 5.2 转录模型

```typescript
interface Transcript {
  projectId: string;
  language: string;
  segments: TranscriptSegment[];
}

interface TranscriptSegment {
  id: string;
  startTime: number;         // 开始时间 (秒)
  endTime: number;           // 结束时间 (秒)
  text: string;              // 转录文本
  words: TranscriptWord[];   // 词级时间戳
  confidence: number;        // 置信度 0-1
  speaker?: string;          // 说话人标识
  editAction: EditAction;    // 编辑动作
  editReason?: EditReason;   // 编辑原因
}

interface TranscriptWord {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

enum EditAction {
  KEEP = 'keep',
  DELETE = 'delete',
  MUTE = 'mute',
}

enum EditReason {
  SILENCE = 'silence',
  FILLER_WORD = 'filler_word',
  REPETITION = 'repetition',
  BAD_TAKE = 'bad_take',
  MANUAL = 'manual',
}
```

### 5.3 字幕模型

```typescript
interface SubtitleConfig {
  projectId: string;
  enabled: boolean;            // 是否启用字幕
  format: SubtitleFormat;      // 输出格式
  burnIn: boolean;             // 是否烧录到视频 (硬字幕)
  style: SubtitleStyle;        // 样式配置
  animation: SubtitleAnimation; // 动画配置
}

enum SubtitleFormat {
  SRT = 'srt',
  ASS = 'ass',
  VTT = 'vtt',
}

interface SubtitleStyle {
  templateId?: string;         // 预制模板 ID
  fontFamily: string;          // 字体 (默认: Plus Jakarta Sans)
  fontSize: number;            // 字号 (默认: 22)
  fontWeight: 'normal' | 'bold';
  primaryColor: string;        // 文字颜色 (默认: #FFFFFF)
  outlineColor: string;        // 描边颜色 (默认: #000000)
  outlineWidth: number;        // 描边宽度 (默认: 2)
  shadowColor: string;         // 阴影颜色
  shadowOffset: number;        // 阴影偏移
  backgroundColor?: string;    // 背景色 (可选)
  position: SubtitlePosition;  // 位置
  maxCharsPerLine: number;     // 每行最大字数 (默认: 20)
}

interface SubtitlePosition {
  alignment: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;  // ASS 九宫格定位
  marginV: number;             // 垂直边距 (默认: 40)
  marginL: number;             // 左边距
  marginR: number;             // 右边距
}

interface SubtitleAnimation {
  type: AnimationType;
  highlightColor?: string;     // 当前词高亮颜色 (默认: #E11D48)
  fadeInMs?: number;           // 渐入时长
  fadeOutMs?: number;          // 渐出时长
}

enum AnimationType {
  NONE = 'none',               // 无动画，直接显示
  FADE = 'fade',               // 渐入渐出
  KARAOKE = 'karaoke',         // 卡拉OK 逐词高亮
  WORD_HIGHLIGHT = 'word_highlight', // 当前词变色
  POP = 'pop',                 // 逐词弹出 (需要 pycaps)
  SLIDE = 'slide',             // 滑入 (需要 pycaps)
  BOUNCE = 'bounce',           // 弹跳 (需要 pycaps)
  TYPEWRITER = 'typewriter',   // 打字机效果 (需要 pycaps)
}

// 预制字幕模板
interface SubtitleTemplate {
  id: string;
  name: string;                // 模板名称
  preview: string;             // 预览图路径
  style: SubtitleStyle;
  animation: SubtitleAnimation;
  engine: 'ass' | 'pycaps';   // 所需渲染引擎
}
```

**预制模板列表**:

| 模板 ID | 名称 | 样式 | 动画 | 引擎 |
|---------|------|------|------|------|
| `classic-white` | 经典白字 | 白字黑描边，底部居中 | 无 | ASS |
| `classic-yellow` | 经典黄字 | 黄字黑描边，底部居中 | 无 | ASS |
| `karaoke-glow` | 卡拉OK | 白字→青色高亮逐词变色 | karaoke | ASS |
| `fade-elegant` | 优雅渐入 | 白字半透明背景，300ms 渐入渐出 | fade | ASS |
| `tiktok-pop` | TikTok 弹出 | 大字加粗描边，逐词弹出 | pop | pycaps |
| `tiktok-highlight` | TikTok 高亮 | 白字→红色当前词高亮 | word_highlight | pycaps |
| `shorts-bounce` | Shorts 弹跳 | 居中大字，弹跳出现 | bounce | pycaps |
| `minimal-slide` | 极简滑入 | 小字无描边，从左滑入 | slide | pycaps |

---

## 6. 目录结构

```
ClearCut-AI/
├── docs/                          # 文档
│   ├── competitive-analysis.md    # 竞品分析
│   ├── technical-architecture.md  # 技术架构 (本文档)
│   └── prd.md                     # 产品需求文档
├── design-system/                 # 设计系统
│   └── clearcut-ai/
│       ├── MASTER.md              # 全局设计规范
│       └── pages/                 # 页面级设计
├── electron/                      # Electron 主进程
│   ├── main.ts                    # 主进程入口
│   ├── preload.ts                 # 预加载脚本
│   ├── ffmpeg.ts                  # FFmpeg 调用封装
│   └── python-sidecar.ts         # Python 引擎管理
├── src/                           # React 前端
│   ├── app/                       # 应用入口
│   ├── components/                # 通用组件
│   │   ├── ui/                    # shadcn/ui 组件
│   │   ├── video-player/          # 视频播放器
│   │   ├── transcript-editor/     # 文本编辑器
│   │   ├── waveform/              # 波形时间线
│   │   ├── subtitle-editor/       # 字幕样式编辑器
│   │   │   ├── StylePanel.tsx     # 样式面板 (字体/颜色/位置)
│   │   │   ├── TemplateGallery.tsx # 模板画廊
│   │   │   ├── AnimationPreview.tsx # 动画预览
│   │   │   └── SubtitlePreview.tsx  # 实时预览叠加层
│   │   └── layout/                # 布局组件
│   ├── pages/                     # 页面
│   │   ├── home/                  # 首页/项目管理
│   │   ├── editor/                # 编辑器主页
│   │   ├── export/                # 导出页面
│   │   └── settings/              # 设置页面
│   ├── stores/                    # Zustand 状态
│   │   ├── projectStore.ts        # 项目状态
│   │   ├── transcriptStore.ts     # 转录状态
│   │   ├── subtitleStore.ts       # 字幕状态
│   │   └── settingsStore.ts       # 设置状态
│   ├── hooks/                     # 自定义 Hooks
│   ├── services/                  # API 调用服务
│   └── types/                     # 类型定义
├── ai-engine/                     # Python AI 引擎
│   ├── main.py                    # FastAPI 入口
│   ├── routers/                   # API 路由
│   │   ├── transcribe.py          # 转录接口
│   │   ├── analyze.py             # 分析接口
│   │   ├── subtitle.py            # 字幕生成接口
│   │   └── export.py              # 导出接口
│   ├── services/                  # 核心服务
│   │   ├── asr_service.py         # ASR 语音识别
│   │   ├── vad_service.py         # VAD 语音检测
│   │   ├── timestamp_service.py   # stable-ts 词级时间戳
│   │   ├── filler_detector.py     # 填充词检测
│   │   ├── repeat_detector.py     # 重复段检测
│   │   ├── llm_analyzer.py        # LLM 分析
│   │   └── subtitle_service.py    # 字幕生成服务
│   │       ├── generator.py       # 字幕文件生成 (pysubs2)
│   │       ├── styler.py          # 样式应用 (ASS 标签)
│   │       └── animator.py        # 动画渲染 (pycaps)
│   ├── templates/                 # 字幕模板
│   │   ├── classic-white.json
│   │   ├── karaoke-glow.json
│   │   ├── tiktok-pop.json
│   │   └── ...
│   ├── models/                    # 数据模型
│   └── requirements.txt           # Python 依赖
├── resources/                     # 静态资源
│   ├── models/                    # AI 模型文件
│   ├── ffmpeg/                    # FFmpeg 二进制
│   └── fonts/                     # 字幕字体文件
├── package.json
├── tsconfig.json
├── vite.config.ts
├── electron-builder.yml
└── CLAUDE.md                      # 项目规范
```

---

## 7. 字幕引擎 API 设计

### 7.1 字幕生成接口

```
POST /api/subtitle/generate
```

**请求体**:
```json
{
  "projectId": "xxx",
  "format": "ass",
  "style": {
    "templateId": "karaoke-glow",
    "fontFamily": "Plus Jakarta Sans",
    "fontSize": 22
  },
  "animation": {
    "type": "karaoke",
    "highlightColor": "#22D3EE"
  }
}
```

**响应**:
```json
{
  "subtitleFile": "/path/to/output.ass",
  "previewFrames": ["/path/to/frame_001.png", "..."]
}
```

### 7.2 字幕烧录接口

```
POST /api/subtitle/burn
```

**请求体**:
```json
{
  "projectId": "xxx",
  "videoFile": "/path/to/edited.mp4",
  "subtitleFile": "/path/to/output.ass",
  "outputFile": "/path/to/final.mp4"
}
```

内部执行:
```bash
ffmpeg -i edited.mp4 -vf "ass=output.ass" -c:a copy final.mp4
```

### 7.3 高级动画渲染接口 (v2.0)

```
POST /api/subtitle/render-animated
```

**请求体**:
```json
{
  "projectId": "xxx",
  "videoFile": "/path/to/edited.mp4",
  "template": "tiktok-pop",
  "animation": "pop",
  "highlightColor": "#E11D48",
  "outputFile": "/path/to/final.mp4"
}
```

内部使用 pycaps 渲染引擎。

---

## 8. 开源依赖清单

### 8.1 Python 依赖 (requirements.txt)

```txt
# Web 框架
fastapi==0.115.*
uvicorn==0.34.*
websockets==14.*

# ASR 语音识别
funasr==1.2.*                  # MIT (代码) + 自定义 (模型)
faster-whisper==1.1.*          # MIT
stable-ts==2.17.*              # MIT

# 语音检测
silero-vad==5.*                # MIT (通过 torch.hub)
torch==2.5.*                   # BSD-3

# 字幕引擎
pysubs2==1.7.*                 # MIT
pycaps>=0.1                    # MIT (v2.0 引入)
moviepy==2.1.*                 # MIT
captacity>=0.1                 # MIT (备选方案)

# 文本分析
jieba==0.42.*                  # MIT (中文分词)
difflib                        # Python 标准库 (重复检测)

# 工具
numpy==2.1.*                   # BSD-3
pydantic==2.10.*               # MIT
```

### 8.2 商用合规检查表

| 依赖 | 许可证 | 商用 | 条件 |
|------|--------|------|------|
| FunASR | MIT + 模型协议 | ✅ | 注明出处 + 保留模型名称 |
| faster-whisper | MIT | ✅ | 保留版权声明 |
| stable-ts | MIT | ✅ | 保留版权声明 |
| Silero VAD | MIT | ✅ | 保留版权声明 |
| pysubs2 | MIT | ✅ | 保留版权声明 |
| pycaps | MIT | ✅ | 保留版权声明 |
| MoviePy | MIT | ✅ | 保留版权声明 |
| Captacity | MIT | ✅ | 保留版权声明 |
| FFmpeg | LGPL/GPL | ✅ | CLI 调用 (独立进程)，不静态链接 |
| PyTorch | BSD-3 | ✅ | 保留版权声明 |
| React/Electron 等 | MIT | ✅ | 保留版权声明 |

---

## 9. 性能指标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 转录速度 | >10x 实时 | 10 分钟视频 < 1 分钟处理 |
| VAD 检测延迟 | <1ms/帧 | Silero VAD 标准 |
| 字幕生成速度 | <5 秒 | 10 分钟视频的 ASS 字幕生成 |
| ASS 烧录速度 | >5x 实时 | FFmpeg ass 滤镜渲染 |
| pycaps 渲染速度 | >2x 实时 | TikTok 风格动画字幕 |
| 视频导出速度 | >5x 实时 | FFmpeg 无损拼接 |
| 应用启动时间 | <3 秒 | 冷启动到可用 |
| 内存占用 | <500MB | 不含模型加载 |
| 安装包大小 | <200MB | 不含 AI 模型 |

---

## 10. 版本迭代路线

### v1.0 (MVP)
- 视频导入 + 音频提取
- 语音转录 (FunASR/faster-whisper) + 文本编辑视频
- 自动静音去除 (Silero VAD)
- MP4 导出
- **SRT 字幕导出** (pysubs2 生成)
- **ASS 基础样式字幕** (字体/颜色/描边/位置)
- **3 个预制模板** (经典白字、经典黄字、卡拉OK)

### v1.5
- 填充词自动检测与去除
- 重复段检测
- 字幕烧录到视频 (FFmpeg ass 滤镜)
- 时间线导出 (Premiere XML / FCPXML / EDL)
- **字幕位置/动画精细调整**
- **渐入渐出动画** (ASS `\fad` 标签)

### v2.0
- LLM 智能分析 (废话/坏镜头检测)
- **TikTok 风格动画字幕** (pycaps 引擎)
- **8+ 预制模板** (pop/bounce/slide/typewriter)
- **自定义模板系统** (用户创建/导入/分享)
- 智能缩放/动态裁剪
- 批量处理

### v3.0
- 多说话人识别 + 说话人字幕分色
- AI B-Roll 建议
- 视频模板系统
- 多语言字幕 (翻译 + 双语并排)
- 多语言支持扩展

---

## 11. 开源项目参考

### 11.1 核心参考项目

| 项目 | Stars | 我们的用途 |
|------|-------|----------|
| [AutoCut](https://github.com/mli/autocut) | 7.5k | 文本编辑视频的交互范式参考 |
| [FunClip](https://github.com/modelscope/FunClip) | 5.3k | FunASR 集成方式参考 |
| [Auto-Editor](https://github.com/WyattBlue/auto-editor) | 4k | 静音检测 + FFmpeg 导出管线参考 |

### 11.2 字幕技术参考

| 项目 | Stars | 许可证 | 说明 |
|------|-------|--------|------|
| [stable-ts](https://github.com/jianfch/stable-ts) | 2.1k | MIT | 词级时间戳，直接集成 |
| [pysubs2](https://github.com/tkarabela/pysubs2) | — | MIT | ASS/SRT 文件操作，直接集成 |
| [pycaps](https://github.com/francozanardi/pycaps) | — | MIT | CSS 动画字幕，v2.0 集成 |
| [Captacity](https://github.com/unconv/captacity) | 134 | MIT | 极简字幕烧录，备选方案 |
| [subtitle-burner](https://github.com/jurczykpawel/subtitle-burner) | — | MIT | 8种模板+6种动画，UI 参考 |
| [PupCaps](https://github.com/hosuaby/PupCaps) | — | Apache-2.0 | CSS3 卡拉OK 效果，技术参考 |
| [whisper-timestamped](https://github.com/linto-ai/whisper-timestamped) | 2.7k | MIT | DTW 对齐参考 |
| [MoviePy](https://github.com/Zulko/moviepy) | 14.2k | MIT | Python 视频编辑，工具库 |

### 11.3 竞品参考

| 产品 | 字幕能力 | 我们的学习点 |
|------|---------|------------|
| CapCut | 130+ 语言，丰富动画模板 | 模板丰富度，一键生成体验 |
| Captions | 98% 准确率逐字动画 | 逐字动画精确度 |
| Opus Clip | 动态表情+关键词高亮 | 关键词高亮的交互设计 |
| Descript | 内嵌字幕编辑器 | 字幕与文本编辑器的联动 |
| FireCut | 50+ 语言动画字幕预设 | 预设系统的设计 |
