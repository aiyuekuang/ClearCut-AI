// OAuth 统一流程管理 - Device Code flow
// 参照 openclaw-cn 实现

import { shell } from 'electron'
import type { WebContents } from 'electron'
import { setProviderAuth } from '../store'
import { requestQwenDeviceCode, pollQwenToken } from './qwen'

export type OAuthProviderId = 'qwen-portal'

export interface OAuthDeviceCodeInfo {
  userCode: string
  verificationUri: string
  expiresIn: number
}

export type OAuthStatus =
  | { status: 'device_code'; info: OAuthDeviceCodeInfo }
  | { status: 'polling' }
  | { status: 'success' }
  | { status: 'error'; error: string }

const activeFlows = new Map<string, AbortController>()

export function cancelOAuthFlow(providerId: string) {
  const controller = activeFlows.get(providerId)
  if (controller) {
    controller.abort()
    activeFlows.delete(providerId)
  }
}

export async function startOAuthFlow(
  providerId: OAuthProviderId,
  sender: WebContents
): Promise<void> {
  // 取消同一提供商的现有流程
  cancelOAuthFlow(providerId)

  const controller = new AbortController()
  activeFlows.set(providerId, controller)

  const sendStatus = (status: OAuthStatus) => {
    if (!sender.isDestroyed()) {
      sender.send('oauth:status', { providerId, ...status })
    }
  }

  try {
    switch (providerId) {
      case 'qwen-portal': {
        const { deviceCode, _internal } = await requestQwenDeviceCode()
        const uri = deviceCode.verificationUriComplete || deviceCode.verificationUri

        sendStatus({
          status: 'device_code',
          info: {
            userCode: deviceCode.userCode,
            verificationUri: uri,
            expiresIn: deviceCode.expiresIn,
          },
        })

        shell.openExternal(uri)
        sendStatus({ status: 'polling' })

        const token = await pollQwenToken(deviceCode, _internal, controller.signal)

        setProviderAuth({
          providerId: 'qwen-portal',
          mode: 'oauth',
          accessToken: token.access,
          refreshToken: token.refresh,
          expiresAt: token.expires,
        })

        sendStatus({ status: 'success' })
        break
      }
    }
  } catch (err) {
    if (controller.signal.aborted) {
      sendStatus({ status: 'error', error: '已取消' })
    } else {
      sendStatus({ status: 'error', error: err instanceof Error ? err.message : String(err) })
    }
  } finally {
    activeFlows.delete(providerId)
  }
}
