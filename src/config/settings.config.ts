// Settings page configuration - defines all settings sections and items
// Config-driven: add a setting item here, the settings renderer shows it automatically

export type SettingItemType =
  | 'select'
  | 'slider'
  | 'input'
  | 'textarea'
  | 'switch'
  | 'tags'
  | 'path'
  | 'custom'

export type SettingItem = {
  key: string
  label: string
  description?: string
  type: SettingItemType
  defaultValue?: unknown
  props?: Record<string, unknown>
}

export type SettingSection = {
  id: string
  title: string
  icon: string
  items: SettingItem[]
}

export const settingsSections: SettingSection[] = [
  // ─────────────────────────────────────────
  // 通用设置
  // ─────────────────────────────────────────
  {
    id: 'general',
    title: '通用',
    icon: 'sliders-horizontal',
    items: [
      {
        key: 'general.projectsDir',
        label: '项目存储目录',
        description: '新建项目的默认保存位置',
        type: 'path',
        defaultValue: '',
        props: { placeholder: '默认：系统文稿目录 / ClearCut Projects' },
      },
      {
        key: 'general.checkForUpdates',
        label: '启动时检查更新',
        description: '自动检测是否有新版本可用',
        type: 'switch',
        defaultValue: true,
      },
      {
        key: 'general.autoSave',
        label: '自动保存',
        description: '关闭项目时自动保存编辑状态',
        type: 'switch',
        defaultValue: true,
      },
      {
        key: 'general.language',
        label: '界面语言',
        type: 'select',
        defaultValue: 'zh-CN',
        props: {
          options: [
            { value: 'zh-CN', label: '简体中文' },
            { value: 'zh-TW', label: '繁體中文' },
            { value: 'en', label: 'English' },
          ],
        },
      },
    ],
  },

  // ─────────────────────────────────────────
  // 资源与路径
  // ─────────────────────────────────────────
  {
    id: 'paths',
    title: '资源与路径',
    icon: 'folder-open',
    items: [
      {
        key: 'paths.modelsDir',
        label: 'AI 模型目录',
        description: '语音识别及 AI 模型的下载和缓存位置',
        type: 'path',
        defaultValue: '',
        props: { placeholder: '默认：~/Library/Application Support/ClearCut-AI/models' },
      },
      {
        key: 'paths.tempDir',
        label: '临时文件目录',
        description: '视频处理过程中的中间文件存储位置，处理完成后自动清理',
        type: 'path',
        defaultValue: '',
        props: { placeholder: '默认：系统临时目录 / clearcut-ai' },
      },
      {
        key: 'paths.ffmpegPath',
        label: 'FFmpeg 路径',
        description: '自定义 FFmpeg 可执行文件位置，留空使用内置版本',
        type: 'input',
        defaultValue: '',
        props: { placeholder: '留空使用内置 FFmpeg' },
      },
    ],
  },

  // ─────────────────────────────────────────
  // 语音识别
  // ─────────────────────────────────────────
  {
    id: 'asr',
    title: '语音识别',
    icon: 'mic',
    items: [
      {
        key: 'asr.language',
        label: '默认语言',
        type: 'select',
        defaultValue: 'zh',
        props: {
          options: [
            { value: 'zh', label: '中文' },
            { value: 'en', label: 'English' },
            { value: 'auto', label: '自动检测' },
          ],
        },
      },
      {
        key: 'asr.engine',
        label: 'ASR 引擎',
        type: 'select',
        defaultValue: 'funasr',
        props: {
          options: [
            { value: 'funasr', label: 'FunASR Paraformer（中文推荐）' },
            { value: 'whisper', label: 'faster-whisper（多语言）' },
          ],
        },
      },
      {
        key: 'asr.modelQuality',
        label: '模型规格',
        description: '更大的模型精度更高，但需要更多内存和时间',
        type: 'select',
        defaultValue: 'large',
        props: {
          options: [
            { value: 'large', label: '大模型 — 最高精度' },
            { value: 'medium', label: '中模型 — 均衡' },
            { value: 'small', label: '小模型 — 最快' },
          ],
        },
      },
      {
        key: 'asr.device',
        label: '计算设备',
        description: '有独立显卡时选 CUDA 可大幅提速，Apple Silicon 选 MPS',
        type: 'select',
        defaultValue: 'auto',
        props: {
          options: [
            { value: 'auto', label: '自动选择' },
            { value: 'cpu', label: 'CPU（兼容性最好）' },
            { value: 'cuda', label: 'CUDA（NVIDIA 显卡）' },
            { value: 'mps', label: 'MPS（Apple Silicon）' },
          ],
        },
      },
      {
        key: 'asr.hotwords',
        label: '热词（优先识别）',
        description: '专有名词、品牌名等，可提高识别准确率',
        type: 'tags',
        defaultValue: [],
        props: { placeholder: '输入词语后回车添加' },
      },
    ],
  },

  // ─────────────────────────────────────────
  // 智能剪辑
  // ─────────────────────────────────────────
  {
    id: 'edit',
    title: '智能剪辑',
    icon: 'wand-sparkles',
    items: [
      {
        key: 'edit.silenceThreshold',
        label: '静音阈值',
        description: '低于此分贝数视为静音片段',
        type: 'slider',
        defaultValue: -35,
        props: { min: -60, max: -10, step: 1, unit: ' dB' },
      },
      {
        key: 'edit.minSilenceDuration',
        label: '最短静音时长',
        description: '短于此时长的停顿不标记为静音',
        type: 'slider',
        defaultValue: 0.8,
        props: { min: 0.1, max: 3.0, step: 0.1, unit: ' s' },
      },
      {
        key: 'edit.fillerWords',
        label: '填充词列表',
        description: '未配置 AI 时使用字典匹配去除废话',
        type: 'tags',
        defaultValue: ['嗯', '啊', '那个', '然后', '就是', '就是说', '对对对', '这个'],
      },
      {
        key: 'edit.fillerPrompt',
        label: 'AI 去废话提示词',
        description: '配置 AI 提供商后启用，留空使用默认提示词',
        type: 'textarea',
        defaultValue: '',
        props: {
          rows: 6,
          placeholder:
            '留空使用默认提示词。自定义时需包含指令：找出废话词，并以 {"indices": [...]} 格式返回序号列表。',
        },
      },
    ],
  },

  // ─────────────────────────────────────────
  // 字幕默认设置
  // ─────────────────────────────────────────
  {
    id: 'subtitle',
    title: '字幕默认设置',
    icon: 'captions',
    items: [
      {
        key: 'subtitle.defaultTemplate',
        label: '默认样式模板',
        type: 'select',
        defaultValue: 'classic-white',
        props: {
          options: [
            { value: 'classic-white', label: '经典白字' },
            { value: 'classic-yellow', label: '经典黄字' },
            { value: 'karaoke-glow', label: '卡拉OK' },
            { value: 'fade-elegant', label: '优雅渐入' },
          ],
        },
      },
      {
        key: 'subtitle.defaultFont',
        label: '默认字体',
        type: 'select',
        defaultValue: 'PingFang SC',
        props: {
          options: [
            { value: 'PingFang SC', label: '苹方 PingFang SC（macOS）' },
            { value: 'Noto Sans SC', label: '思源黑体 Noto Sans SC' },
            { value: 'Source Han Serif SC', label: '思源宋体' },
            { value: 'Microsoft YaHei', label: '微软雅黑（Windows）' },
          ],
        },
      },
      {
        key: 'subtitle.defaultFontSize',
        label: '默认字号',
        type: 'slider',
        defaultValue: 22,
        props: { min: 12, max: 48, step: 1, unit: ' px' },
      },
      {
        key: 'subtitle.defaultFormat',
        label: '导出格式',
        type: 'select',
        defaultValue: 'srt',
        props: {
          options: [
            { value: 'srt', label: 'SRT — 通用格式' },
            { value: 'ass', label: 'ASS — 含样式信息' },
            { value: 'vtt', label: 'VTT — Web 用途' },
          ],
        },
      },
    ],
  },

  // ─────────────────────────────────────────
  // AI 分析（独立组件）
  // ─────────────────────────────────────────
  {
    id: 'ai',
    title: 'AI 分析',
    icon: 'brain',
    items: [], // handled by AISettings component
  },

  // ─────────────────────────────────────────
  // 导出设置
  // ─────────────────────────────────────────
  {
    id: 'export',
    title: '导出',
    icon: 'download',
    items: [
      {
        key: 'export.outputDir',
        label: '默认输出目录',
        description: '每次导出时的默认保存位置',
        type: 'path',
        defaultValue: '',
        props: { placeholder: '默认：与源视频同目录' },
      },
      {
        key: 'export.defaultFormat',
        label: '视频容器格式',
        type: 'select',
        defaultValue: 'mp4',
        props: {
          options: [
            { value: 'mp4', label: 'MP4（最兼容）' },
            { value: 'mov', label: 'MOV（剪辑友好）' },
            { value: 'mkv', label: 'MKV（开放格式）' },
          ],
        },
      },
      {
        key: 'export.videoCodec',
        label: '视频编码器',
        description: 'H.265 文件更小，但编码较慢；ProRes 用于专业后期',
        type: 'select',
        defaultValue: 'h264',
        props: {
          options: [
            { value: 'h264', label: 'H.264 — 兼容性最好' },
            { value: 'h265', label: 'H.265 / HEVC — 更小文件' },
            { value: 'prores', label: 'ProRes — 专业后期' },
            { value: 'copy', label: '直接复制（无损，最快）' },
          ],
        },
      },
      {
        key: 'export.videoQuality',
        label: '视频质量 (CRF)',
        description: '数值越小画质越好，文件越大。18 近似无损，28 适合网络分享',
        type: 'slider',
        defaultValue: 23,
        props: { min: 15, max: 35, step: 1, unit: '' },
      },
      {
        key: 'export.encodeSpeed',
        label: '编码速度',
        description: '速度越慢压缩率越高，文件更小',
        type: 'select',
        defaultValue: 'medium',
        props: {
          options: [
            { value: 'ultrafast', label: '极速（文件最大）' },
            { value: 'fast', label: '快速' },
            { value: 'medium', label: '均衡（推荐）' },
            { value: 'slow', label: '慢速（文件最小）' },
          ],
        },
      },
      {
        key: 'export.audioCodec',
        label: '音频编码器',
        type: 'select',
        defaultValue: 'aac',
        props: {
          options: [
            { value: 'aac', label: 'AAC — 标准（推荐）' },
            { value: 'mp3', label: 'MP3 — 兼容性好' },
            { value: 'copy', label: '直接复制（不重编码）' },
          ],
        },
      },
      {
        key: 'export.defaultResolution',
        label: '输出分辨率',
        type: 'select',
        defaultValue: 'original',
        props: {
          options: [
            { value: 'original', label: '与原视频一致' },
            { value: '2160p', label: '4K（2160p）' },
            { value: '1080p', label: '1080p' },
            { value: '720p', label: '720p' },
            { value: '480p', label: '480p' },
          ],
        },
      },
    ],
  },

  // ─────────────────────────────────────────
  // 模板管理（独立组件）
  // ─────────────────────────────────────────
  {
    id: 'templates',
    title: '模板',
    icon: 'layout-template',
    items: [], // handled by TemplatesSection component
  },

  // ─────────────────────────────────────────
  // 关于（独立组件）
  // ─────────────────────────────────────────
  {
    id: 'about',
    title: '关于',
    icon: 'info',
    items: [], // handled by AboutSection component
  },
]
