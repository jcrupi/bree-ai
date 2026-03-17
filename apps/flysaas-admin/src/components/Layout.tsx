/**
 * Main Layout Component
 * Navigation, header, and page container
 */

import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  DollarSign,
  Sparkles,
  Settings,
  LogOut,
  Zap,
  Bot,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ObserverButton } from './ObserverButton';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    gradient: 'from-purple-500 to-pink-500',
    color: 'text-purple-600'
  },
  {
    name: 'Organizations',
    href: '/organizations',
    icon: Building2,
    gradient: 'from-blue-500 to-cyan-500',
    color: 'text-blue-600'
  },
  {
    name: 'Contacts',
    href: '/contacts',
    icon: Users,
    gradient: 'from-green-500 to-emerald-500',
    color: 'text-green-600'
  },
  {
    name: 'Deals',
    href: '/deals',
    icon: DollarSign,
    gradient: 'from-amber-500 to-orange-500',
    color: 'text-amber-600'
  },
  {
    name: 'AI Features',
    href: '/ai-features',
    icon: Sparkles,
    gradient: 'from-violet-500 to-purple-500',
    color: 'text-violet-600'
  },
  {
    name: 'Observer Admin',
    href: '/observer-admin',
    icon: Bot,
    gradient: 'from-indigo-500 to-violet-500',
    color: 'text-indigo-600'
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    gradient: 'from-slate-500 to-gray-500',
    color: 'text-slate-600'
  },
];

export function Layout() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-20 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-blue-600/10 animate-pulse" />

        {/* Logo */}
        <div className="relative h-20 flex items-center justify-center border-b border-white/10">
          <div className="group cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
              <Zap className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="relative p-3 space-y-2 mt-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.href}
                className="group relative block"
                title={item.name}
              >
                <div className={`
                  relative w-14 h-14 rounded-xl flex items-center justify-center
                  transition-all duration-300 ease-out
                  ${isActive
                    ? `bg-gradient-to-br ${item.gradient} shadow-lg scale-105`
                    : 'bg-white/5 hover:bg-white/10 hover:scale-105'
                  }
                `}>
                  <Icon
                    className={`
                      w-6 h-6 transition-all duration-300
                      ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}
                    `}
                    strokeWidth={2}
                  />

                  {/* Tooltip on hover */}
                  <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap shadow-xl z-50">
                    {item.name}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-white/0 via-white to-white/0 rounded-full" />
                  )}

                  {/* Glow effect for active */}
                  {isActive && (
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${item.gradient} opacity-50 blur-xl`} />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Observer AI */}
        <div className="absolute bottom-20 left-0 right-0 p-3 border-t border-white/10">
          <ObserverButton position="sidebar" />
        </div>

        {/* User menu */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10">
          <div className="group relative">
            <button
              onClick={signOut}
              className="w-14 h-14 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all duration-300 hover:scale-105"
              title="Sign out"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center ring-2 ring-white/20">
                  <span className="text-sm font-bold text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                  <LogOut className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                </div>
              </div>

              {/* Tooltip */}
              <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap shadow-xl z-50">
                Sign out ({user?.email})
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-20">
        {/* Header */}
        <div className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 flex items-center px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            {navigation.map((item) => {
              if (location.pathname === item.href) {
                return (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg`}>
                      <item.icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-slate-900">{item.name}</h1>
                      <p className="text-xs text-slate-500">FatCRM • FlySaaS Platform</p>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>

        {/* Page content */}
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
