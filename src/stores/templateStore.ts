// Template store - manages clip templates (built-in + custom)
// Persists custom templates and active template ID via settings IPC

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { ClipTemplate } from '@/types/template'
import { BUILT_IN_TEMPLATES } from '@/config/clip-templates.config'

type TemplateState = {
  templates: ClipTemplate[]
  activeTemplateId: string
  loaded: boolean

  loadTemplates: () => Promise<void>
  saveTemplate: (template: ClipTemplate) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
  setActiveTemplate: (id: string) => Promise<void>
  duplicateTemplate: (id: string) => Promise<string | null>
  getActiveTemplate: () => ClipTemplate | null
}

export const useTemplateStore = create<TemplateState>()(
  immer((set, get) => ({
    templates: BUILT_IN_TEMPLATES,
    activeTemplateId: 'default',
    loaded: false,

    loadTemplates: async () => {
      const [customRaw, activeIdRaw] = await Promise.all([
        window.api.settings.get('templates.custom'),
        window.api.settings.get('templates.activeId'),
      ])
      const custom = (customRaw as ClipTemplate[]) ?? []
      const activeId = (activeIdRaw as string) ?? 'default'
      set((s) => {
        s.templates = [...BUILT_IN_TEMPLATES, ...custom]
        s.activeTemplateId = activeId
        s.loaded = true
      })
    },

    saveTemplate: async (template) => {
      set((s) => {
        const idx = s.templates.findIndex((t) => t.id === template.id)
        if (idx >= 0) {
          s.templates[idx] = template
        } else {
          s.templates.push(template)
        }
      })
      const custom = get().templates.filter((t) => !t.builtIn)
      await window.api.settings.set('templates.custom', custom)
    },

    deleteTemplate: async (id) => {
      const nextActive = get().activeTemplateId === id ? 'default' : get().activeTemplateId
      set((s) => {
        s.templates = s.templates.filter((t) => t.id !== id)
        s.activeTemplateId = nextActive
      })
      const custom = get().templates.filter((t) => !t.builtIn)
      await Promise.all([
        window.api.settings.set('templates.custom', custom),
        window.api.settings.set('templates.activeId', nextActive),
      ])
    },

    setActiveTemplate: async (id) => {
      set((s) => { s.activeTemplateId = id })
      await window.api.settings.set('templates.activeId', id)
    },

    duplicateTemplate: async (id) => {
      const source = get().templates.find((t) => t.id === id)
      if (!source) return null
      const newId = `custom-${Date.now()}`
      const newTemplate: ClipTemplate = {
        ...source,
        id: newId,
        name: `${source.name} 副本`,
        builtIn: false,
        createdAt: new Date().toISOString(),
      }
      set((s) => { s.templates.push(newTemplate) })
      const custom = get().templates.filter((t) => !t.builtIn)
      await window.api.settings.set('templates.custom', custom)
      return newId
    },

    getActiveTemplate: () => {
      const { templates, activeTemplateId } = get()
      return templates.find((t) => t.id === activeTemplateId) ?? templates[0] ?? null
    },
  })),
)
