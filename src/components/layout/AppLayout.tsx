// App layout with titlebar and content area
// Editor page uses full-screen layout, other pages use sidebar navigation
// SettingsModal is rendered at layout level so it overlays any page

import { Outlet, useLocation } from 'react-router-dom'
import { Titlebar } from './Titlebar'
import { SettingsModal } from '@/pages/settings/SettingsModal'

export function AppLayout() {
  const location = useLocation()
  const isEditorPage = location.pathname.startsWith('/editor/')

  if (isEditorPage) {
    return (
      <div className="flex h-screen flex-col">
        <Outlet />
        <SettingsModal />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <Titlebar />
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
      <SettingsModal />
    </div>
  )
}
