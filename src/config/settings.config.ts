// Settings page configuration - defines all settings sections and items
// Config-driven: add a setting item here, the settings renderer shows it automatically

export type SettingItemType = 'select' | 'slider' | 'input' | 'switch' | 'tags' | 'path' | 'custom'

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
            { value: 'funasr', label: 'FunASR Paraformer (中文推荐)' },
            { value: 'whisper', label: 'faster-whisper (多语言)' },
          ],
        },
      },
      {
        key: 'asr.modelQuality',
        label: '模型质量',
        type: 'select',
        defaultValue: 'large',
        props: {
          options: [
            { value: 'large', label: '大模型 (更准确)' },
            { value: 'medium', label: '中模型 (平衡)' },
            { value: 'small', label: '小模型 (更快)' },
          ],
        },
      },
    ],
  },
  {
    id: 'edit',
    title: '智能剪辑',
    icon: 'wand-sparkles',
    items: [
      {
        key: 'edit.silenceThreshold',
        label: '静音阈值',
        description: '低于此分贝视为静音',
        type: 'slider',
        defaultValue: -35,
        props: { min: -60, max: -10, step: 1, unit: 'dB' },
      },
      {
        key: 'edit.minSilenceDuration',
        label: '最短静音时长',
        description: '低于此时长的静音不标记',
        type: 'slider',
        defaultValue: 0.8,
        props: { min: 0.1, max: 3.0, step: 0.1, unit: 's' },
      },
      {
        key: 'edit.fillerWords',
        label: '填充词列表',
        description: '自动检测并标记这些词语',
        type: 'tags',
        defaultValue: ['嗯', '啊', '那个', '然后', '就是', '就是说', '对对对', '这个'],
      },
    ],
  },
  {
    id: 'subtitle',
    title: '字幕默认设置',
    icon: 'captions',
    items: [
      {
        key: 'subtitle.defaultTemplate',
        label: '默认模板',
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
            { value: 'PingFang SC', label: '苹方 (PingFang SC)' },
            { value: 'Noto Sans SC', label: '思源黑体 (Noto Sans SC)' },
            { value: 'Source Han Serif SC', label: '思源宋体' },
            { value: 'Microsoft YaHei', label: '微软雅黑' },
          ],
        },
      },
      {
        key: 'subtitle.defaultFontSize',
        label: '默认字号',
        type: 'slider',
        defaultValue: 22,
        props: { min: 12, max: 48, step: 1, unit: 'px' },
      },
      {
        key: 'subtitle.defaultFormat',
        label: '默认导出格式',
        type: 'select',
        defaultValue: 'srt',
        props: {
          options: [
            { value: 'srt', label: 'SRT (通用)' },
            { value: 'ass', label: 'ASS (带样式)' },
            { value: 'vtt', label: 'VTT (Web)' },
          ],
        },
      },
    ],
  },
  {
    id: 'ai',
    title: 'AI 分析',
    icon: 'brain',
    items: [],  // AI provider settings handled by dedicated AISettings component
  },
  {
    id: 'export',
    title: '导出默认值',
    icon: 'download',
    items: [
      {
        key: 'export.outputDir',
        label: '默认输出目录',
        type: 'path',
        defaultValue: '',
      },
      {
        key: 'export.defaultFormat',
        label: '默认格式',
        type: 'select',
        defaultValue: 'mp4',
        props: {
          options: [
            { value: 'mp4', label: 'MP4' },
            { value: 'mov', label: 'MOV' },
          ],
        },
      },
      {
        key: 'export.defaultResolution',
        label: '默认分辨率',
        type: 'select',
        defaultValue: 'original',
        props: {
          options: [
            { value: 'original', label: '与原始一致' },
            { value: '1080p', label: '1080p' },
            { value: '720p', label: '720p' },
          ],
        },
      },
    ],
  },
  {
    id: 'about',
    title: '关于',
    icon: 'info',
    items: [],  // Custom component for about info
  },
]
