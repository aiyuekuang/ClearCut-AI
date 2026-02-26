// App root - config-driven router
// Reads routes from config and renders them with layout

import { Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { routes } from '@/config/routes.config'
import { AppLayout } from '@/components/layout/AppLayout'

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route element={<AppLayout />}>
            {routes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={<route.component />}
              />
            ))}
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-surface">
      <div className="text-text-secondary">加载中...</div>
    </div>
  )
}
