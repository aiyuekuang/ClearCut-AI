// AI capability slot registry
// Config-driven: add a new AI capability by adding an entry here
// The AI engine settings page will automatically render it

import type { AISlotDef } from '@/types/ai-config'

export const AI_SLOTS: AISlotDef[] = [
  {
    id: 'filler',
    name: '废话检测',
    description: '自动识别语气词、填充词、无意义重复',
    methods: ['dictionary', 'local-llm', 'api-llm'],
    localDefault: 'local-llm',
    apiDefault: 'api-llm',
  },
  {
    id: 'sentence',
    name: '智能断句',
    description: 'LLM 语义优化字幕断句，纠正 ASR 错误',
    methods: ['disabled', 'local-llm', 'api-llm'],
    localDefault: 'local-llm',
    apiDefault: 'api-llm',
  },
  {
    id: 'highlight',
    name: '金句检测',
    description: '自动识别精彩片段和高光时刻',
    methods: ['disabled', 'rules', 'local-llm', 'api-llm'],
    localDefault: 'rules',
    apiDefault: 'api-llm',
  },
  {
    id: 'analysis',
    name: '内容分析',
    description: 'AI 分析内容质量，标记表达不佳的段落',
    methods: ['disabled', 'local-llm', 'api-llm'],
    localDefault: 'local-llm',
    apiDefault: 'api-llm',
  },
  {
    id: 'summary',
    name: '内容摘要',
    description: '将视频内容整理为结构化笔记/大纲',
    methods: ['disabled', 'local-llm', 'api-llm'],
    localDefault: 'local-llm',
    apiDefault: 'api-llm',
  },
]
