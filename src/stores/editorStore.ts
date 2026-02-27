// Editor store - core state for the video editing session
// Manages: transcript segments, deleted set, cursor position, playback, undo/redo

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { WordSegment } from '../../electron/ipc/transcript'

export type SegmentStatus = 'kept' | 'deleted' | 'silence' | 'filler'

export type EditSegment = {
  id: string              // unique id (word index as string)
  word: string
  start: number
  end: number
  confidence: number
  status: SegmentStatus
  isSentenceEnd: boolean  // whether a line break should follow
}

type TranscriptState = {
  jobId: string | null
  status: 'idle' | 'extracting' | 'transcribing' | 'done' | 'error'
  progress: number        // 0–100
  error: string | null
  language: string
}

type EditorState = {
  // Project
  projectId: string | null
  videoPath: string | null
  audioPath: string | null
  videoDuration: number

  // Transcript
  transcript: TranscriptState
  segments: EditSegment[]

  // Playback
  currentTime: number
  isPlaying: boolean
  activeSegmentId: string | null

  // History (undo/redo)
  past: EditSegment[][]
  future: EditSegment[][]

  // Actions
  setProject: (projectId: string, videoPath: string) => void
  setAudioPath: (path: string) => void
  setVideoDuration: (duration: number) => void

  setTranscriptStatus: (status: TranscriptState['status'], progress?: number, error?: string) => void
  setJobId: (jobId: string) => void
  setTranscriptResult: (words: WordSegment[], language: string) => void

  toggleSegment: (id: string) => void
  deleteSegments: (ids: string[]) => void
  restoreSegments: (ids: string[]) => void
  markAsSilence: (ids: string[]) => void
  markAsFiller: (ids: string[]) => void
  restoreAllDeleted: () => void
  deleteAllSilence: () => void
  deleteAllFillers: () => void

  updateWord: (id: string, word: string) => void
  replaceWords: (findText: string, replaceText: string) => number

  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  setCurrentTime: (time: number) => void
  setIsPlaying: (playing: boolean) => void
  setActiveSegment: (id: string | null) => void

  getKeptSegments: () => EditSegment[]
  getDeletedTimeRanges: () => Array<{ start: number; end: number }>
}

function buildSegments(words: WordSegment[]): EditSegment[] {
  return words.map((w, i) => ({
    id: String(i),
    word: w.word,
    start: w.start,
    end: w.end,
    confidence: w.confidence,
    status: 'kept',
    // Chinese sentence endings or long pauses → line break
    isSentenceEnd: /[。！？\n]$/.test(w.word) || (i > 0 && w.start - (words[i - 1]?.end ?? 0) > 1.5),
  }))
}

// Deep-clone segments to a plain array (safe to call on immer drafts)
function snapshot(segments: EditSegment[]): EditSegment[] {
  return segments.map((seg) => ({
    id: seg.id,
    word: seg.word,
    start: seg.start,
    end: seg.end,
    confidence: seg.confidence,
    status: seg.status,
    isSentenceEnd: seg.isSentenceEnd,
  }))
}

const HISTORY_LIMIT = 50

export const useEditorStore = create<EditorState>()(
  immer((set, get) => ({
    projectId: null,
    videoPath: null,
    audioPath: null,
    videoDuration: 0,

    transcript: {
      jobId: null,
      status: 'idle',
      progress: 0,
      error: null,
      language: 'zh',
    },
    segments: [],

    currentTime: 0,
    isPlaying: false,
    activeSegmentId: null,

    past: [],
    future: [],

    setProject: (projectId, videoPath) =>
      set((s) => {
        s.projectId = projectId
        s.videoPath = videoPath
        s.segments = []
        s.past = []
        s.future = []
        s.transcript = { jobId: null, status: 'idle', progress: 0, error: null, language: 'zh' }
      }),

    setAudioPath: (path) => set((s) => { s.audioPath = path }),
    setVideoDuration: (duration) => set((s) => { s.videoDuration = duration }),

    setTranscriptStatus: (status, progress = 0, error = undefined) =>
      set((s) => {
        s.transcript.status = status
        s.transcript.progress = progress
        s.transcript.error = error ?? null
      }),

    setJobId: (jobId) => set((s) => { s.transcript.jobId = jobId }),

    setTranscriptResult: (words, language) =>
      set((s) => {
        s.segments = buildSegments(words)
        s.past = []
        s.future = []
        s.transcript.status = 'done'
        s.transcript.progress = 100
        s.transcript.language = language
      }),

    toggleSegment: (id) =>
      set((s) => {
        s.past.push(snapshot(s.segments))
        if (s.past.length > HISTORY_LIMIT) s.past.shift()
        s.future = []
        const seg = s.segments.find((x: EditSegment) => x.id === id)
        if (!seg) return
        seg.status = seg.status === 'kept' ? 'deleted' : 'kept'
      }),

    deleteSegments: (ids) =>
      set((s) => {
        s.past.push(snapshot(s.segments))
        if (s.past.length > HISTORY_LIMIT) s.past.shift()
        s.future = []
        const idSet = new Set(ids)
        s.segments.forEach((x: EditSegment) => { if (idSet.has(x.id)) x.status = 'deleted' })
      }),

    restoreSegments: (ids) =>
      set((s) => {
        s.past.push(snapshot(s.segments))
        if (s.past.length > HISTORY_LIMIT) s.past.shift()
        s.future = []
        const idSet = new Set(ids)
        s.segments.forEach((x: EditSegment) => { if (idSet.has(x.id)) x.status = 'kept' })
      }),

    markAsSilence: (ids) =>
      set((s) => {
        s.past.push(snapshot(s.segments))
        if (s.past.length > HISTORY_LIMIT) s.past.shift()
        s.future = []
        const idSet = new Set(ids)
        s.segments.forEach((x: EditSegment) => { if (idSet.has(x.id)) x.status = 'silence' })
      }),

    markAsFiller: (ids) =>
      set((s) => {
        s.past.push(snapshot(s.segments))
        if (s.past.length > HISTORY_LIMIT) s.past.shift()
        s.future = []
        const idSet = new Set(ids)
        s.segments.forEach((x: EditSegment) => { if (idSet.has(x.id)) x.status = 'filler' })
      }),

    restoreAllDeleted: () =>
      set((s) => {
        s.past.push(snapshot(s.segments))
        if (s.past.length > HISTORY_LIMIT) s.past.shift()
        s.future = []
        s.segments.forEach((x: EditSegment) => { if (x.status !== 'kept') x.status = 'kept' })
      }),

    deleteAllSilence: () =>
      set((s) => {
        // Note: silence → deleted happens after markAsSilence; don't double-push history
        s.segments.forEach((x: EditSegment) => { if (x.status === 'silence') x.status = 'deleted' })
      }),

    deleteAllFillers: () =>
      set((s) => {
        // Note: filler → deleted happens after markAsFiller; don't double-push history
        s.segments.forEach((x: EditSegment) => { if (x.status === 'filler') x.status = 'deleted' })
      }),

    updateWord: (id, word) =>
      set((s) => {
        const seg = s.segments.find((x: EditSegment) => x.id === id)
        if (seg) seg.word = word
      }),

    replaceWords: (findText, replaceText) => {
      const count = get().segments.filter((s) => s.word.includes(findText)).length
      set((s) => {
        s.past.push(snapshot(s.segments))
        if (s.past.length > HISTORY_LIMIT) s.past.shift()
        s.future = []
        s.segments.forEach((seg: EditSegment) => {
          if (seg.word.includes(findText)) {
            seg.word = seg.word.split(findText).join(replaceText)
          }
        })
      })
      return count
    },

    undo: () =>
      set((s) => {
        const prev = s.past[s.past.length - 1]
        if (!prev) return
        s.past.pop()
        s.future.push(snapshot(s.segments))
        if (s.future.length > HISTORY_LIMIT) s.future.shift()
        s.segments = prev
      }),

    redo: () =>
      set((s) => {
        const next = s.future[s.future.length - 1]
        if (!next) return
        s.future.pop()
        s.past.push(snapshot(s.segments))
        if (s.past.length > HISTORY_LIMIT) s.past.shift()
        s.segments = next
      }),

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,

    setCurrentTime: (time) => set((s) => { s.currentTime = time }),
    setIsPlaying: (playing) => set((s) => { s.isPlaying = playing }),
    setActiveSegment: (id) => set((s) => { s.activeSegmentId = id }),

    getKeptSegments: () => get().segments.filter((x) => x.status === 'kept'),

    getDeletedTimeRanges: () => {
      const segs = get().segments
      const ranges: Array<{ start: number; end: number }> = []
      let rangeStart: number | null = null

      for (const seg of segs) {
        if (seg.status !== 'kept') {
          if (rangeStart === null) rangeStart = seg.start
        } else {
          if (rangeStart !== null) {
            ranges.push({ start: rangeStart, end: seg.start })
            rangeStart = null
          }
        }
      }
      if (rangeStart !== null) {
        const last = segs[segs.length - 1]
        if (last) ranges.push({ start: rangeStart, end: last.end })
      }
      return ranges
    },
  })),
)
