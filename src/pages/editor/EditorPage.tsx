// EditorPage - main video editing interface
// Layout: Toolbar | (VideoPanel + TranscriptPanel) | Timeline + BottomBar

import { useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Undo2, Redo2, Download, Captions,
  Scissors, Mic, Zap,
} from 'lucide-react'

import { useEditorStore } from '@/stores/editorStore'
import { useTranscription } from '@/hooks/useTranscription'
import { TranscriptEditor } from './TranscriptEditor'
import { ProcessingOverlay } from './ProcessingOverlay'
import { cn } from '@/lib/utils'

export default function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)

  const {
    videoPath,
    transcript,
    segments,
    setCurrentTime,
    setIsPlaying,
    setProject,
    markAsSilence,
    markAsFiller,
    deleteAllSilence,
    deleteAllFillers,
    getKeptSegments,
  } = useEditorStore()

  const { startTranscription, detectSilence, detectFillers } = useTranscription()

  // Load project on mount
  useEffect(() => {
    if (!projectId) return
    void (async () => {
      const project = await window.api.project.get(projectId) as { filePath?: string } | null
      if (!project?.filePath) return
      setProject(projectId, project.filePath)
      if (transcript.status === 'idle') {
        void startTranscription(project.filePath, projectId)
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime)
  }, [setCurrentTime])

  const handleWordClick = useCallback((start: number) => {
    if (videoRef.current) videoRef.current.currentTime = start
  }, [])

  const handleRemoveSilence = useCallback(async () => {
    const { audioPath } = useEditorStore.getState()
    if (!audioPath) return
    const silenceSegs = await detectSilence(audioPath)
    const silenceIds = segments
      .filter((w) =>
        (silenceSegs ?? []).some(
          (s: { start: number; end: number }) => w.start >= s.start && w.end <= s.end,
        ),
      )
      .map((w) => w.id)
    markAsSilence(silenceIds)
    deleteAllSilence()
  }, [segments, detectSilence, markAsSilence, deleteAllSilence])

  const handleRemoveFillers = useCallback(async () => {
    const wordObjs = segments.map((s) => ({
      word: s.word, start: s.start, end: s.end, confidence: s.confidence,
    }))
    const fillerIndices = (await detectFillers(wordObjs)) ?? []
    const fillerIds = fillerIndices.map((i: number) => String(i))
    markAsFiller(fillerIds)
    deleteAllFillers()
  }, [segments, detectFillers, markAsFiller, deleteAllFillers])

  const handleExport = useCallback(async () => {
    if (!videoPath || !projectId) return
    const dialogRes = await window.api.video.exportDialog()
    if (!dialogRes || dialogRes.canceled) return
    const kept = getKeptSegments()
    await window.api.video.export({
      inputPath: videoPath,
      outputPath: (dialogRes as { filePath: string }).filePath,
      segments: kept.map((s) => ({ start: s.start, end: s.end })),
    })
  }, [videoPath, projectId, getKeptSegments])

  const deletedCount = segments.filter((s) => s.status !== 'kept').length
  const isProcessing = transcript.status === 'extracting' || transcript.status === 'transcribing'

  return (
    <div className="flex h-screen flex-col bg-surface">
      {/* Toolbar */}
      <header className="titlebar-drag flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="titlebar-no-drag flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 rounded px-2 py-1 text-sm text-text-secondary hover:bg-surface-2 hover:text-text"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </button>
          <div className="h-4 w-px bg-border" />
          <span className="max-w-52 truncate text-sm font-medium text-text">
            {videoPath ? videoPath.split('/').pop() : '加载中...'}
          </span>
        </div>

        <div className="titlebar-no-drag flex items-center gap-2">
          <button className="rounded p-1.5 text-text-muted hover:bg-surface-2" title="撤销">
            <Undo2 className="h-4 w-4" />
          </button>
          <button className="rounded p-1.5 text-text-muted hover:bg-surface-2" title="重做">
            <Redo2 className="h-4 w-4" />
          </button>
          <div className="h-4 w-px bg-border" />
          <button
            onClick={() => navigate(`/subtitle/${projectId}`)}
            className="flex items-center gap-1.5 rounded-md bg-brand/15 px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/25"
          >
            <Captions className="h-3.5 w-3.5" />
            字幕设置
          </button>
          <button
            onClick={() => void handleExport()}
            disabled={isProcessing || segments.length === 0}
            className="flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            导出
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="relative flex flex-1 overflow-hidden">
        <ProcessingOverlay />

        {/* Video panel */}
        <div className="flex w-[55%] flex-col border-r border-border">
          <div className="flex flex-1 items-center justify-center bg-black">
            {videoPath ? (
              <video
                ref={videoRef}
                src={`file://${videoPath}`}
                className="max-h-full max-w-full"
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                controls
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-text-muted">
                <Scissors className="h-10 w-10" />
                <p className="text-sm">等待视频加载...</p>
              </div>
            )}
          </div>
          <div className="flex h-14 items-center justify-center border-t border-border bg-surface-2">
            <p className="text-xs text-text-muted">波形时间线（开发中）</p>
          </div>
        </div>

        {/* Transcript panel */}
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-medium text-text">转录文本</h3>
            {segments.length > 0 && (
              <span className="text-xs text-text-muted">
                已删除 {deletedCount}/{segments.length} 段
              </span>
            )}
          </div>
          <TranscriptEditor onWordClick={handleWordClick} />
        </div>
      </div>

      {/* Bottom toolbar */}
      <div className="flex h-10 shrink-0 items-center gap-2 border-t border-border px-4">
        <button
          onClick={() => void handleRemoveSilence()}
          disabled={isProcessing || segments.length === 0}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1 text-xs',
            'bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-text',
            'disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          <Scissors className="h-3.5 w-3.5" />
          一键去静音
        </button>

        <button
          onClick={() => void handleRemoveFillers()}
          disabled={isProcessing || segments.length === 0}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1 text-xs',
            'bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-text',
            'disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          <Mic className="h-3.5 w-3.5" />
          一键去废话
        </button>

        <button
          disabled={true}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1 text-xs',
            'bg-surface-2 text-text-secondary opacity-40 cursor-not-allowed',
          )}
        >
          <Zap className="h-3.5 w-3.5" />
          AI 分析
        </button>

        <div className="ml-auto flex items-center gap-2 text-xs text-text-muted">
          {transcript.status === 'done' && (
            <span className="text-green-400">✓ 转录完成</span>
          )}
        </div>
      </div>
    </div>
  )
}
