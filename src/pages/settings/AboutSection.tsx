// About section - app info and open source credits

import { Scissors, ExternalLink } from 'lucide-react'

export function AboutSection() {
  return (
    <div>
      <h2 className="mb-6 text-lg font-semibold text-text">关于</h2>

      {/* App info */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand/15">
          <Scissors className="h-7 w-7 text-brand" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-text">ClearCut-AI (清剪)</h3>
          <p className="text-sm text-text-secondary">v0.1.0</p>
          <p className="mt-1 text-xs text-text-muted">
            面向中文口播视频创作者的一键智能剪辑桌面应用
          </p>
        </div>
      </div>

      {/* Open source credits */}
      <div className="rounded-lg border border-border bg-surface-2 p-4">
        <h4 className="mb-3 text-sm font-medium text-text">开源技术</h4>
        <div className="space-y-2.5 text-xs text-text-secondary">
          <CreditItem
            name="FunASR Paraformer"
            org="阿里巴巴达摩院"
            license="MIT + 模型协议"
            url="https://github.com/modelscope/FunASR"
          />
          <CreditItem
            name="faster-whisper"
            org="SYSTRAN"
            license="MIT"
            url="https://github.com/SYSTRAN/faster-whisper"
          />
          <CreditItem
            name="stable-ts"
            org="jianfch"
            license="MIT"
            url="https://github.com/jianfch/stable-ts"
          />
          <CreditItem
            name="Silero VAD"
            org="Silero Team"
            license="MIT"
            url="https://github.com/snakers4/silero-vad"
          />
          <CreditItem
            name="pysubs2"
            org="tkarabela"
            license="MIT"
            url="https://github.com/tkarabela/pysubs2"
          />
          <CreditItem
            name="FFmpeg"
            org="FFmpeg team"
            license="LGPL (CLI 调用)"
            url="https://ffmpeg.org/"
          />
        </div>
      </div>

      <p className="mt-4 text-xs text-text-muted">
        语音识别技术由 FunASR (阿里巴巴达摩院) 提供
      </p>
    </div>
  )
}

function CreditItem({
  name,
  org,
  license,
  url,
}: {
  name: string
  org: string
  license: string
  url: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <span className="font-medium text-text">{name}</span>
        <span className="ml-2 text-text-muted">by {org}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded bg-surface-3 px-1.5 py-0.5 text-text-muted">
          {license}
        </span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand hover:text-brand-dark"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  )
}
