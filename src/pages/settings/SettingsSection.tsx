// Config-driven settings section renderer
// Renders setting items based on their type from config

import { useEffect, useState } from 'react'
import type { SettingSection, SettingItem } from '@/config/settings.config'

type SettingsSectionProps = {
  section: SettingSection
}

export function SettingsSection({ section }: SettingsSectionProps) {
  const [values, setValues] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const all = await window.api.settings.getAll()
      setValues(all)
      setLoading(false)
    }
    load()
  }, [section.id])

  const handleChange = async (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    await window.api.settings.set(key, value)
  }

  if (loading) {
    return <div className="text-sm text-text-muted">加载中...</div>
  }

  return (
    <div>
      <h2 className="mb-6 text-lg font-semibold text-text">{section.title}</h2>
      <div className="space-y-6">
        {section.items.map((item) => (
          <SettingItemRenderer
            key={item.key}
            item={item}
            value={values[item.key] ?? item.defaultValue}
            onChange={(val) => handleChange(item.key, val)}
          />
        ))}
      </div>
    </div>
  )
}

// --- Individual setting item renderers ---

type ItemProps = {
  item: SettingItem
  value: any
  onChange: (value: unknown) => void
}

function SettingItemRenderer({ item, value, onChange }: ItemProps) {
  return (
    <div className="flex items-start justify-between gap-8">
      <div className="shrink-0">
        <label className="text-sm font-medium text-text">{item.label}</label>
        {item.description && (
          <p className="mt-0.5 text-xs text-text-muted">{item.description}</p>
        )}
      </div>
      <div className="w-64 shrink-0">
        {item.type === 'select' && <SelectInput item={item} value={value} onChange={onChange} />}
        {item.type === 'slider' && <SliderInput item={item} value={value} onChange={onChange} />}
        {item.type === 'input' && <TextInput value={value} onChange={onChange} />}
        {item.type === 'switch' && <SwitchInput value={value} onChange={onChange} />}
        {item.type === 'tags' && <TagsInput value={value} onChange={onChange} />}
        {item.type === 'path' && <PathInput value={value} onChange={onChange} />}
      </div>
    </div>
  )
}

function SelectInput({ item, value, onChange }: ItemProps) {
  const options = (item.props?.options as Array<{ value: string; label: string }>) || []
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-text outline-none focus:border-brand"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

function SliderInput({ item, value, onChange }: ItemProps) {
  const min = (item.props?.min as number) ?? 0
  const max = (item.props?.max as number) ?? 100
  const step = (item.props?.step as number) ?? 1
  const unit = (item.props?.unit as string) ?? ''

  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value ?? min}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-brand"
      />
      <span className="w-16 text-right text-sm text-text-secondary">
        {value}{unit}
      </span>
    </div>
  )
}

function TextInput({ value, onChange }: Omit<ItemProps, 'item'>) {
  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-text outline-none focus:border-brand"
    />
  )
}

function SwitchInput({ value, onChange }: Omit<ItemProps, 'item'>) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative h-6 w-11 rounded-full transition-colors ${value ? 'bg-brand' : 'bg-surface-3'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`}
      />
    </button>
  )
}

function TagsInput({ value, onChange }: Omit<ItemProps, 'item'>) {
  const tags = Array.isArray(value) ? value : []
  const [input, setInput] = useState('')

  const addTag = () => {
    const trimmed = input.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
    }
    setInput('')
  }

  const removeTag = (tag: string) => {
    onChange(tags.filter((t: string) => t !== tag))
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {tags.map((tag: string) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-md bg-surface-3 px-2 py-0.5 text-xs text-text-secondary"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="text-text-muted hover:text-danger"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && addTag()}
        placeholder="输入后回车添加"
        className="w-full rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-text outline-none focus:border-brand"
      />
    </div>
  )
}

function PathInput({ value, onChange }: Omit<ItemProps, 'item'>) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="选择目录..."
        className="flex-1 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-text outline-none focus:border-brand"
        readOnly
      />
      <button
        onClick={() => onChange('')}
        className="shrink-0 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-3"
      >
        选择
      </button>
    </div>
  )
}
