// Sidebar navigation - config-driven from routes.config.ts
// Only shows routes with showInNav: true

import { NavLink } from 'react-router-dom'
import { Home, Settings } from 'lucide-react'
import { Tooltip } from 'antd'
import { routes } from '@/config/routes.config'
import { cn } from '@/lib/utils'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  settings: Settings,
}

export function Sidebar() {
  const navRoutes = routes.filter((r) => r.showInNav)

  return (
    <aside className="flex w-14 flex-col items-center gap-1 border-r border-border bg-surface py-3">
      {navRoutes.map((route) => {
        const Icon = route.icon ? iconMap[route.icon] : null
        return (
          <Tooltip key={route.path} title={route.name} placement="right" mouseEnterDelay={0.4}>
            <NavLink
              to={route.path}
              className={({ isActive }) =>
                cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150',
                  isActive
                    ? 'bg-brand/15 text-brand shadow-sm'
                    : 'text-text-muted hover:bg-surface-2 hover:text-text-secondary',
                )
              }
            >
              {Icon && <Icon className="h-[18px] w-[18px]" />}
            </NavLink>
          </Tooltip>
        )
      })}
    </aside>
  )
}
