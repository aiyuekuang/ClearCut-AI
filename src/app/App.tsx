// App root - config-driven router with antd dark theme provider
// Reads routes from config and renders them with layout

import { Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ConfigProvider, App as AntdApp, theme, Spin } from 'antd'
import { routes } from '@/config/routes.config'
import { AppLayout } from '@/components/layout/AppLayout'

const antdTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#22D3EE',
    colorBgBase: '#181818',
    colorBgContainer: '#222222',
    colorBgElevated: '#2D2D2D',
    colorBgLayout: '#181818',
    colorBorder: '#3A3A3A',
    colorBorderSecondary: '#2D2D2D',
    colorText: '#F0F0F0',
    colorTextSecondary: '#A0A0A0',
    colorTextTertiary: '#666666',
    colorTextQuaternary: '#555555',
    colorError: '#E11D48',
    colorSuccess: '#22c55e',
    colorWarning: '#f59e0b',
    borderRadius: 8,
    borderRadiusSM: 6,
    borderRadiusLG: 12,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", "Segoe UI", Roboto, sans-serif',
    fontSize: 13,
    controlHeight: 30,
    controlHeightSM: 26,
    controlHeightLG: 36,
    motionDurationMid: '0.15s',
    motionDurationSlow: '0.2s',
  },
  components: {
    Button: {
      borderRadius: 6,
      borderRadiusSM: 5,
      fontSize: 12,
      fontSizeSM: 12,
    },
    Menu: {
      itemBg: 'transparent',
      subMenuItemBg: 'transparent',
      itemSelectedBg: 'rgba(34,211,238,0.1)',
      itemSelectedColor: '#22D3EE',
      itemHoverBg: '#222222',
      itemHoverColor: '#F0F0F0',
      itemColor: '#A0A0A0',
      iconSize: 15,
      itemHeight: 36,
      itemBorderRadius: 8,
    },
    Card: {
      borderRadius: 10,
      headerBg: 'transparent',
    },
    Tooltip: {
      borderRadius: 6,
      fontSize: 12,
      colorBgSpotlight: '#2D2D2D',
    },
    Progress: {
      defaultColor: '#22D3EE',
    },
    Dropdown: {
      borderRadius: 8,
      paddingBlock: 4,
    },
    Tag: {
      borderRadius: 4,
      fontSize: 11,
    },
    Popconfirm: {
      fontSize: 13,
    },
  },
}

export function App() {
  return (
    <ConfigProvider theme={antdTheme}>
      <AntdApp>
        <BrowserRouter>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route element={<AppLayout />}>
                {routes.map((route) => (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={<route.component />}
                  />
                ))}
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  )
}

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-surface">
      <Spin size="large" />
    </div>
  )
}
