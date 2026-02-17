import { useState } from 'react'
import { useLocation, useNavigate, Outlet } from 'react-router-dom'
import { 
  DashboardLayout as CoreDashboardLayout, 
  Sidebar as CoreSidebar 
} from '@bree-ai/core/components'
import {
  LayoutDashboard,
  Briefcase,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react'
import Logo from './Logo'

export default function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const mainNav = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/jobs', icon: Briefcase, label: 'Jobs' },
    { href: '/dashboard/candidates', icon: Users, label: 'Candidates' },
    { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  ]

  const bottomNav = [
    { href: '/dashboard/settings', icon: ShieldCheck, label: 'Admin' },
    { href: '/dashboard/help', icon: HelpCircle, label: 'Help' },
  ]

  const sidebar = (
    <CoreSidebar
      isCollapsed={sidebarCollapsed}
      onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      logo={<Logo size="sm" />}
      mainNav={mainNav}
      bottomNav={bottomNav}
      activePath={location.pathname}
      onNavigate={(href) => navigate(href)}
      user={{
        name: 'John Recruiter',
        role: 'Acme Corp',
      }}
    />
  )

  return (
    <CoreDashboardLayout
      sidebar={sidebar}
      isSidebarCollapsed={sidebarCollapsed}
    >
      <Outlet />
    </CoreDashboardLayout>
  )
}
