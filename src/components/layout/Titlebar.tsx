// macOS-style titlebar with traffic light offset
// Left: logo + template switcher  Right: settings button
// Uses -webkit-app-region for native drag behavior

import { useEffect } from 'react'
import { Scissors, Settings, LayoutTemplate } from 'lucide-react'
import { Button, Select, Tooltip } from 'antd'
import { useTemplateStore } from '@/stores/templateStore'
import { useUIStore } from '@/stores/uiStore'

export function Titlebar() {
  const { templates, activeTemplateId, loaded, loadTemplates, setActiveTemplate } =
    useTemplateStore()
  const { settingsOpen, openSettings } = useUIStore()

  useEffect(() => {
    if (!loaded) void loadTemplates()
  }, [loaded, loadTemplates])

  return (
    <header className="titlebar-drag flex h-11 shrink-0 items-center border-b border-border bg-surface px-3">
      {/* macOS traffic light spacer */}
      <div className="w-[72px] shrink-0" />

      {/* Logo */}
      <div className="titlebar-no-drag flex items-center gap-1.5 mr-4 select-none">
        <Scissors className="h-4 w-4 text-brand" />
        <span className="text-sm font-semibold text-text tracking-tight">ClearCut</span>
      </div>

      {/* Template Switcher */}
      <div className="titlebar-no-drag flex items-center gap-1.5">
        <LayoutTemplate className="h-3.5 w-3.5 text-text-muted shrink-0" />
        <Select
          size="small"
          value={activeTemplateId}
          onChange={(id) => void setActiveTemplate(id)}
          options={templates.map((t) => ({
            value: t.id,
            label: (
              <span className="flex items-center gap-1.5">
                <span>{t.name}</span>
                {t.builtIn && (
                  <span className="text-[10px] text-text-muted rounded px-1 bg-surface-3">
                    内置
                  </span>
                )}
              </span>
            ),
          }))}
          variant="borderless"
          style={{ width: 148 }}
          className="!text-xs !text-text-secondary"
          popupMatchSelectWidth={false}
          dropdownStyle={{ minWidth: 180 }}
        />
      </div>

      {/* Drag area spacer */}
      <div className="flex-1" />

      {/* Settings button */}
      <div className="titlebar-no-drag">
        <Tooltip title="设置" placement="bottomRight" mouseEnterDelay={0.4}>
          <Button
            type="text"
            size="small"
            icon={<Settings className="h-4 w-4" />}
            onClick={openSettings}
            className={
              settingsOpen
                ? '!text-brand !bg-brand/10'
                : '!text-text-muted hover:!text-text hover:!bg-surface-2'
            }
          />
        </Tooltip>
      </div>
    </header>
  )
}
