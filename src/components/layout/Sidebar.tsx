// Sidebar navigation - config-driven from routes.config.ts
// Only shows routes with showInNav: true

import { NavLink } from 'react-router-dom'
import { Home, Settings } from 'lucide-react'
import { routes } from '@/config/routes.config'
import { cn } from '@/lib/utils'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  settings: Settings,
}

export function Sidebar() {
  const navRoutes = routes.filter((r) => r.showInNav)

  return (
    <aside className="flex w-16 flex-col items-center gap-2 border-r border-border bg-surface py-4">
      {navRoutes.map((route) => {
        const Icon = route.icon ? iconMap[route.icon] : null
        return (
          <NavLink
            key={route.path}
            to={route.path}
            className={({ isActive }) =>
              cn(
                'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                isActive
                  ? 'bg-brand/15 text-brand'
                  : 'text-text-muted hover:bg-surface-2 hover:text-text-secondary',
              )
            }
            title={route.name}
          >
            {Icon && <Icon className="h-5 w-5" />}
          </NavLink>
        )
      })}
    </aside>
  )
}
