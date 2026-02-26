// Provider registry - preset configurations for ClearCut-AI LLM analysis
// All providers here use MIT-compatible or commercial API licenses

import type { ProviderConfig } from '../../src/types/provider'

export const PRESET_PROVIDERS: ProviderConfig[] = [
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com',
    sdkType: 'anthropic',
    authModes: ['api_key'],
    envVar: 'ANTHROPIC_API_KEY',
    icon: 'anthropic',
    models: [
      { id: 'claude-sonnet-4-5-20250929', name: 'Claude 4.5 Sonnet', description: '均衡性价比（推荐）' },
      { id: 'claude-opus-4-6', name: 'Claude 4.6 Opus', description: '最强推理能力' },
      { id: 'claude-haiku-4-5-20251001', name: 'Claude 4.5 Haiku', description: '快速响应' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    sdkType: 'openai-compatible',
    authModes: ['api_key'],
    envVar: 'OPENAI_API_KEY',
    icon: 'openai',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', description: '多模态旗舰' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: '快速经济' },
      { id: 'o1', name: 'o1', description: '深度推理' },
    ],
  },
  {
    id: 'deepseek',
    name: '深度求索 DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    sdkType: 'openai-compatible',
    authModes: ['api_key'],
    envVar: 'DEEPSEEK_API_KEY',
    icon: 'deepseek',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', description: '通用对话' },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', description: '深度推理' },
    ],
  },
  {
    id: 'qwen',
    name: '通义千问 Qwen',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    sdkType: 'openai-compatible',
    authModes: ['api_key'],
    envVar: 'DASHSCOPE_API_KEY',
    icon: 'qwen',
    models: [
      { id: 'qwen-max', name: 'Qwen Max', description: '最强能力' },
      { id: 'qwen-plus', name: 'Qwen Plus', description: '均衡性价比' },
      { id: 'qwen-turbo', name: 'Qwen Turbo', description: '快速响应' },
    ],
  },
  {
    id: 'moonshot',
    name: '月之暗面 Kimi',
    baseUrl: 'https://api.moonshot.cn/v1',
    sdkType: 'openai-compatible',
    authModes: ['api_key'],
    envVar: 'MOONSHOT_API_KEY',
    icon: 'kimi',
    models: [
      { id: 'kimi-k2.5', name: 'Kimi K2.5', description: '最新旗舰' },
      { id: 'kimi-k2-turbo-preview', name: 'Kimi K2 Turbo', description: '快速响应' },
    ],
  },
  {
    id: 'zhipu',
    name: '智谱 GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    sdkType: 'openai-compatible',
    authModes: ['api_key'],
    envVar: 'ZHIPU_API_KEY',
    icon: 'zhipu',
    models: [
      { id: 'glm-4-plus', name: 'GLM-4 Plus', description: '旗舰模型' },
      { id: 'glm-4-flash', name: 'GLM-4 Flash', description: '免费快速' },
    ],
  },
  {
    id: 'custom',
    name: '自定义 OpenAI 兼容',
    baseUrl: '',
    sdkType: 'openai-compatible',
    authModes: ['api_key'],
    icon: 'custom',
    models: [
      { id: 'custom-model', name: '自定义模型', description: '用户自定义' },
    ],
  },
]

export function getProviderById(id: string): ProviderConfig | undefined {
  return PRESET_PROVIDERS.find((p) => p.id === id)
}

export function getApiKeyProviders(): ProviderConfig[] {
  return PRESET_PROVIDERS.filter((p) => p.id !== 'custom')
}
