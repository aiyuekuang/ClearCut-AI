// Subtitle template configurations
// Config-driven: all template parameters defined here, engine reads and applies

export type SubtitleTemplate = {
  id: string
  name: string
  description: string
  engine: 'ass' | 'pycaps'
  style: {
    fontFamily: string
    fontSize: number
    fontWeight: 'normal' | 'bold'
    primaryColor: string
    outlineColor: string
    outlineWidth: number
    shadowColor: string
    shadowOffset: number
    backgroundColor?: string
    alignment: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
    marginV: number
  }
  animation: {
    type: 'none' | 'fade' | 'karaoke' | 'word_highlight' | 'pop' | 'slide' | 'bounce' | 'typewriter'
    highlightColor?: string
    fadeInMs?: number
    fadeOutMs?: number
  }
}

export const subtitleTemplates: SubtitleTemplate[] = [
  {
    id: 'classic-white',
    name: '经典白字',
    description: '白字黑描边，底部居中',
    engine: 'ass',
    style: {
      fontFamily: 'PingFang SC',
      fontSize: 22,
      fontWeight: 'bold',
      primaryColor: '#FFFFFF',
      outlineColor: '#000000',
      outlineWidth: 2,
      shadowColor: '#000000',
      shadowOffset: 1,
      alignment: 2,
      marginV: 40,
    },
    animation: { type: 'none' },
  },
  {
    id: 'classic-yellow',
    name: '经典黄字',
    description: '黄字黑描边，底部居中',
    engine: 'ass',
    style: {
      fontFamily: 'PingFang SC',
      fontSize: 22,
      fontWeight: 'bold',
      primaryColor: '#FFD700',
      outlineColor: '#000000',
      outlineWidth: 2,
      shadowColor: '#000000',
      shadowOffset: 1,
      alignment: 2,
      marginV: 40,
    },
    animation: { type: 'none' },
  },
  {
    id: 'karaoke-glow',
    name: '卡拉OK',
    description: '白字逐词变青色高亮',
    engine: 'ass',
    style: {
      fontFamily: 'PingFang SC',
      fontSize: 24,
      fontWeight: 'bold',
      primaryColor: '#FFFFFF',
      outlineColor: '#1E3A5F',
      outlineWidth: 2,
      shadowColor: '#000000',
      shadowOffset: 0,
      alignment: 2,
      marginV: 40,
    },
    animation: {
      type: 'karaoke',
      highlightColor: '#22D3EE',
    },
  },
  {
    id: 'fade-elegant',
    name: '优雅渐入',
    description: '白字半透明背景，渐入渐出',
    engine: 'ass',
    style: {
      fontFamily: 'PingFang SC',
      fontSize: 20,
      fontWeight: 'normal',
      primaryColor: '#FFFFFF',
      outlineColor: '#000000',
      outlineWidth: 0,
      shadowColor: '#000000',
      shadowOffset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignment: 2,
      marginV: 50,
    },
    animation: {
      type: 'fade',
      fadeInMs: 300,
      fadeOutMs: 300,
    },
  },
  {
    id: 'tiktok-pop',
    name: 'TikTok 弹出',
    description: '大字加粗描边，逐词弹出',
    engine: 'pycaps',
    style: {
      fontFamily: 'PingFang SC',
      fontSize: 32,
      fontWeight: 'bold',
      primaryColor: '#FFFFFF',
      outlineColor: '#000000',
      outlineWidth: 3,
      shadowColor: '#000000',
      shadowOffset: 0,
      alignment: 2,
      marginV: 200,
    },
    animation: {
      type: 'pop',
      highlightColor: '#E11D48',
    },
  },
  {
    id: 'tiktok-highlight',
    name: 'TikTok 高亮',
    description: '白字，当前词变红色',
    engine: 'pycaps',
    style: {
      fontFamily: 'PingFang SC',
      fontSize: 28,
      fontWeight: 'bold',
      primaryColor: '#FFFFFF',
      outlineColor: '#000000',
      outlineWidth: 2,
      shadowColor: '#000000',
      shadowOffset: 0,
      alignment: 2,
      marginV: 200,
    },
    animation: {
      type: 'word_highlight',
      highlightColor: '#E11D48',
    },
  },
  {
    id: 'shorts-bounce',
    name: 'Shorts 弹跳',
    description: '居中大字，弹跳出现',
    engine: 'pycaps',
    style: {
      fontFamily: 'PingFang SC',
      fontSize: 30,
      fontWeight: 'bold',
      primaryColor: '#FFFFFF',
      outlineColor: '#000000',
      outlineWidth: 3,
      shadowColor: '#000000',
      shadowOffset: 0,
      alignment: 5,
      marginV: 0,
    },
    animation: {
      type: 'bounce',
      highlightColor: '#22D3EE',
    },
  },
  {
    id: 'minimal-slide',
    name: '极简滑入',
    description: '小字无描边，从左滑入',
    engine: 'pycaps',
    style: {
      fontFamily: 'PingFang SC',
      fontSize: 18,
      fontWeight: 'normal',
      primaryColor: '#FFFFFF',
      outlineColor: 'transparent',
      outlineWidth: 0,
      shadowColor: '#000000',
      shadowOffset: 0,
      alignment: 1,
      marginV: 60,
    },
    animation: { type: 'slide' },
  },
]
