// Clip template - a named preset bundle for the editing workflow
// Bundles: filler prompt + subtitle style reference
// Future presets (e.g. export settings) can be added as optional fields

export type ClipTemplate = {
  id: string
  name: string
  description: string
  builtIn: boolean       // built-in templates cannot be deleted, only duplicated
  createdAt: string      // ISO date string

  // Preset 1: AI filler word removal prompt
  fillerPrompt: string

  // Preset 2: Default subtitle style (references subtitle-templates.config.ts)
  subtitleTemplateId: string
}
