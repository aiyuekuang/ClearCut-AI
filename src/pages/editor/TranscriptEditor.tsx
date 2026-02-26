// TranscriptEditor - the core editing surface
// Words are clickable → seek video; selected text can be deleted/restored
// Deleted words are shown struck-through in muted color

import { useCallback } from 'react'
import { useEditorStore, type EditSegment } from '@/stores/editorStore'
import { cn } from '@/lib/utils'

// Status → CSS class mapping
const STATUS_CLASS: Record<EditSegment['status'], string> = {
  kept:    'text-text cursor-pointer hover:bg-surface-2 rounded',
  deleted: 'text-text-muted line-through cursor-pointer hover:bg-surface-2 rounded opacity-50',
  silence: 'text-text-muted/40 cursor-pointer hover:bg-surface-2 rounded text-xs',
  filler:  'text-yellow-500/70 line-through cursor-pointer hover:bg-surface-2 rounded',
}

type Props = {
  onWordClick?: (start: number) => void
}

export function TranscriptEditor({ onWordClick }: Props) {
  const segments = useEditorStore((s) => s.segments)
  const activeId = useEditorStore((s) => s.activeSegmentId)
  const toggleSegment = useEditorStore((s) => s.toggleSegment)
  const setActiveSegment = useEditorStore((s) => s.setActiveSegment)

  const handleClick = useCallback(
    (seg: EditSegment) => {
      setActiveSegment(seg.id)
      onWordClick?.(seg.start)
    },
    [setActiveSegment, onWordClick],
  )

  const handleDoubleClick = useCallback(
    (seg: EditSegment) => {
      toggleSegment(seg.id)
    },
    [toggleSegment],
  )

  if (segments.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-center text-sm text-text-muted">
          转录完成后，文本将在此显示。
          <br />
          点击单词跳转，双击删除/恢复。
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 leading-relaxed">
      <p className="mb-4 text-xs text-text-muted">
        点击定位 · 双击删除/恢复 · 灰色已删除 · 黄色填充词
      </p>
      <div className="text-sm">
        {segments.map((seg, i) => (
          <span key={seg.id}>
            <span
              className={cn(
                'select-none px-0.5 py-0.5 transition-colors',
                STATUS_CLASS[seg.status],
                activeId === seg.id && 'ring-1 ring-brand rounded',
              )}
              onClick={() => handleClick(seg)}
              onDoubleClick={() => handleDoubleClick(seg)}
              title={`${seg.start.toFixed(2)}s – ${seg.end.toFixed(2)}s  (${Math.round(seg.confidence * 100)}%)`}
            >
              {seg.word}
            </span>
            {/* Line break after sentence-ending words */}
            {seg.isSentenceEnd && i < segments.length - 1 && (
              <span className="block my-2" />
            )}
          </span>
        ))}
      </div>
    </div>
  )
}
