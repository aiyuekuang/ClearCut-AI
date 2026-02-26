// App layout with titlebar and content area
// Editor page uses full-screen layout, other pages use sidebar navigation

import { Outlet, useLocation } from 'react-router-dom'
import { Titlebar } from './Titlebar'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const location = useLocation()
  const isEditorPage = location.pathname.startsWith('/editor/')

  if (isEditorPage) {
    // Editor uses full-width layout without sidebar
    return (
      <div className="flex h-screen flex-col">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <Titlebar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
