// EditorPage - main video editing interface
// Layout: Toolbar | (VideoPanel + TranscriptPanel) | BottomBar

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Undo2, Redo2, Download, Captions,
  Scissors, Mic, Zap, Search,
  Play, Pause, Volume2, VolumeX, ChevronDown,
} from 'lucide-react'
import { App as AntdApp, Button, Dropdown, Tag, Tooltip } from 'antd'

import { useEditorStore } from '@/stores/editorStore'
import { useTranscription } from '@/hooks/useTranscription'
import { TranscriptEditor } from './TranscriptEditor'
import { FindReplaceBar } from './FindReplaceBar'
import { ProcessingOverlay } from './ProcessingOverlay'
import { cn } from '@/lib/utils'

const SPEED_OPTIONS = [
  { key: '0.5',  label: '0.5×' },
  { key: '0.75', label: '0.75×' },
  { key: '1',    label: '1×' },
  { key: '1.25', label: '1.25×' },
  { key: '1.5',  label: '1.5×' },
  { key: '2',    label: '2×' },
]

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const { message } = AntdApp.useApp()

  const {
    videoPath,
    transcript,
    segments,
    currentTime,
    videoDuration,
    setCurrentTime,
    setIsPlaying,
    setProject,
    setAudioPath,
    setVideoDuration,
    setTranscriptResult,
    markAsSilence,
    markAsFiller,
    deleteAllSilence,
    deleteAllFillers,
    getKeptSegments,
  } = useEditorStore()

  const { startTranscription, detectSilence, detectFillers } = useTranscription()

  const [showFindReplace, setShowFindReplace] = useState(false)
  const [highlightText, setHighlightText]     = useState('')
  const [removingSilence, setRemovingSilence] = useState(false)
  const [removingFillers, setRemovingFillers] = useState(false)
  const [exporting, setExporting]             = useState(false)
  const [playbackSpeed, setPlaybackSpeed]     = useState(1)
  const [isMuted, setIsMuted]                 = useState(false)
  const [isPlaying, setLocalIsPlaying]        = useState(false)

  // Load project on mount
  useEffect(() => {
    if (!projectId) return
    void (async () => {
      const storeState = useEditorStore.getState()
      if (storeState.projectId === projectId && storeState.transcript.status === 'done') return

      const project = await window.api.project.get(projectId) as { sourceVideo?: string } | null
      if (!project?.sourceVideo) return

      setProject(projectId, project.sourceVideo)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cached = await (window.api.project as any).loadTranscript(projectId) as
        { ok: boolean; result?: { words: { word: string; start: number; end: number; confidence: number }[]; language: string } } | null
      if (cached?.ok && cached.result?.words?.length) {
        setTranscriptResult(cached.result.words, cached.result.language ?? 'zh')
        const [metaRes, audioRes] = await Promise.all([
          window.api.video.meta(project.sourceVideo) as Promise<{ ok: boolean; meta: { duration: number } }>,
          window.api.video.extractAudio(project.sourceVideo, projectId) as Promise<{ ok: boolean; audioPath: string }>,
        ])
        if (metaRes.ok) setVideoDuration(metaRes.meta.duration)
        if (audioRes.ok) setAudioPath(audioRes.audioPath)
        return
      }

      void startTranscription(project.sourceVideo, projectId)
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // Space bar → toggle play/pause
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      e.preventDefault()
      void videoRef.current?.[videoRef.current.paused ? 'play' : 'pause']()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime)
  }, [setCurrentTime])

  const handleWordClick = useCallback((start: number) => {
    if (videoRef.current) videoRef.current.currentTime = start
  }, [])

  const handleTogglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    void (v.paused ? v.play() : v.pause())
  }, [])

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed)
    if (videoRef.current) videoRef.current.playbackRate = speed
  }, [])

  const handleToggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)
    }
  }, [])

  const handleRemoveSilence = useCallback(async () => {
    const { audioPath } = useEditorStore.getState()
    if (!audioPath) return
    setRemovingSilence(true)
    try {
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
      message.success(`已去除 ${silenceIds.length} 个静音片段`)
    } catch {
      message.error('去静音失败，请重试')
    } finally {
      setRemovingSilence(false)
    }
  }, [segments, detectSilence, markAsSilence, deleteAllSilence, message])

  const handleRemoveFillers = useCallback(async () => {
    const wordObjs = segments.map((s) => ({
      word: s.word, start: s.start, end: s.end, confidence: s.confidence,
    }))
    setRemovingFillers(true)
    try {
      const fillerIndices = (await detectFillers(wordObjs)) ?? []
      const fillerIds = fillerIndices.map((i: number) => String(i))
      markAsFiller(fillerIds)
      deleteAllFillers()
      message.success(`已去除 ${fillerIds.length} 个填充词`)
    } catch {
      message.error('去废话失败，请重试')
    } finally {
      setRemovingFillers(false)
    }
  }, [segments, detectFillers, markAsFiller, deleteAllFillers, message])

  const handleExport = useCallback(async () => {
    if (!videoPath || !projectId) return
    setExporting(true)
    try {
      const dialogRes = await window.api.video.exportDialog()
      if (!dialogRes || dialogRes.canceled) return
      const kept = getKeptSegments()
      await window.api.video.export({
        inputPath: videoPath,
        outputPath: (dialogRes as { filePath: string }).filePath,
        segments: kept.map((s) => ({ start: s.start, end: s.end })),
      })
      message.success('视频导出成功！')
    } catch {
      message.error('导出失败，请重试')
    } finally {
      setExporting(false)
    }
  }, [videoPath, projectId, getKeptSegments, message])

  const deletedCount = segments.filter((s) => s.status !== 'kept').length
  const isProcessing = transcript.status === 'extracting' || transcript.status === 'transcribing'

  return (
    <div className="flex h-screen flex-col bg-surface">
      {/* Top toolbar */}
      <header className="titlebar-drag flex h-11 shrink-0 items-center justify-between border-b border-border pl-[80px] pr-3">
        <div className="titlebar-no-drag flex items-center gap-2">
          <Button
            variant="text"
            size="small"
            icon={<ArrowLeft className="h-3.5 w-3.5" />}
            onClick={() => navigate('/')}
            className="!text-text-secondary !text-xs hover:!text-text"
          >
            返回
          </Button>
          <span className="mx-1 h-4 w-px shrink-0 bg-border" />
          <span className="max-w-52 truncate text-xs font-medium text-text">
            {videoPath ? videoPath.split('/').pop() : '加载中...'}
          </span>
        </div>

        <div className="titlebar-no-drag flex items-center gap-1.5">
          <Tooltip title="撤销 (⌘Z)" mouseEnterDelay={0.5}>
            <Button
              variant="text"
              size="small"
              icon={<Undo2 className="h-3.5 w-3.5" />}
              className="!text-text-muted !p-1.5"
            />
          </Tooltip>
          <Tooltip title="重做 (⌘⇧Z)" mouseEnterDelay={0.5}>
            <Button
              variant="text"
              size="small"
              icon={<Redo2 className="h-3.5 w-3.5" />}
              className="!text-text-muted !p-1.5"
            />
          </Tooltip>

          <span className="mx-1 h-4 w-px shrink-0 bg-border" />

          <Button
            size="small"
            onClick={() => navigate('/settings', { state: { section: 'subtitle' } })}
            icon={<Captions className="h-3.5 w-3.5" />}
            className="!text-brand !bg-brand/10 hover:!bg-brand/20 !border-transparent !text-xs"
          >
            字幕设置
          </Button>

          <Button
            variant="solid"
            color="primary"
            size="small"
            icon={<Download className="h-3.5 w-3.5" />}
            loading={exporting}
            disabled={isProcessing || segments.length === 0}
            onClick={() => void handleExport()}
            className="!text-xs"
          >
            导出
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="relative flex flex-1 overflow-hidden">
        <ProcessingOverlay />

        {/* Video panel — compact width, transcript gets more space */}
        <div className="flex w-[38%] min-w-[280px] flex-col border-r border-border">

          {/* Video preview */}
          <div className="flex flex-1 items-center justify-center bg-black overflow-hidden">
            {videoPath ? (
              <video
                ref={videoRef}
                src={`clearcut://localhost${videoPath}`}
                className="max-h-full max-w-full"
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => { setIsPlaying(true); setLocalIsPlaying(true) }}
                onPause={() => { setIsPlaying(false); setLocalIsPlaying(false) }}
                onLoadedMetadata={() => {
                  if (videoRef.current) setVideoDuration(videoRef.current.duration)
                }}
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-text-muted">
                <Scissors className="h-8 w-8 opacity-30" />
                <p className="text-xs">等待视频加载...</p>
              </div>
            )}
          </div>

          {/* Custom playback controls */}
          <div className="flex h-11 shrink-0 items-center gap-2 border-t border-border bg-surface-2 px-3">
            {/* Play / Pause */}
            <Tooltip title="播放/暂停 (空格)" mouseEnterDelay={0.6}>
              <button
                onClick={handleTogglePlay}
                disabled={!videoPath}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                  videoPath
                    ? 'text-text hover:bg-surface-3'
                    : 'text-text-muted opacity-40 cursor-not-allowed',
                )}
              >
                {isPlaying
                  ? <Pause className="h-4 w-4 fill-current" />
                  : <Play className="h-4 w-4 fill-current" />
                }
              </button>
            </Tooltip>

            {/* Time display */}
            <span className="min-w-[72px] text-[11px] tabular-nums text-text-secondary">
              {formatTime(currentTime)}
              <span className="text-text-muted"> / {formatTime(videoDuration)}</span>
            </span>

            <div className="flex-1" />

            {/* Playback speed */}
            <Dropdown
              trigger={['click']}
              disabled={!videoPath}
              menu={{
                items: SPEED_OPTIONS.map((opt) => ({
                  key: opt.key,
                  label: (
                    <span className={cn('text-xs', playbackSpeed === Number(opt.key) && 'text-brand font-medium')}>
                      {opt.label}
                    </span>
                  ),
                  onClick: () => handleSpeedChange(Number(opt.key)),
                })),
                style: { minWidth: 80 },
              }}
            >
              <button
                className={cn(
                  'flex items-center gap-0.5 rounded px-1.5 py-1 text-[11px] tabular-nums transition-colors',
                  videoPath
                    ? 'text-text-secondary hover:bg-surface-3 hover:text-text cursor-pointer'
                    : 'text-text-muted opacity-40 cursor-not-allowed',
                )}
              >
                {playbackSpeed === 1 ? '1×' : `${playbackSpeed}×`}
                <ChevronDown className="h-3 w-3" />
              </button>
            </Dropdown>

            {/* Mute toggle */}
            <Tooltip title={isMuted ? '取消静音' : '静音'} mouseEnterDelay={0.6}>
              <button
                onClick={handleToggleMute}
                disabled={!videoPath}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                  videoPath
                    ? 'text-text-secondary hover:bg-surface-3 hover:text-text'
                    : 'text-text-muted opacity-40 cursor-not-allowed',
                )}
              >
                {isMuted
                  ? <VolumeX className="h-3.5 w-3.5" />
                  : <Volume2 className="h-3.5 w-3.5" />
                }
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Transcript panel */}
        <div className="flex flex-1 flex-col min-w-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <h3 className="text-xs font-semibold text-text uppercase tracking-wider">转录文本</h3>
            <div className="flex items-center gap-2">
              {segments.length > 0 && (
                <>
                  <Button
                    variant="text"
                    size="small"
                    icon={<Search className="h-3 w-3" />}
                    onClick={() => setShowFindReplace((v) => !v)}
                    className={cn(
                      '!text-xs',
                      showFindReplace
                        ? '!text-brand !bg-brand/10'
                        : '!text-text-secondary',
                    )}
                  >
                    查找替换
                  </Button>
                  <Tag
                    color={deletedCount > 0 ? 'orange' : 'default'}
                    className="!text-[11px]"
                  >
                    已删 {deletedCount}/{segments.length}
                  </Tag>
                </>
              )}
            </div>
          </div>

          {showFindReplace && (
            <FindReplaceBar
              onClose={() => { setShowFindReplace(false); setHighlightText('') }}
              onFindChange={setHighlightText}
            />
          )}
          <TranscriptEditor onWordClick={handleWordClick} highlightText={highlightText} />
        </div>
      </div>

      {/* Bottom toolbar — AI editing tools */}
      <div className="flex h-10 shrink-0 items-center gap-1.5 border-t border-border px-3">
        <Tooltip title="自动检测并删除静音片段" mouseEnterDelay={0.6}>
          <Button
            size="small"
            icon={<Scissors className="h-3.5 w-3.5" />}
            loading={removingSilence}
            disabled={isProcessing || segments.length === 0 || removingFillers}
            onClick={() => void handleRemoveSilence()}
            className="!text-xs !text-text-secondary !bg-surface-2 hover:!bg-surface-3 hover:!text-text !border-transparent"
          >
            一键去静音
          </Button>
        </Tooltip>

        <Tooltip title="AI 识别并删除语气词、废话" mouseEnterDelay={0.6}>
          <Button
            size="small"
            icon={<Mic className="h-3.5 w-3.5" />}
            loading={removingFillers}
            disabled={isProcessing || segments.length === 0 || removingSilence}
            onClick={() => void handleRemoveFillers()}
            className="!text-xs !text-text-secondary !bg-surface-2 hover:!bg-surface-3 hover:!text-text !border-transparent"
          >
            一键去废话
          </Button>
        </Tooltip>

        <Tooltip title="即将上线" mouseEnterDelay={0.4}>
          <Button
            size="small"
            icon={<Zap className="h-3.5 w-3.5" />}
            disabled
            className="!text-xs !bg-surface-2 !border-transparent !opacity-35"
          >
            AI 分析
          </Button>
        </Tooltip>

        <div className="ml-auto flex items-center gap-2">
          {transcript.status === 'done' && (
            <Tag color="success" className="!text-[11px]">
              转录完成
            </Tag>
          )}
        </div>
      </div>
    </div>
  )
}
