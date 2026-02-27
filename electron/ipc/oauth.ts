// OAuth IPC handlers - Device Code 登录流程

import { ipcMain } from 'electron'
import { startOAuthFlow, cancelOAuthFlow } from '../providers/oauth/index'
import type { OAuthProviderId } from '../providers/oauth/index'

const OAUTH_PROVIDER_IDS: OAuthProviderId[] = ['qwen-portal']

export function registerOAuthIPC() {
  // 启动 OAuth 流程 - 异步，通过 oauth:status 事件推送状态
  ipcMain.handle('oauth:start', async (event, providerId: string) => {
    if (!OAUTH_PROVIDER_IDS.includes(providerId as OAuthProviderId)) {
      return { ok: false, error: `不支持的 OAuth 提供商: ${providerId}` }
    }
    // 不 await - 让流程在后台运行，通过事件推送状态
    startOAuthFlow(providerId as OAuthProviderId, event.sender)
    return { ok: true }
  })

  // 取消 OAuth 流程
  ipcMain.handle('oauth:cancel', async (_event, providerId: string) => {
    cancelOAuthFlow(providerId)
    return { ok: true }
  })
}
