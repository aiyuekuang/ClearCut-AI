// Settings page - config-driven settings renderer
// Reads settingsSections from config and renders each section automatically
// Rendered inside SettingsModal, not as a standalone route

import { useState } from 'react'
import { Menu } from 'antd'
import { X } from 'lucide-react'
import {
  Mic, WandSparkles, Captions, Brain, Download, Info,
  LayoutTemplate, SlidersHorizontal, FolderOpen,
} from 'lucide-react'
import { settingsSections } from '@/config/settings.config'
import { SettingsSection } from './SettingsSection'
import AIEngineSettings from './AIEngineSettings'
import { AboutSection } from './AboutSection'
import { TemplatesSection } from './TemplatesSection'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  mic: Mic,
  'wand-sparkles': WandSparkles,
  captions: Captions,
  brain: Brain,
  download: Download,
  'layout-template': LayoutTemplate,
  info: Info,
  'sliders-horizontal': SlidersHorizontal,
  'folder-open': FolderOpen,
}

type Props = {
  onClose?: () => void
  initialSection?: string
}

export default function SettingsPage({ onClose, initialSection }: Props) {
  const [activeSection, setActiveSection] = useState(initialSection ?? settingsSections[0]?.id ?? 'general')

  const menuItems = settingsSections.map((section) => {
    const Icon = iconMap[section.icon]
    return {
      key: section.id,
      label: section.title,
      icon: Icon ? <Icon className="h-[15px] w-[15px]" /> : null,
    }
  })

  return (
    <div className="flex w-full">
      {/* Sidebar navigation */}
      <nav className="w-48 shrink-0 border-r border-border bg-[#181818] flex flex-col py-5 px-2">
        <p className="mb-3 px-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
          设置
        </p>
        <Menu
          mode="inline"
          selectedKeys={[activeSection]}
          onSelect={({ key }) => setActiveSection(key)}
          items={menuItems}
          style={{
            border: 'none',
            background: 'transparent',
            fontSize: 13,
          }}
          inlineIndent={12}
        />
      </nav>

      {/* Content area */}
      <div className="flex flex-1 flex-col min-w-0 bg-[#1e1e1e]">
        {/* Header with close button */}
        <div className="flex h-11 shrink-0 items-center justify-end px-4 border-b border-border">
          {onClose && (
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Section content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === 'ai-engine' ? (
            <AIEngineSettings />
          ) : activeSection === 'templates' ? (
            <TemplatesSection />
          ) : activeSection === 'about' ? (
            <AboutSection />
          ) : (
            <SettingsSection
              section={settingsSections.find((s) => s.id === activeSection)!}
            />
          )}
        </div>
      </div>
    </div>
  )
}
