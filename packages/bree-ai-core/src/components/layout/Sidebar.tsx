import React from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  LogOut 
} from 'lucide-react';
import { Avatar } from '../ui';

export interface NavItem {
  href: string;
  icon: any;
  label: string;
}

export interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  logo: React.ReactNode;
  mainNav: NavItem[];
  bottomNav?: NavItem[];
  user?: {
    name: string;
    role?: string;
    avatar?: string;
  };
  activePath?: string;
  onNavigate: (href: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggle,
  logo,
  mainNav,
  bottomNav = [],
  user,
  activePath,
  onNavigate,
}) => {
  const NavLink = ({ href, icon: Icon, label }: NavItem) => {
    const isActive = activePath === href;
    
    return (
      <button
        onClick={() => onNavigate(href)}
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
          ${isActive
            ? 'bg-brand-orange text-white'
            : 'text-dark-400 hover:text-dark-100 hover:bg-dark-800'
          }
          ${isCollapsed ? 'justify-center' : ''}
        `}
        title={isCollapsed ? label : undefined}
      >
        <Icon size={20} />
        {!isCollapsed && <span className="text-sm font-medium">{label}</span>}
      </button>
    );
  };

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
        {!isCollapsed && <div className="flex-1">{logo}</div>}
        <button
          onClick={onToggle}
          className="p-1.5 text-dark-400 hover:text-dark-200 rounded-lg hover:bg-dark-800 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {mainNav.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>

      {/* Bottom Navigation */}
      {bottomNav.length > 0 && (
        <div className="p-3 space-y-1 border-t border-dark-700">
          {bottomNav.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </div>
      )}

      {/* User Profile */}
      {user && (
        <div className="p-3 border-t border-dark-700">
          <div
            className={`
              flex items-center gap-3 p-2 rounded-lg hover:bg-dark-800 transition-colors cursor-pointer
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            <Avatar name={user.name} size="sm" />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark-100 truncate">{user.name}</p>
                {user.role && <p className="text-xs text-dark-400 truncate">{user.role}</p>}
              </div>
            )}
            {!isCollapsed && (
              <button className="p-1 text-dark-400 hover:text-dark-200">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
