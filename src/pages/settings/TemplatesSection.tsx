// Template management UI - left: template card list, right: template editor
// Built-in templates are read-only (can be duplicated, not edited/deleted)

import { useEffect, useState } from 'react'
import { Check, Copy, Lock, Plus, Trash2 } from 'lucide-react'
import { useTemplateStore } from '@/stores/templateStore'
import type { ClipTemplate } from '@/types/template'
import { subtitleTemplates } from '@/config/subtitle-templates.config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export function TemplatesSection() {
  const {
    templates,
    activeTemplateId,
    loaded,
    loadTemplates,
    saveTemplate,
    deleteTemplate,
    setActiveTemplate,
    duplicateTemplate,
  } = useTemplateStore()

  const [selectedId, setSelectedId] = useState<string>('')
  const [draft, setDraft] = useState<ClipTemplate | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (!loaded) loadTemplates()
  }, [loaded, loadTemplates])

  // Select first template once loaded
  useEffect(() => {
    if (loaded && templates.length > 0 && !selectedId) {
      selectTemplate(templates[0].id)
    }
  }, [loaded, templates]) // eslint-disable-line react-hooks/exhaustive-deps

  function selectTemplate(id: string) {
    const t = templates.find((x) => x.id === id)
    if (!t) return
    setSelectedId(id)
    setDraft({ ...t })
    setIsDirty(false)
  }

  function patchDraft<K extends keyof ClipTemplate>(key: K, value: ClipTemplate[K]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
    setIsDirty(true)
  }

  async function handleSave() {
    if (!draft) return
    await saveTemplate(draft)
    setIsDirty(false)
  }

  async function handleNew() {
    const newTemplate: ClipTemplate = {
      id: `custom-${Date.now()}`,
      name: '新建模板',
      description: '',
      builtIn: false,
      createdAt: new Date().toISOString(),
      fillerPrompt: '',
      subtitleTemplateId: 'classic-white',
    }
    await saveTemplate(newTemplate)
    selectTemplate(newTemplate.id)
  }

  async function handleDuplicate() {
    if (!selectedId) return
    const newId = await duplicateTemplate(selectedId)
    if (newId) selectTemplate(newId)
  }

  async function handleDelete() {
    if (!draft || draft.builtIn) return
    const fallbackId = templates.find((t) => t.id !== draft.id)?.id ?? ''
    await deleteTemplate(draft.id)
    if (fallbackId) selectTemplate(fallbackId)
    else { setSelectedId(''); setDraft(null) }
  }

  const isBuiltIn = draft?.builtIn ?? false

  // Subtitle template color preview dot
  const subtitleColorMap = Object.fromEntries(
    subtitleTemplates.map((st) => [st.id, st.style.primaryColor]),
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-text">模板管理</h2>
          <p className="mt-0.5 text-sm text-text-secondary">
            将提示词、字幕样式打包为可复用的剪辑预设
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={handleNew} className="cursor-pointer">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          新建模板
        </Button>
      </div>

      <div className="flex gap-5">
        {/* ── Left: Template list ── */}
        <div className="w-44 shrink-0 space-y-1.5">
          {templates.map((t) => {
            const isSelected = t.id === selectedId
            const isActive = t.id === activeTemplateId
            return (
              <button
                key={t.id}
                onClick={() => selectTemplate(t.id)}
                className={cn(
                  'group w-full cursor-pointer rounded-lg border p-3 text-left transition-all',
                  isSelected
                    ? 'border-brand/40 bg-brand/8 ring-1 ring-brand/25'
                    : 'border-border bg-surface-1 hover:border-border-hover hover:bg-surface-2',
                )}
              >
                <p className="truncate text-sm font-medium text-text">{t.name}</p>
                {t.description && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-text-tertiary">{t.description}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  {t.builtIn && (
                    <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
                      内置
                    </span>
                  )}
                  {isActive && (
                    <span className="flex items-center gap-0.5 rounded bg-brand/15 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                      <Check className="h-2.5 w-2.5" />
                      当前
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* ── Right: Editor ── */}
        {draft ? (
          <div className="min-w-0 flex-1 rounded-xl border border-border bg-surface-1 p-5">
            {/* Built-in notice */}
            {isBuiltIn && (
              <div className="mb-5 flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-text-secondary">
                <Lock className="h-3.5 w-3.5 shrink-0" />
                内置模板不可修改。点击「复制模板」可创建自定义副本。
              </div>
            )}

            {/* Name + Description */}
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-medium text-text-secondary">模板名称</Label>
                <Input
                  value={draft.name}
                  onChange={(e) => patchDraft('name', e.target.value)}
                  disabled={isBuiltIn}
                  className="mt-1.5 h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-text-secondary">描述（可选）</Label>
                <Input
                  value={draft.description}
                  onChange={(e) => patchDraft('description', e.target.value)}
                  disabled={isBuiltIn}
                  placeholder="简短描述这个模板的用途"
                  className="mt-1.5 h-8 text-sm"
                />
              </div>
            </div>

            {/* Filler Prompt */}
            <div className="mb-4">
              <Label className="text-xs font-medium text-text-secondary">
                去废话提示词
                <span className="ml-1.5 font-normal text-text-tertiary">
                  — 发给 AI 的分析指令
                </span>
              </Label>
              <Textarea
                value={draft.fillerPrompt}
                onChange={(e) => patchDraft('fillerPrompt', e.target.value)}
                disabled={isBuiltIn}
                placeholder={`请分析转录文本，识别并标记废话内容...

返回 JSON：{"delete_indices": [...]}`}
                className="mt-1.5 min-h-[180px] resize-y font-mono text-xs leading-relaxed"
              />
            </div>

            {/* Subtitle Style */}
            <div className="mb-6">
              <Label className="text-xs font-medium text-text-secondary">
                字幕样式
                <span className="ml-1.5 font-normal text-text-tertiary">
                  — 生成字幕时使用的默认风格
                </span>
              </Label>
              <Select
                value={draft.subtitleTemplateId}
                onValueChange={(v) => patchDraft('subtitleTemplateId', v)}
                disabled={isBuiltIn}
              >
                <SelectTrigger className="mt-1.5 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subtitleTemplates.map((st) => (
                    <SelectItem key={st.id} value={st.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 shrink-0 rounded-full border border-black/10"
                          style={{ background: subtitleColorMap[st.id] ?? '#fff' }}
                        />
                        <span>{st.name}</span>
                        <span className="text-text-tertiary">— {st.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action bar */}
            <div className="flex items-center justify-between border-t border-border pt-4">
              {/* Left actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDuplicate}
                  className="h-8 cursor-pointer text-xs"
                >
                  <Copy className="mr-1.5 h-3 w-3" />
                  复制模板
                </Button>
                {!isBuiltIn && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDelete}
                    className="h-8 cursor-pointer text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="mr-1.5 h-3 w-3" />
                    删除
                  </Button>
                )}
              </div>

              {/* Right actions */}
              <div className="flex gap-2">
                {activeTemplateId !== draft.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTemplate(draft.id)}
                    className="h-8 cursor-pointer text-xs"
                  >
                    <Check className="mr-1.5 h-3 w-3" />
                    设为当前
                  </Button>
                )}
                {!isBuiltIn && (
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={!isDirty}
                    className="h-8 cursor-pointer text-xs"
                  >
                    保存
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 items-center justify-center rounded-xl border border-dashed border-border text-sm text-text-tertiary">
            {loaded ? '选择或新建一个模板' : '加载中...'}
          </div>
        )}
      </div>
    </div>
  )
}
