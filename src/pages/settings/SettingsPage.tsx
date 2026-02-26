// Settings page - config-driven settings renderer
// Reads settingsSections from config and renders each section automatically
// AI section uses dedicated AISettings component

import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu } from 'antd'
import {
  Mic, WandSparkles, Captions, Brain, Download, Info,
  LayoutTemplate, SlidersHorizontal, FolderOpen,
} from 'lucide-react'
import { settingsSections } from '@/config/settings.config'
import { SettingsSection } from './SettingsSection'
import AISettings from './AISettings'
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

export default function SettingsPage() {
  const location = useLocation()
  const initialSection =
    (location.state as { section?: string } | null)?.section ?? settingsSections[0]?.id ?? 'general'
  const [activeSection, setActiveSection] = useState(initialSection)

  const menuItems = settingsSections.map((section) => {
    const Icon = iconMap[section.icon]
    return {
      key: section.id,
      label: section.title,
      icon: Icon ? <Icon className="h-[15px] w-[15px]" /> : null,
    }
  })

  return (
    <div className="mx-auto flex max-w-5xl gap-6">
      {/* Sidebar navigation */}
      <nav className="w-44 shrink-0">
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

      {/* Divider */}
      <div className="w-px bg-border shrink-0" />

      {/* Content */}
      <div className="min-w-0 flex-1 pt-0.5">
        {activeSection === 'ai' ? (
          <AISettings />
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
  )
}
