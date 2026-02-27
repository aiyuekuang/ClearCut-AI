// ProcessingOverlay - shown while audio is being extracted and transcribed

import { Progress, Spin } from 'antd'
import { useEditorStore } from '@/stores/editorStore'
import { Mic, FileAudio } from 'lucide-react'

export function ProcessingOverlay() {
  const { status, progress, error } = useEditorStore((s) => s.transcript)

  if (status === 'idle' || status === 'done') return null

  const steps = [
    { key: 'extracting', icon: FileAudio, label: '正在提取音频...', sub: '分离视频音轨' },
    { key: 'transcribing', icon: Mic, label: '正在识别语音...', sub: 'AI 转录中，请稍候' },
  ]

  const currentStep = steps.find((s) => s.key === status) ?? steps[0]!
  const Icon = currentStep.icon

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface/85 backdrop-blur-sm">
      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-danger/30 bg-surface-2 px-8 py-6 text-center shadow-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10">
            <span className="text-xl text-danger">!</span>
          </div>
          <p className="text-sm font-semibold text-danger">处理失败</p>
          <p className="max-w-xs text-xs text-text-muted leading-5">{error}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 rounded-2xl bg-surface-2 border border-border px-10 py-8 text-center shadow-2xl min-w-[240px]">
          <Spin
            indicator={
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10">
                <Icon className="h-7 w-7 text-brand" />
              </div>
            }
            spinning
            wrapperClassName="!block"
          />

          <div>
            <p className="text-sm font-semibold text-text mb-1">{currentStep.label}</p>
            <p className="text-xs text-text-muted">{currentStep.sub}</p>
          </div>

          <div className="w-full">
            <Progress
              percent={progress}
              size="small"
              strokeColor="#22D3EE"
              showInfo={false}
              strokeLinecap="round"
            />
            <p className="mt-1.5 text-xs text-text-muted">{progress}%</p>
          </div>
        </div>
      )}
    </div>
  )
}
