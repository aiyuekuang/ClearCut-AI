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
        console.log('[transcription] poll status=', res.status, 'progress=', res.progress, 'error=', res.error)

        if (res.ok) {
          if (res.status === 'processing') {
            setTranscriptStatus('transcribing', res.progress ?? 50)
            pollTimerRef.current = setTimeout(check, POLL_INTERVAL_MS)
          } else if (res.status === 'done' && res.result) {
            console.log('[transcription] DONE, words=', res.result.words?.length)
            stopPolling()
            setTranscriptResult(res.result.words as import('../../electron/ipc/transcript').WordSegment[], res.result.language)
            // Persist to disk so re-opening this project skips ASR
            const { projectId } = useEditorStore.getState()
            if (projectId) {
              void window.api.project.saveTranscript(projectId, res.result)
            }
          } else if (res.status === 'error') {
            console.error('[transcription] job error:', res.error)
            stopPolling()
            setTranscriptStatus('error', 0, res.error ?? '转录失败')
          } else {
            // still pending
            pollTimerRef.current = setTimeout(check, POLL_INTERVAL_MS)
          }
        } else {
          console.error('[transcription] poll failed:', res.error)
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
      console.log('[transcription] START videoPath=', videoPath, 'projectId=', projectId)
      try {
        // 1. Get video metadata
        setTranscriptStatus('extracting', 5)
        console.log('[transcription] Step1: video:meta...')
        const metaRes = await window.api.video.meta(videoPath)
        console.log('[transcription] video:meta result=', metaRes)
        if (metaRes.ok) setVideoDuration(metaRes.meta.duration)
        else console.warn('[transcription] video:meta failed:', metaRes)

        // 2. Extract audio
        setTranscriptStatus('extracting', 15)
        console.log('[transcription] Step2: video:extractAudio...')
        const audioRes = await window.api.video.extractAudio(videoPath, projectId)
        console.log('[transcription] video:extractAudio result=', audioRes)
        if (!audioRes.ok) {
          setTranscriptStatus('error', 0, audioRes.error ?? '音频提取失败')
          return
        }
        setAudioPath(audioRes.audioPath)
        setTranscriptStatus('extracting', 30)

        // 3. Start ASR job
        console.log('[transcription] Step3: transcript:start...')
        const settings = await window.api.settings.getAll()
        console.log('[transcription] settings=', settings)
        const startRes = await window.api.transcript.start({
          audioPath: audioRes.audioPath,
          projectId,
          language: settings['asr.language'] ?? 'zh',
          engine: settings['asr.engine'] ?? 'funasr',
          modelQuality: settings['asr.modelQuality'] ?? 'large',
        })
        console.log('[transcription] transcript:start result=', startRes)

        if (!startRes.ok || !startRes.jobId) {
          setTranscriptStatus('error', 0, startRes.error ?? '转录任务启动失败')
          return
        }

        setJobId(startRes.jobId)
        setTranscriptStatus('transcribing', 35)

        // 4. Poll until done
        console.log('[transcription] Step4: polling jobId=', startRes.jobId)
        pollStatus(startRes.jobId)
      } catch (e: unknown) {
        console.error('[transcription] EXCEPTION:', e)
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

    // If an AI provider is configured, use LLM-based detection
    const activeProvider = await window.api.provider.getActive()
    if (activeProvider) {
      const res = await window.api.transcript.detectFillersLLM({
        words,
        prompt: settings['edit.fillerPrompt'] || undefined,
      })
      if (res.ok) return res.fillerIndices
      console.warn('[detectFillers] LLM 检测失败，降级为字典匹配:', res.error)
    }

    // Fallback: dictionary-based detection
    const res = await window.api.transcript.detectFillers({
      words,
      fillerList: settings['edit.fillerWords'],
    })
    return res.ok ? res.fillerIndices : []
  }, [])

  return { startTranscription, detectSilence, detectFillers, stopPolling }
}
