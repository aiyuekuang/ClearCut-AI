// Settings page - config-driven settings renderer
// Reads settingsSections from config and renders each section automatically
// AI section uses dedicated AISettings component

import { useState } from 'react'
import {
  Mic, WandSparkles, Captions, Brain, Download, Info,
} from 'lucide-react'
import { settingsSections } from '@/config/settings.config'
import { cn } from '@/lib/utils'
import { SettingsSection } from './SettingsSection'
import AISettings from './AISettings'
import { AboutSection } from './AboutSection'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  mic: Mic,
  'wand-sparkles': WandSparkles,
  captions: Captions,
  brain: Brain,
  download: Download,
  info: Info,
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState(settingsSections[0]?.id || 'asr')

  return (
    <div className="mx-auto flex max-w-5xl gap-8">
      {/* Sidebar navigation */}
      <nav className="w-48 shrink-0">
        <h2 className="mb-4 text-lg font-semibold text-text">设置</h2>
        <ul className="space-y-1">
          {settingsSections.map((section) => {
            const Icon = iconMap[section.icon]
            return (
              <li key={section.id}>
                <button
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                    activeSection === section.id
                      ? 'bg-brand/15 text-brand'
                      : 'text-text-secondary hover:bg-surface-2 hover:text-text',
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {section.title}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {activeSection === 'ai' ? (
          <AISettings />
        ) : activeSection === 'about' ? (
          <AboutSection />
        ) : (
          <SettingsSection
            section={settingsSections.find((s) => s.id === activeSection)!}
          />
        )}
      </div>
    </div>
  )
}
