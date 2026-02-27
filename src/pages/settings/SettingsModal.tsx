// Settings modal - custom portal overlay, no antd Modal styling
// Opens as a large dialog from the titlebar settings button
// Click backdrop or press Escape to close

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useUIStore } from '@/stores/uiStore'
import SettingsPage from './SettingsPage'

export function SettingsModal() {
  const { settingsOpen, settingsInitialSection, closeSettings } = useUIStore()

  useEffect(() => {
    if (!settingsOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSettings() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [settingsOpen, closeSettings])

  if (!settingsOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)' }}
      onClick={closeSettings}
    >
      <div
        className="flex overflow-hidden"
        style={{
          width: 860,
          height: 600,
          borderRadius: 14,
          background: '#1e1e1e',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <SettingsPage onClose={closeSettings} initialSection={settingsInitialSection ?? undefined} />
      </div>
    </div>,
    document.body,
  )
}
