// macOS-style titlebar with traffic light offset
// Uses -webkit-app-region for native drag behavior

import { Scissors } from 'lucide-react'

export function Titlebar() {
  return (
    <header className="titlebar-drag flex h-12 shrink-0 items-center border-b border-border bg-surface px-4">
      {/* macOS traffic light spacer */}
      <div className="w-20" />

      {/* Logo */}
      <div className="titlebar-no-drag flex items-center gap-2">
        <Scissors className="h-5 w-5 text-brand" />
        <span className="text-sm font-semibold text-text">ClearCut-AI</span>
      </div>
    </header>
  )
}
