// AI Engine configuration types
// Defines the global AI mode and per-capability slot system

/** Global AI running mode - mutually exclusive */
export type AIMode = 'local' | 'api'

/** Method that an AI capability slot can use */
export type SlotMethod = 'disabled' | 'dictionary' | 'rules' | 'local-llm' | 'api-llm'

/** Registered AI capability slot IDs */
export type AISlotId = 'filler' | 'sentence' | 'highlight' | 'analysis' | 'summary'

/** Definition of a single AI capability slot */
export type AISlotDef = {
  id: AISlotId
  name: string
  description: string
  /** All methods this slot supports */
  methods: SlotMethod[]
  /** Default method when ai.mode = 'local' */
  localDefault: SlotMethod
  /** Default method when ai.mode = 'api' */
  apiDefault: SlotMethod
}

/** Human-readable labels for slot methods */
export const SLOT_METHOD_LABELS: Record<SlotMethod, string> = {
  disabled: '不可用',
  dictionary: '字典匹配',
  rules: '规则匹配',
  'local-llm': '本地模型',
  'api-llm': 'API 提供商',
}
