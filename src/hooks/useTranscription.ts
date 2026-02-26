// useTranscription - orchestrates the full import → extract audio → ASR pipeline

import { useCallback, useRef } from 'react'
import { useEditorStore } from '@/stores/editorStore'

const POLL_INTERVAL_MS = 1500

export function useTranscription() {
  const {
    setTranscriptStatus,
    setJobId,
    setTranscriptResult,
    setAudioPath,
    setVideoDuration,
  } = useEditorStore()

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  const pollStatus = useCallback(
    (jobId: string) => {
      const check = async () => {
        const res = await window.api.transcript.status(jobId)

        if (res.ok) {
          if (res.status === 'processing') {
            setTranscriptStatus('transcribing', res.progress ?? 50)
            pollTimerRef.current = setTimeout(check, POLL_INTERVAL_MS)
          } else if (res.status === 'done' && res.result) {
            stopPolling()
            setTranscriptResult(res.result.words as import('../../electron/ipc/transcript').WordSegment[], res.result.language)
          } else if (res.status === 'error') {
            stopPolling()
            setTranscriptStatus('error', 0, res.error ?? '转录失败')
          } else {
            // still pending
            pollTimerRef.current = setTimeout(check, POLL_INTERVAL_MS)
          }
        } else {
          stopPolling()
          setTranscriptStatus('error', 0, res.error ?? '转录失败')
        }
      }

      check()
    },
    [setTranscriptStatus, setTranscriptResult, stopPolling],
  )

  const startTranscription = useCallback(
    async (videoPath: string, projectId: string) => {
      try {
        // 1. Get video metadata
        setTranscriptStatus('extracting', 5)
        const metaRes = await window.api.video.meta(videoPath)
        if (metaRes.ok) setVideoDuration(metaRes.meta.duration)

        // 2. Extract audio
        setTranscriptStatus('extracting', 15)
        const audioRes = await window.api.video.extractAudio(videoPath, projectId)
        if (!audioRes.ok) {
          setTranscriptStatus('error', 0, audioRes.error ?? '音频提取失败')
          return
        }
        setAudioPath(audioRes.audioPath)
        setTranscriptStatus('extracting', 30)

        // 3. Start ASR job
        const settings = await window.api.settings.getAll()
        const startRes = await window.api.transcript.start({
          audioPath: audioRes.audioPath,
          projectId,
          language: settings['asr.language'] ?? 'zh',
          engine: settings['asr.engine'] ?? 'funasr',
          modelQuality: settings['asr.modelQuality'] ?? 'large',
        })

        if (!startRes.ok || !startRes.jobId) {
          setTranscriptStatus('error', 0, startRes.error ?? '转录任务启动失败')
          return
        }

        setJobId(startRes.jobId)
        setTranscriptStatus('transcribing', 35)

        // 4. Poll until done
        pollStatus(startRes.jobId)
      } catch (e: unknown) {
        setTranscriptStatus('error', 0, e instanceof Error ? e.message : '未知错误')
      }
    },
    [setTranscriptStatus, setVideoDuration, setAudioPath, setJobId, pollStatus],
  )

  const detectSilence = useCallback(async (audioPath: string) => {
    const settings = await window.api.settings.getAll()
    const res = await window.api.transcript.detectSilence({
      audioPath,
      threshold: settings['edit.silenceThreshold'] ?? -35,
      minDuration: settings['edit.minSilenceDuration'] ?? 0.8,
    })
    return res.ok ? res.silenceSegments : []
  }, [])

  const detectFillers = useCallback(async (words: unknown[]) => {
    const settings = await window.api.settings.getAll()
    const res = await window.api.transcript.detectFillers({
      words,
      fillerList: settings['edit.fillerWords'],
    })
    return res.ok ? res.fillerIndices : []
  }, [])

  return { startTranscription, detectSilence, detectFillers, stopPolling }
}
