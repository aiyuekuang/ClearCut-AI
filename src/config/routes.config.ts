// Route configuration - single source of truth for all app routes
// Config-driven: add a route here, the router engine renders it automatically

import type { ComponentType, LazyExoticComponent } from 'react'
import { lazy } from 'react'

export type RouteConfig = {
  path: string
  name: string
  icon?: string
  component: LazyExoticComponent<ComponentType<any>>
  /** Show in sidebar navigation */
  showInNav?: boolean
  /** Child routes */
  children?: RouteConfig[]
}

export const routes: RouteConfig[] = [
  {
    path: '/',
    name: '首页',
    icon: 'home',
    component: lazy(() => import('@/pages/home/HomePage')),
    showInNav: true,
  },
  {
    path: '/editor/:projectId',
    name: '编辑器',
    icon: 'scissors',
    component: lazy(() => import('@/pages/editor/EditorPage')),
  },
]
