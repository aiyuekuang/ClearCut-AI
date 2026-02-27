// Provider registry - preset configurations for ClearCut-AI LLM analysis
// All providers here use MIT-compatible or commercial API licenses

import type { ProviderConfig } from '../../src/types/provider'

export const PRESET_PROVIDERS: ProviderConfig[] = [
  // --- OAuth Providers (浏览器登录，免费使用) ---
  {
    id: 'qwen-portal',
    name: '通义千问 (浏览器登录)',
    baseUrl: 'https://portal.qwen.ai/v1',
    sdkType: 'openai-compatible',
    authModes: ['oauth'],
    // portal.qwen.ai 使用别名 ID，参考 openclaw-cn 实现
    models: [
      { id: 'coder-model', name: 'Qwen Coder (免费)', description: '文本/代码，实际 qwen3.5-plus' },
      { id: 'vision-model', name: 'Qwen Vision (免费)', description: '多模态，实际 qwen3-vl-plus' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com',
    sdkType: 'anthropic',
    authModes: ['api_key'],
    envVar: 'ANTHROPIC_API_KEY',
    icon: 'anthropic',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    loginUrl: 'https://console.anthropic.com',
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
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    loginUrl: 'https://platform.openai.com',
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
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    loginUrl: 'https://platform.deepseek.com/sign_in',
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
    apiKeyUrl: 'https://dashscope.console.aliyun.com/apiKey',
    loginUrl: 'https://dashscope.console.aliyun.com/',
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
    apiKeyUrl: 'https://platform.moonshot.cn/console/api-keys',
    loginUrl: 'https://platform.moonshot.cn/console',
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
    apiKeyUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
    loginUrl: 'https://open.bigmodel.cn/',
    models: [
      { id: 'glm-4-plus', name: 'GLM-4 Plus', description: '旗舰模型' },
      { id: 'glm-4-flash', name: 'GLM-4 Flash', description: '免费快速' },
    ],
  },
  {
    id: 'ollama',
    name: 'Ollama (本地模型)',
    baseUrl: 'http://localhost:11434/v1',
    sdkType: 'openai-compatible',
    authModes: ['api_key'],
    icon: 'ollama',
    apiKeyUrl: 'https://ollama.com/download',
    models: [
      { id: 'qwen2.5:7b', name: 'Qwen2.5 7B', description: '中文推荐' },
      { id: 'qwen2.5:14b', name: 'Qwen2.5 14B', description: '更强中文能力' },
      { id: 'llama3.2:3b', name: 'Llama 3.2 3B', description: '轻量快速' },
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
