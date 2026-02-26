// Project IPC handlers - manages video projects
// Handles import, list, delete, and project state

import { ipcMain, dialog, BrowserWindow } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

const PROJECTS_DIR = path.join(app?.getPath('userData') || '', 'projects')
const PROJECTS_INDEX = path.join(PROJECTS_DIR, 'index.json')

function ensureProjectsDir() {
  if (!fs.existsSync(PROJECTS_DIR)) {
    fs.mkdirSync(PROJECTS_DIR, { recursive: true })
  }
}

function loadProjectIndex(): any[] {
  try {
    if (fs.existsSync(PROJECTS_INDEX)) {
      return JSON.parse(fs.readFileSync(PROJECTS_INDEX, 'utf-8'))
    }
  } catch {
    // ignore
  }
  return []
}

function saveProjectIndex(projects: any[]) {
  ensureProjectsDir()
  fs.writeFileSync(PROJECTS_INDEX, JSON.stringify(projects, null, 2))
}

export function registerProjectIPC() {
  // Open file dialog to import video
  ipcMain.handle('project:import-dialog', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return { ok: false, error: '无可用窗口' }

    const result = await dialog.showOpenDialog(win, {
      title: '导入视频',
      filters: [
        { name: '视频文件', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm'] },
        { name: '所有文件', extensions: ['*'] },
      ],
      properties: ['openFile'],
    })

    if (result.canceled || !result.filePaths[0]) {
      return { ok: false, canceled: true }
    }

    return { ok: true, filePath: result.filePaths[0] }
  })

  // Create a new project from a video file
  ipcMain.handle('project:create', async (_event, filePath: string, name?: string) => {
    try {
      const stat = fs.statSync(filePath)
      const id = `proj_${Date.now()}`
      const projectName = name || path.basename(filePath, path.extname(filePath))

      const project = {
        id,
        name: projectName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sourceVideo: filePath,
        fileSize: stat.size,
        status: 'imported',
      }

      // Create project directory
      const projectDir = path.join(PROJECTS_DIR, id)
      fs.mkdirSync(projectDir, { recursive: true })

      // Save project metadata
      fs.writeFileSync(
        path.join(projectDir, 'project.json'),
        JSON.stringify(project, null, 2),
      )

      // Add to index
      const index = loadProjectIndex()
      index.unshift(project)
      saveProjectIndex(index)

      return { ok: true, project }
    } catch (e: any) {
      return { ok: false, error: e.message }
    }
  })

  // List all projects
  ipcMain.handle('project:list', () => {
    return loadProjectIndex()
  })

  // Delete a project
  ipcMain.handle('project:delete', (_event, projectId: string) => {
    try {
      const index = loadProjectIndex()
      const filtered = index.filter((p) => p.id !== projectId)
      saveProjectIndex(filtered)

      // Remove project directory
      const projectDir = path.join(PROJECTS_DIR, projectId)
      if (fs.existsSync(projectDir)) {
        fs.rmSync(projectDir, { recursive: true })
      }

      return { ok: true }
    } catch (e: any) {
      return { ok: false, error: e.message }
    }
  })

  // Get a single project
  ipcMain.handle('project:get', (_event, projectId: string) => {
    const projectFile = path.join(PROJECTS_DIR, projectId, 'project.json')
    try {
      if (fs.existsSync(projectFile)) {
        return JSON.parse(fs.readFileSync(projectFile, 'utf-8'))
      }
    } catch {
      // ignore
    }
    return null
  })
}
