// Python AI Engine Sidecar
// Manages the lifecycle of the Python FastAPI subprocess
// Handles startup, health checks, shutdown, and request proxying

import { ChildProcess, spawn } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import { app } from 'electron'
import { net } from 'electron'

const SIDECAR_PORT = 18721
const SIDECAR_BASE_URL = `http://127.0.0.1:${SIDECAR_PORT}`
const STARTUP_TIMEOUT_MS = 30_000
const HEALTH_POLL_INTERVAL_MS = 500

let sidecarProcess: ChildProcess | null = null
let isReady = false

function getPythonPath(): string {
  const isDev = !app.isPackaged

  if (isDev) {
    // In development, use the venv in ai-engine/
    const venvPython = path.join(app.getAppPath(), 'ai-engine', 'venv', 'bin', 'python3')
    if (fs.existsSync(venvPython)) return venvPython

    // Fallback to system python3
    return 'python3'
  }

  // In production, use the bundled Python sidecar binary
  const resourcesPath = process.resourcesPath
  const sidecarBin = path.join(resourcesPath, 'sidecar', 'main')
  if (fs.existsSync(sidecarBin)) return sidecarBin

  return 'python3'
}

function getEntryScript(): string {
  const isDev = !app.isPackaged
  if (isDev) {
    return path.join(app.getAppPath(), 'ai-engine', 'main.py')
  }
  return '' // bundled binary, no script needed
}

export async function startSidecar(): Promise<void> {
  if (sidecarProcess && isReady) return

  const pythonPath = getPythonPath()
  const entryScript = getEntryScript()

  const args = entryScript
    ? [entryScript, '--port', String(SIDECAR_PORT)]
    : ['--port', String(SIDECAR_PORT)]

  console.log('[sidecar] Starting:', pythonPath, args.join(' '))

  sidecarProcess = spawn(pythonPath, args, {
    cwd: path.join(app.getAppPath(), 'ai-engine'),
    env: { ...process.env, PYTHONUNBUFFERED: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  sidecarProcess.stdout?.on('data', (d: Buffer) =>
    console.log('[sidecar]', d.toString().trim()),
  )
  sidecarProcess.stderr?.on('data', (d: Buffer) =>
    console.error('[sidecar:err]', d.toString().trim()),
  )
  sidecarProcess.on('exit', (code) => {
    console.log('[sidecar] exited with code', code)
    isReady = false
    sidecarProcess = null
  })

  await waitForReady()
}

async function waitForReady(): Promise<void> {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS

  while (Date.now() < deadline) {
    try {
      const ok = await healthCheck()
      if (ok) {
        isReady = true
        console.log('[sidecar] Ready on port', SIDECAR_PORT)
        return
      }
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, HEALTH_POLL_INTERVAL_MS))
  }

  throw new Error(`[sidecar] Failed to start within ${STARTUP_TIMEOUT_MS}ms`)
}

async function healthCheck(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = net.request(`${SIDECAR_BASE_URL}/health`)
    req.on('response', (res) => resolve(res.statusCode === 200))
    req.on('error', () => resolve(false))
    req.end()
  })
}

export function stopSidecar(): void {
  if (sidecarProcess) {
    sidecarProcess.kill('SIGTERM')
    sidecarProcess = null
    isReady = false
    console.log('[sidecar] Stopped')
  }
}

export function isSidecarReady(): boolean {
  return isReady
}

// Proxy a request to the Python sidecar
export async function sidecarRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  if (!isReady) throw new Error('AI engine is not ready')

  const url = `${SIDECAR_BASE_URL}${path}`

  return new Promise((resolve, reject) => {
    const req = net.request({ method, url })
    req.setHeader('Content-Type', 'application/json')

    req.on('response', (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => {
        try {
          const text = Buffer.concat(chunks).toString()
          const json = JSON.parse(text) as T
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Sidecar error ${res.statusCode}: ${text}`))
          } else {
            resolve(json)
          }
        } catch (e) {
          reject(e)
        }
      })
    })

    req.on('error', reject)

    if (body !== undefined) {
      req.write(JSON.stringify(body))
    }
    req.end()
  })
}
