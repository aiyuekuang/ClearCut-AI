// Config-driven settings section renderer
// Renders setting items based on their type from config
// Uses antd components for consistent UI

import { useEffect, useState } from 'react'
import {
  Input, Select, Slider, Switch, Button, Tag, Spin, Tooltip,
} from 'antd'
import { FolderOpen, X } from 'lucide-react'
import type { SettingSection, SettingItem } from '@/config/settings.config'

type SettingsSectionProps = {
  section: SettingSection
}

export function SettingsSection({ section }: SettingsSectionProps) {
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const all = await window.api.settings.getAll()
      setValues(all)
      setLoading(false)
    }
    void load()
  }, [section.id])

  const handleChange = async (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    await window.api.settings.set(key, value)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-text-muted">
        <Spin size="small" />
        <span>加载中...</span>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-1 text-base font-semibold text-text">{section.title}</h2>
      <p className="mb-6 text-xs text-text-muted border-b border-border pb-4">
        {getSectionDescription(section.id)}
      </p>
      <div className="space-y-7">
        {section.items.map((item) => (
          <SettingItemRenderer
            key={item.key}
            item={item}
            value={values[item.key] ?? item.defaultValue}
            onChange={(val) => void handleChange(item.key, val)}
          />
        ))}
      </div>
    </div>
  )
}

function getSectionDescription(id: string): string {
  const map: Record<string, string> = {
    general: '应用行为与基础偏好设置',
    paths: '模型、项目和临时文件的存储位置',
    asr: '语音识别引擎配置，影响转录速度与准确率',
    edit: '自动去静音与去废话的检测参数',
    subtitle: '字幕生成和导出的默认样式',
    export: '视频导出的格式、编码和质量参数',
  }
  return map[id] ?? ''
}

// ─── Individual setting item renderers ─────────────────────────────────────

type ItemProps = {
  item: SettingItem
  value: unknown
  onChange: (value: unknown) => void
}

function SettingItemRenderer({ item, value, onChange }: ItemProps) {
  // Full-width items (textarea, tags) get a stacked layout
  if (item.type === 'textarea' || item.type === 'tags') {
    return (
      <div>
        <div className="mb-2">
          <label className="text-sm font-medium text-text">{item.label}</label>
          {item.description && (
            <p className="mt-0.5 text-xs text-text-muted">{item.description}</p>
          )}
        </div>
        {item.type === 'textarea' && (
          <TextareaInput item={item} value={value} onChange={onChange} />
        )}
        {item.type === 'tags' && (
          <TagsInput item={item} value={value} onChange={onChange} />
        )}
      </div>
    )
  }

  // Inline items: label on left, control on right
  return (
    <div className="flex items-start justify-between gap-8">
      <div className="shrink-0 max-w-[50%]">
        <label className="text-sm font-medium text-text">{item.label}</label>
        {item.description && (
          <p className="mt-0.5 text-xs text-text-muted leading-relaxed">{item.description}</p>
        )}
      </div>
      <div className="w-64 shrink-0">
        {item.type === 'select' && <SelectInput item={item} value={value} onChange={onChange} />}
        {item.type === 'slider' && <SliderInput item={item} value={value} onChange={onChange} />}
        {item.type === 'input'  && <TextInput item={item} value={value} onChange={onChange} />}
        {item.type === 'switch' && <SwitchInput value={value} onChange={onChange} />}
        {item.type === 'path'   && <PathInput item={item} value={value} onChange={onChange} />}
      </div>
    </div>
  )
}

// ─── Controls ───────────────────────────────────────────────────────────────

function SelectInput({ item, value, onChange }: ItemProps) {
  const options = (item.props?.options as Array<{ value: string; label: string }>) ?? []
  return (
    <Select
      size="small"
      value={(value as string) ?? ''}
      onChange={onChange}
      options={options}
      className="w-full"
      popupMatchSelectWidth={false}
    />
  )
}

function SliderInput({ item, value, onChange }: ItemProps) {
  const min  = (item.props?.min  as number) ?? 0
  const max  = (item.props?.max  as number) ?? 100
  const step = (item.props?.step as number) ?? 1
  const unit = (item.props?.unit as string) ?? ''
  const num  = (value as number) ?? min

  return (
    <div className="flex items-center gap-3">
      <Slider
        min={min}
        max={max}
        step={step}
        value={num}
        onChange={(v) => onChange(v)}
        className="flex-1"
        tooltip={{ formatter: (v) => `${v}${unit}` }}
        styles={{
          track: { background: '#22D3EE' },
          rail:  { background: '#2D2D2D' },
        }}
      />
      <span className="w-14 text-right text-xs font-mono text-text-secondary shrink-0">
        {num}{unit}
      </span>
    </div>
  )
}

function SwitchInput({ value, onChange }: Omit<ItemProps, 'item'>) {
  return (
    <Switch
      size="small"
      checked={!!value}
      onChange={onChange}
      style={{ background: value ? '#22D3EE' : undefined }}
    />
  )
}

function TextInput({ item, value, onChange }: ItemProps) {
  const placeholder = (item.props?.placeholder as string) ?? ''
  return (
    <Input
      size="small"
      value={(value as string) ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full"
    />
  )
}

function PathInput({ item, value, onChange }: ItemProps) {
  const defaultHint = (item.props?.placeholder as string) ?? '留空使用默认路径'
  const currentPath = (value as string) ?? ''

  const handleBrowse = async () => {
    try {
      const result = await window.api.settings.selectDir()
      if (result.ok && result.path) onChange(result.path)
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        {/* Read-only display, click folder to change */}
        <div
          className="flex flex-1 min-w-0 cursor-pointer items-center rounded-[6px] border border-border bg-surface px-2 py-1 text-[11px] font-mono hover:border-brand/50 transition-colors"
          onClick={() => void handleBrowse()}
          title={currentPath || defaultHint}
        >
          {currentPath ? (
            /* Show path end (most specific part) by using text-overflow on a reversed container */
            <span className="block w-full overflow-hidden whitespace-nowrap text-text-secondary"
              style={{ direction: 'rtl', textAlign: 'left', unicodeBidi: 'plaintext' }}>
              {currentPath}
            </span>
          ) : (
            <span className="text-text-muted">选择目录...</span>
          )}
        </div>

        {/* Clear button - only when a value is set */}
        {currentPath && (
          <Tooltip title="清除（使用默认路径）" mouseEnterDelay={0.5}>
            <Button
              size="small"
              icon={<X className="h-3 w-3" />}
              onClick={() => onChange('')}
              className="shrink-0 !px-2 !text-text-muted hover:!text-text"
            />
          </Tooltip>
        )}

        <Tooltip title="选择目录" mouseEnterDelay={0.5}>
          <Button
            size="small"
            icon={<FolderOpen className="h-3.5 w-3.5" />}
            onClick={() => void handleBrowse()}
            className="shrink-0 !px-2"
          />
        </Tooltip>
      </div>

      {/* Default path hint shown below when empty */}
      {!currentPath && (
        <p className="text-[11px] text-text-muted leading-relaxed pl-0.5">
          {defaultHint}
        </p>
      )}
    </div>
  )
}

function TagsInput({ item, value, onChange }: ItemProps) {
  const tags = Array.isArray(value) ? (value as string[]) : []
  const [input, setInput] = useState('')
  const placeholder = (item.props?.placeholder as string) ?? '输入后回车添加'

  const addTag = () => {
    const trimmed = input.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
    }
    setInput('')
  }

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag))
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5 min-h-[24px]">
        {tags.map((tag) => (
          <Tag
            key={tag}
            closable
            closeIcon={<X className="h-2.5 w-2.5" />}
            onClose={() => removeTag(tag)}
            bordered={false}
            className="!text-xs !m-0"
          >
            {tag}
          </Tag>
        ))}
      </div>
      <Input
        size="small"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && addTag()}
        placeholder={placeholder}
        className="w-full"
        onBlur={addTag}
      />
    </div>
  )
}

function TextareaInput({ item, value, onChange }: ItemProps) {
  const rows        = (item.props?.rows        as number) ?? 4
  const placeholder = (item.props?.placeholder as string) ?? ''
  return (
    <Input.TextArea
      rows={rows}
      value={(value as string) ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full resize-y font-mono text-xs"
    />
  )
}
