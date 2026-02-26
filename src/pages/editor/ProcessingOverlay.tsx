// ProcessingOverlay - shown while audio is being extracted and transcribed

import { useEditorStore } from '@/stores/editorStore'
import { Loader2, Mic, FileAudio } from 'lucide-react'

export function ProcessingOverlay() {
  const { status, progress, error } = useEditorStore((s) => s.transcript)

  if (status === 'idle' || status === 'done') return null

  const steps = [
    { key: 'extracting', icon: FileAudio, label: '正在提取音频...' },
    { key: 'transcribing', icon: Mic, label: '正在识别语音...' },
  ]

  const currentStep = steps.find((s) => s.key === status) ?? steps[0]!
  const Icon = currentStep.icon

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface/80 backdrop-blur-sm">
      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-danger/40 bg-surface-2 p-6 text-center">
          <p className="text-sm font-medium text-danger">处理失败</p>
          <p className="max-w-xs text-xs text-text-muted">{error}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-xl bg-surface-2 p-8 text-center">
          <div className="relative">
            <Icon className="h-10 w-10 text-brand" />
            <Loader2 className="absolute -right-2 -top-2 h-5 w-5 animate-spin text-brand/60" />
          </div>
          <p className="text-sm font-medium text-text">{currentStep.label}</p>

          {/* Progress bar */}
          <div className="h-1.5 w-48 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full bg-brand transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-text-muted">{progress}%</p>
        </div>
      )}
    </div>
  )
}
