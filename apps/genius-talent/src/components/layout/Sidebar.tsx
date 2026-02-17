import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Briefcase,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Logo from './Logo'
import { Avatar } from '@bree-ai/core/components'

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const location = useLocation()

  const mainNav = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/jobs', icon: Briefcase, label: 'Jobs' },
    { href: '/dashboard/candidates', icon: Users, label: 'Candidates' },
    { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  ]

  const bottomNav = [
    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
    { href: '/dashboard/help', icon: HelpCircle, label: 'Help' },
  ]

  const isActive = (path: string) => location.pathname === path

  const NavLink = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => (
    <Link
      to={href}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
        ${isActive(href)
          ? 'bg-brand-orange text-white'
          : 'text-dark-400 hover:text-dark-100 hover:bg-dark-800'
        }
        ${isCollapsed ? 'justify-center' : ''}
      `}
      title={isCollapsed ? label : undefined}
    >
      <Icon size={20} />
      {!isCollapsed && <span className="text-sm font-medium">{label}</span>}
    </Link>
  )

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen bg-dark-900 border-r border-dark-700
        flex flex-col transition-all duration-300 z-40
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-dark-700">
        {!isCollapsed && <Logo size="sm" />}
        <button
          onClick={onToggle}
          className="p-1.5 text-dark-400 hover:text-dark-200 rounded-lg hover:bg-dark-800 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {mainNav.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-3 space-y-1 border-t border-dark-700">
        {bottomNav.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </div>

      {/* User Profile */}
      <div className="p-3 border-t border-dark-700">
        <div
          className={`
            flex items-center gap-3 p-2 rounded-lg hover:bg-dark-800 transition-colors cursor-pointer
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          <Avatar name="John Recruiter" size="sm" />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-100 truncate">John Recruiter</p>
              <p className="text-xs text-dark-400 truncate">Acme Corp</p>
            </div>
          )}
          {!isCollapsed && (
            <button className="p-1 text-dark-400 hover:text-dark-200">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
