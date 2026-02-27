// EditorPage — 剪映风格三栏布局
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  [← 返回]  [文件名]       [⌘Z][⌘⇧Z]          [字幕设置]  [● 导出]     │
// ├─────────────────────────┬─────────────────────────┬─────────────────────┤
// │  转录稿                  │  视频预览                │  属性               │
// │  w-80 (320px)           │  flex-1                 │  w-60 (240px)       │
// │  [词块...逐句换行]       │  [video player]         │  选中词信息          │
// │                         │  ─────────────────────  │  ──────────────────  │
// │                         │  段落时间轴 (可点击seek) │  剪辑统计           │
// │                         │  ─────────────────────  │                     │
// │  [查找栏 (可折叠)]       │  [◀5s] [▶] [▶5s] 时间  │                     │
// ├─────────────────────────┤                         │                     │
// │  [✂去静音][🎤去废话][⚡] │                         │                     │
// └─────────────────────────┴─────────────────────────┴─────────────────────┘

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Undo2, Redo2, Download, Captions,
  Scissors, Mic, Zap, Search,
  Play, Pause, Volume2, VolumeX, ChevronDown,
  ChevronsLeft, ChevronsRight,
} from 'lucide-react'
import { App as AntdApp, Button, Dropdown, Progress, Tag, Tooltip } from 'antd'

import { useEditorStore, type SegmentStatus } from '@/stores/editorStore'
import { useUIStore } from '@/stores/uiStore'
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

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// Merge adjacent same-status segments into blocks for the timeline strip
function buildTimelineBlocks(
  segments: ReturnType<typeof useEditorStore.getState>['segments'],
  duration: number,
) {
  const first = segments[0]
  if (!first || !duration) return []
  const blocks: { start: number; end: number; status: SegmentStatus }[] = []
  let cur = { start: first.start, end: first.end, status: first.status }
  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i]
    if (!seg) continue
    if (seg.status === cur.status) {
      cur.end = seg.end
    } else {
      blocks.push({ ...cur })
      cur = { start: seg.start, end: seg.end, status: seg.status }
    }
  }
  blocks.push(cur)
  return blocks.map((b) => ({
    left:   (b.start / duration) * 100,
    width:  Math.max(((b.end - b.start) / duration) * 100, 0.08),
    status: b.status,
  }))
}

const TIMELINE_COLORS: Record<SegmentStatus, string> = {
  kept:    'bg-brand/50',
  deleted: 'bg-red-500/25',   // visible cut marker
  silence: 'bg-surface-2/80',
  filler:  'bg-amber-400/40',
}

export default function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { openSettings } = useUIStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const { message } = AntdApp.useApp()

  const {
    videoPath, transcript, segments,
    currentTime, videoDuration, activeSegmentId,
    setCurrentTime, setIsPlaying, setProject,
    setAudioPath, setVideoDuration, setTranscriptResult,
    markAsSilence, markAsFiller,
    deleteAllSilence, deleteAllFillers,
    toggleSegment,
    getKeptSegments, undo, redo, canUndo, canRedo,
  } = useEditorStore()

  const { startTranscription, detectSilence, detectFillers, stopPolling } = useTranscription()

  // Cleanup: stop polling timer on unmount to prevent memory leak
  useEffect(() => () => stopPolling(), [stopPolling])

  const [showFindReplace, setShowFindReplace]   = useState(false)
  const [highlightText, setHighlightText]       = useState('')
  const [removingSilence, setRemovingSilence]   = useState(false)
  const [removingFillers, setRemovingFillers]   = useState(false)
  const [exporting, setExporting]               = useState(false)
  const [playbackSpeed, setPlaybackSpeed]       = useState(1)
  const [isMuted, setIsMuted]                   = useState(false)
  const [isPlaying, setLocalIsPlaying]          = useState(false)

  // ── Load project ─────────────────────────────────────────────────────────
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

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.code === 'Space') {
        e.preventDefault()
        void videoRef.current?.[videoRef.current.paused ? 'play' : 'pause']()
        return
      }
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); if (canUndo()) undo(); return }
      if (mod && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); if (canRedo()) redo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, canUndo, canRedo])

  // ── Derived state ────────────────────────────────────────────────────────
  const activeSegment = useMemo(
    () => segments.find((s) => s.id === activeSegmentId) ?? null,
    [segments, activeSegmentId],
  )

  const stats = useMemo(() => {
    const nonKept = segments.filter((s) => s.status !== 'kept')
    const savedDuration = nonKept.reduce((sum, s) => sum + (s.end - s.start), 0)
    const savedPercent  = videoDuration > 0 ? Math.round((savedDuration / videoDuration) * 100) : 0
    return { deletedCount: nonKept.length, savedDuration, savedPercent }
  }, [segments, videoDuration])

  const timelineBlocks = useMemo(
    () => buildTimelineBlocks(segments, videoDuration),
    [segments, videoDuration],
  )

  const deletedCount  = stats.deletedCount
  const isProcessing  = transcript.status === 'extracting' || transcript.status === 'transcribing'
  const undoDisabled  = !canUndo()
  const redoDisabled  = !canRedo()

  // ── Video controls ───────────────────────────────────────────────────────
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

  const seekRelative = useCallback((delta: number) => {
    if (!videoRef.current) return
    const t = Math.max(0, Math.min(videoDuration, videoRef.current.currentTime + delta))
    videoRef.current.currentTime = t
    setCurrentTime(t)   // sync store immediately, don't wait for onTimeUpdate
  }, [videoDuration, setCurrentTime])

  const isDraggingTimeline = useRef(false)

  const seekTimeline = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoDuration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const t = Math.max(0, Math.min(videoDuration, ((e.clientX - rect.left) / rect.width) * videoDuration))
    if (videoRef.current) videoRef.current.currentTime = t
    setCurrentTime(t)
  }, [videoDuration, setCurrentTime])

  const handleTimelineMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingTimeline.current = true
    seekTimeline(e)
  }, [seekTimeline])

  const handleTimelineMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingTimeline.current) seekTimeline(e)
  }, [seekTimeline])

  const handleTimelineMouseUp = useCallback(() => {
    isDraggingTimeline.current = false
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

  // ── AI actions ───────────────────────────────────────────────────────────
  const handleRemoveSilence = useCallback(async () => {
    const { audioPath, segments: segs } = useEditorStore.getState()
    if (!audioPath) { message.warning('音频尚未就绪，请稍候'); return }
    setRemovingSilence(true)
    try {
      const silenceSegs = await detectSilence(audioPath)
      const silenceIds  = segs
        .filter((w) => (silenceSegs ?? []).some(
          (s: { start: number; end: number }) => w.start >= s.start && w.end <= s.end,
        ))
        .map((w) => w.id)
      if (silenceIds.length === 0) {
        message.info('未检测到静音片段')
      } else {
        markAsSilence(silenceIds)
        deleteAllSilence()
        message.success(`已去除 ${silenceIds.length} 个静音片段`)
      }
    } catch {
      message.error('去静音失败，请重试')
    } finally {
      setRemovingSilence(false)
    }
  }, [detectSilence, markAsSilence, deleteAllSilence, message])

  const handleRemoveFillers = useCallback(async () => {
    const { segments: segs } = useEditorStore.getState()
    setRemovingFillers(true)
    try {
      const fillerIndices = (await detectFillers(
        segs.map((s) => ({ word: s.word, start: s.start, end: s.end, confidence: s.confidence })),
      )) ?? []
      const fillerIds = fillerIndices.map((i: number) => String(i))
      if (fillerIds.length === 0) {
        message.info('未检测到填充词')
      } else {
        markAsFiller(fillerIds)
        deleteAllFillers()
        message.success(`已去除 ${fillerIds.length} 个填充词`)
      }
    } catch {
      message.error('去废话失败，请重试')
    } finally {
      setRemovingFillers(false)
    }
  }, [detectFillers, markAsFiller, deleteAllFillers, message])

  const handleExport = useCallback(async () => {
    if (!videoPath || !projectId) return
    setExporting(true)
    try {
      const dialogRes = await window.api.video.exportDialog()
      if (!dialogRes || dialogRes.canceled) return
      const kept = getKeptSegments()
      await window.api.video.export({
        inputPath:  videoPath,
        outputPath: (dialogRes as { filePath: string }).filePath,
        segments:   kept.map((s) => ({ start: s.start, end: s.end })),
      })
      message.success('视频导出成功！')
    } catch {
      message.error('导出失败，请重试')
    } finally {
      setExporting(false)
    }
  }, [videoPath, projectId, getKeptSegments, message])

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen flex-col bg-surface text-text">

      {/* ══ TOP BAR ══════════════════════════════════════════════════════════ */}
      <header className="titlebar-drag flex h-12 shrink-0 items-center justify-between border-b border-border bg-surface-2 px-4">

        {/* macOS traffic light spacer */}
        <div className="w-[72px] shrink-0" />

        {/* Left: back + file name */}
        <div className="titlebar-no-drag flex min-w-0 items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-text-secondary transition-colors hover:bg-surface-3 hover:text-text"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回
          </button>
          <span className="mx-1 h-4 w-px bg-border" />
          <span className="max-w-[200px] truncate text-[12px] font-medium text-text">
            {videoPath ? videoPath.split('/').pop() : '加载中...'}
          </span>
        </div>

        {/* Center: undo / redo */}
        <div className="titlebar-no-drag flex items-center gap-1">
          <Tooltip title={undoDisabled ? undefined : '撤销 (⌘Z)'} mouseEnterDelay={0.5}>
            <button
              disabled={undoDisabled}
              onClick={undo}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                undoDisabled
                  ? 'cursor-not-allowed text-text-muted/30'
                  : 'text-text-secondary hover:bg-surface-3 hover:text-text',
              )}
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
          <Tooltip title={redoDisabled ? undefined : '重做 (⌘⇧Z)'} mouseEnterDelay={0.5}>
            <button
              disabled={redoDisabled}
              onClick={redo}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                redoDisabled
                  ? 'cursor-not-allowed text-text-muted/30'
                  : 'text-text-secondary hover:bg-surface-3 hover:text-text',
              )}
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        </div>

        {/* Right: subtitle settings + export */}
        <div className="titlebar-no-drag flex items-center gap-2">
          <button
            onClick={() => openSettings('subtitle')}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] text-brand transition-colors hover:bg-brand/10"
          >
            <Captions className="h-3.5 w-3.5" />
            字幕设置
          </button>
          <Button
            type="primary"
            size="small"
            icon={<Download className="h-3.5 w-3.5" />}
            loading={exporting}
            disabled={isProcessing || segments.length === 0}
            onClick={() => void handleExport()}
            className="!text-[12px] !font-medium"
          >
            导出
          </Button>
        </div>
      </header>

      {/* ══ MAIN THREE-PANEL ═════════════════════════════════════════════════ */}
      <div className="relative flex flex-1 overflow-hidden">
        <ProcessingOverlay />

        {/* ── LEFT: Transcript panel ─────────────────────────────────────── */}
        <div className="flex w-80 shrink-0 flex-col border-r border-border">

          {/* Panel header */}
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
              转录稿
            </span>
            <div className="flex items-center gap-1.5">
              {segments.length > 0 && (
                <>
                  <button
                    onClick={() => setShowFindReplace((v) => !v)}
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded transition-colors',
                      showFindReplace
                        ? 'bg-brand/15 text-brand'
                        : 'text-text-muted hover:bg-surface-3 hover:text-text',
                    )}
                  >
                    <Search className="h-3.5 w-3.5" />
                  </button>
                  {deletedCount > 0 && (
                    <Tag color="orange" className="!text-[10px] !px-1.5 !py-0">
                      已删 {deletedCount}
                    </Tag>
                  )}
                </>
              )}
              {transcript.status === 'done' && segments.length > 0 && (
                <Tag color="success" className="!text-[10px] !px-1.5 !py-0">完成</Tag>
              )}
            </div>
          </div>

          {/* Find/replace bar */}
          {showFindReplace && (
            <FindReplaceBar
              onClose={() => { setShowFindReplace(false); setHighlightText('') }}
              onFindChange={setHighlightText}
            />
          )}

          {/* Transcript editor — fills remaining height */}
          <TranscriptEditor
            compact
            onWordClick={handleWordClick}
            highlightText={highlightText}
          />

          {/* AI tools footer */}
          <div className="flex h-11 shrink-0 items-center gap-1 border-t border-border bg-surface-2 px-2">
            <Tooltip title="自动检测并去除静音片段" mouseEnterDelay={0.6}>
              <Button
                size="small"
                icon={<Scissors className="h-3 w-3" />}
                loading={removingSilence}
                disabled={isProcessing || segments.length === 0 || removingFillers}
                onClick={() => void handleRemoveSilence()}
                className="!text-[11px] !text-text-secondary !bg-transparent hover:!bg-surface-3 !border-transparent"
              >
                去静音
              </Button>
            </Tooltip>
            <Tooltip title="AI 识别并删除语气词、废话" mouseEnterDelay={0.6}>
              <Button
                size="small"
                icon={<Mic className="h-3 w-3" />}
                loading={removingFillers}
                disabled={isProcessing || segments.length === 0 || removingSilence}
                onClick={() => void handleRemoveFillers()}
                className="!text-[11px] !text-text-secondary !bg-transparent hover:!bg-surface-3 !border-transparent"
              >
                去废话
              </Button>
            </Tooltip>
            <Tooltip title="即将上线" mouseEnterDelay={0.4}>
              <Button
                size="small"
                icon={<Zap className="h-3 w-3" />}
                disabled
                className="!text-[11px] !bg-transparent !border-transparent !opacity-30"
              >
                AI分析
              </Button>
            </Tooltip>
            <div className="ml-auto text-[10px] text-text-muted">
              {segments.length > 0 && `${segments.length} 词`}
            </div>
          </div>
        </div>

        {/* ── CENTER: Video + Timeline + Controls ────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Video preview */}
          <div className="relative flex-1 overflow-hidden bg-black">
            {videoPath ? (
              <video
                ref={videoRef}
                src={`clearcut://localhost${videoPath}`}
                className="h-full w-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => { setIsPlaying(true); setLocalIsPlaying(true) }}
                onPause={() => { setIsPlaying(false); setLocalIsPlaying(false) }}
                onEnded={() => { setIsPlaying(false); setLocalIsPlaying(false) }}
                onLoadedMetadata={() => {
                  if (videoRef.current) setVideoDuration(videoRef.current.duration)
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-text-muted/20">
                <Scissors className="h-12 w-12" />
              </div>
            )}
          </div>

          {/* Segment timeline strip — clickable seek bar */}
          <div
            className="relative h-9 shrink-0 cursor-pointer select-none overflow-hidden border-t border-border bg-surface-3/60"
            onMouseDown={handleTimelineMouseDown}
            onMouseMove={handleTimelineMouseMove}
            onMouseUp={handleTimelineMouseUp}
            onMouseLeave={handleTimelineMouseUp}
            title="点击或拖拽跳转到指定位置"
          >
            {/* Segment color blocks */}
            {timelineBlocks.map((b, i) => (
              <div
                key={i}
                className={cn('absolute top-1.5 h-6 rounded-[1px]', TIMELINE_COLORS[b.status])}
                style={{ left: `${b.left}%`, width: `${b.width}%` }}
              />
            ))}
            {/* Playhead */}
            {videoDuration > 0 && (
              <div
                className="pointer-events-none absolute top-0 h-full w-px bg-white/80 shadow-[0_0_4px_rgba(255,255,255,0.6)]"
                style={{ left: `${(currentTime / videoDuration) * 100}%` }}
              />
            )}
          </div>

          {/* Playback controls — 剪映 style */}
          <div className="flex h-14 shrink-0 items-center gap-3 border-t border-border bg-surface-2 px-5">

            {/* Skip back 5s */}
            <Tooltip title="后退 5 秒" mouseEnterDelay={0.6}>
              <button
                onClick={() => seekRelative(-5)}
                disabled={!videoPath}
                className={cn(
                  'flex items-center gap-0.5 rounded-md px-1.5 py-1 text-[11px] text-text-secondary transition-colors',
                  videoPath ? 'hover:bg-surface-3 hover:text-text' : 'cursor-not-allowed opacity-30',
                )}
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
                <span>5s</span>
              </button>
            </Tooltip>

            {/* Play / Pause — primary CTA */}
            <Tooltip title="播放/暂停 (空格)" mouseEnterDelay={0.6}>
              <button
                onClick={handleTogglePlay}
                disabled={!videoPath}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full transition-all',
                  videoPath
                    ? 'bg-brand text-surface hover:bg-brand-dark active:scale-95'
                    : 'cursor-not-allowed bg-surface-3 opacity-40',
                )}
              >
                {isPlaying
                  ? <Pause className="h-4 w-4 fill-current" />
                  : <Play className="h-4 w-4 translate-x-px fill-current" />
                }
              </button>
            </Tooltip>

            {/* Skip forward 5s */}
            <Tooltip title="前进 5 秒" mouseEnterDelay={0.6}>
              <button
                onClick={() => seekRelative(5)}
                disabled={!videoPath}
                className={cn(
                  'flex items-center gap-0.5 rounded-md px-1.5 py-1 text-[11px] text-text-secondary transition-colors',
                  videoPath ? 'hover:bg-surface-3 hover:text-text' : 'cursor-not-allowed opacity-30',
                )}
              >
                <ChevronsRight className="h-3.5 w-3.5" />
                <span>5s</span>
              </button>
            </Tooltip>

            {/* Time */}
            <span className="ml-1 text-[12px] tabular-nums text-text-secondary">
              {formatTime(currentTime)}
              <span className="text-text-muted"> / {formatTime(videoDuration)}</span>
            </span>

            <div className="flex-1" />

            {/* Speed selector */}
            <Dropdown
              trigger={['click']}
              disabled={!videoPath}
              menu={{
                items: SPEED_OPTIONS.map((opt) => ({
                  key: opt.key,
                  label: (
                    <span className={cn('text-[12px]', playbackSpeed === Number(opt.key) && 'text-brand font-medium')}>
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
                  'flex items-center gap-0.5 rounded-md px-2 py-1 text-[12px] tabular-nums transition-colors',
                  videoPath
                    ? 'text-text-secondary hover:bg-surface-3 hover:text-text cursor-pointer'
                    : 'cursor-not-allowed opacity-30',
                )}
              >
                {playbackSpeed === 1 ? '1×' : `${playbackSpeed}×`}
                <ChevronDown className="h-3 w-3" />
              </button>
            </Dropdown>

            {/* Mute */}
            <Tooltip title={isMuted ? '取消静音' : '静音'} mouseEnterDelay={0.6}>
              <button
                onClick={handleToggleMute}
                disabled={!videoPath}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                  videoPath ? 'text-text-secondary hover:bg-surface-3 hover:text-text' : 'cursor-not-allowed opacity-30',
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

        {/* ── RIGHT: Properties panel ────────────────────────────────────── */}
        <div className="flex w-60 shrink-0 flex-col overflow-y-auto border-l border-border">

          {/* Panel header */}
          <div className="flex h-10 shrink-0 items-center border-b border-border px-3">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
              属性
            </span>
          </div>

          {/* Selected segment info */}
          <div className="border-b border-border p-3">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-text-muted">
              当前选中
            </p>
            {activeSegment ? (
              <div className="space-y-2">
                {/* Word display */}
                <div className="rounded-lg bg-surface-3 px-3 py-2 text-center text-[18px] font-medium text-text">
                  {activeSegment.word}
                </div>

                {/* Timestamps */}
                <div className="flex justify-between text-[11px] text-text-secondary">
                  <span>{activeSegment.start.toFixed(2)}s</span>
                  <span className="text-text-muted">→</span>
                  <span>{activeSegment.end.toFixed(2)}s</span>
                </div>

                {/* Confidence */}
                <div>
                  <div className="mb-1 flex justify-between text-[10px] text-text-muted">
                    <span>置信度</span>
                    <span className={activeSegment.confidence < 0.7 ? 'text-amber-400' : 'text-text-secondary'}>
                      {Math.round(activeSegment.confidence * 100)}%
                    </span>
                  </div>
                  <Progress
                    percent={Math.round(activeSegment.confidence * 100)}
                    size="small"
                    showInfo={false}
                    strokeColor={activeSegment.confidence >= 0.85 ? '#22D3EE' : '#F59E0B'}
                  />
                </div>

                {/* Status tag + toggle */}
                <div className="flex items-center justify-between">
                  <Tag
                    color={
                      activeSegment.status === 'kept'    ? 'default' :
                      activeSegment.status === 'filler'  ? 'gold' : 'red'
                    }
                    className="!text-[10px]"
                  >
                    {activeSegment.status === 'kept' ? '保留' :
                     activeSegment.status === 'deleted' ? '已删除' :
                     activeSegment.status === 'filler'  ? '填充词' : '静音'}
                  </Tag>
                  <button
                    onClick={() => toggleSegment(activeSegment.id)}
                    className="rounded px-2 py-0.5 text-[11px] text-text-secondary transition-colors hover:bg-surface-3 hover:text-text"
                  >
                    {activeSegment.status === 'kept' ? '标记删除' : '恢复保留'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[12px] leading-5 text-text-muted">
                {transcript.status === 'done'
                  ? '点击转录稿中的词查看详情'
                  : isProcessing
                    ? '转录完成后可在此查看详情'
                    : '导入视频后开始转录'}
              </p>
            )}
          </div>

          {/* Edit statistics */}
          <div className="p-3">
            <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-text-muted">
              剪辑统计
            </p>
            <div className="space-y-2.5">
              <div className="flex justify-between text-[12px]">
                <span className="text-text-secondary">原始时长</span>
                <span className="tabular-nums text-text">{formatTime(videoDuration)}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-text-secondary">已删片段</span>
                <span className="tabular-nums text-text">{stats.deletedCount} 个</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-text-secondary">预计节省</span>
                <span className="tabular-nums text-brand">{formatTime(stats.savedDuration)}</span>
              </div>

              {/* Savings progress bar */}
              {stats.savedPercent > 0 && (
                <div className="pt-1">
                  <div className="mb-1.5 flex justify-between text-[10px] text-text-muted">
                    <span>删减率</span>
                    <span>{stats.savedPercent}%</span>
                  </div>
                  <Progress
                    percent={stats.savedPercent}
                    size="small"
                    showInfo={false}
                    strokeColor="#22D3EE"
                  />
                </div>
              )}

              {/* Total words */}
              {segments.length > 0 && (
                <div className="flex justify-between text-[12px]">
                  <span className="text-text-secondary">总词数</span>
                  <span className="tabular-nums text-text">{segments.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
