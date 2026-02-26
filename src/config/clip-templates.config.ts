// Built-in clip templates - shipped with the app, cannot be deleted by the user
// Each template bundles: filler prompt + subtitle style reference

import type { ClipTemplate } from '@/types/template'

export const BUILT_IN_TEMPLATES: ClipTemplate[] = [
  {
    id: 'default',
    name: '默认模板',
    description: '适合中文口播视频的通用剪辑模板',
    builtIn: true,
    createdAt: '2025-01-01T00:00:00Z',
    fillerPrompt: `请分析以下口播视频转录文本，识别并标记所有废话和冗余内容。

需要标记的类型：
1. 语气词/填充词：嗯、啊、那个、然后、就是、对吧、好的、这个
2. 重复内容：同一意思重复表达两次及以上的句子
3. 无效过渡语：好了我们继续、那么下面、接下来说一下
4. 犹豫停顿：说到一半重新开始的不完整句子

请以 JSON 格式返回需要删除的片段索引列表：
{"delete_indices": [0, 3, 7, ...]}`,
    subtitleTemplateId: 'classic-white',
  },
  {
    id: 'short-video',
    name: '短视频模板',
    description: '适合抖音 / TikTok / Shorts，节奏紧凑',
    builtIn: true,
    createdAt: '2025-01-01T00:00:00Z',
    fillerPrompt: `分析口播转录文本，最大化去除废话，保留核心信息点。

删除以下所有内容：
- 开场白废话（大家好、今天给大家、欢迎来到）
- 结尾废话（好了今天就到这里、记得点赞关注）
- 所有语气词（嗯 啊 那个 就是 然后 对吧）
- 重复表达（同一意思说了两遍）
- 不完整的句子（说到一半重说的）

返回 JSON：{"delete_indices": [...]}`,
    subtitleTemplateId: 'tiktok-pop',
  },
]
