// ClearCut-AI Electron Main Process
// Manages window lifecycle, IPC registration, and Python sidecar

import { app, BrowserWindow, protocol, net, ipcMain, shell } from 'electron'
import path from 'path'
import { registerProviderIPC } from './ipc/provider'
import { registerProjectIPC } from './ipc/project'
import { registerSettingsIPC } from './ipc/settings'
import { registerVideoIPC } from './ipc/video'
import { registerTranscriptIPC } from './ipc/transcript'
import { registerSubtitleIPC } from './ipc/subtitle'
import { registerLLMIPC } from './ipc/llm'
import { registerOAuthIPC } from './ipc/oauth'
import { startSidecar, stopSidecar } from './sidecar'

// Register custom scheme before app is ready (required by Electron)
protocol.registerSchemesAsPrivileged([
  { scheme: 'clearcut', privileges: { secure: true, standard: true, stream: true, supportFetchAPI: true } },
])

const isDev = !app.isPackaged

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: 'ClearCut-AI',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    // mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Register all IPC handlers
function registerAllIPC() {
  registerProviderIPC()
  registerProjectIPC()
  registerSettingsIPC()
  registerVideoIPC()
  registerTranscriptIPC()
  registerSubtitleIPC()
  registerLLMIPC()
  registerOAuthIPC()

  // Open external URL in system browser
  ipcMain.handle('app:open-external', async (_event, url: string) => {
    if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
      await shell.openExternal(url)
    }
  })
}

app.whenReady().then(async () => {
  // Serve local media files via clearcut:// protocol to bypass HTTP→file:// security restrictions
  protocol.handle('clearcut', (request) => {
    const url = new URL(request.url)
    const filePath = decodeURIComponent(url.pathname)
    return net.fetch(`file://${filePath}`)
  })

  registerAllIPC()
  createWindow()

  // Start Python sidecar (non-blocking, UI shows spinner while loading)
  startSidecar().catch((e: unknown) => {
    console.error('[main] Sidecar failed to start:', e)
    const errMsg = e instanceof Error ? e.message : 'AI 引擎启动失败'
    // Notify renderer — window is guaranteed to be loaded by the 30s sidecar timeout
    const send = () => mainWindow?.webContents.send('app:sidecar-error', errMsg)
    if (mainWindow?.webContents.isLoading()) {
      mainWindow.webContents.once('did-finish-load', send)
    } else {
      send()
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  stopSidecar()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
