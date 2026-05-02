import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Users,
  Building2,
  Shield,
  Bot,
  LogOut,
  Zap,
  BarChart2,
  ClipboardList,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { cn, getInitials } from '../lib/utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/invoices', icon: FileText, label: 'Invoices' },
  { to: '/expenses', icon: Receipt, label: 'Expenses' },
  { to: '/payroll', icon: Users, label: 'Payroll' },
  { to: '/vendors', icon: Building2, label: 'Vendors' },
  { to: '/policies', icon: Shield, label: 'Policies' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/audit', icon: ClipboardList, label: 'Audit Log' },
  { to: '/agent', icon: Bot, label: 'AI Agent' },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="flex h-full w-64 flex-col bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white">BackOfficeAI</h1>
          <p className="text-xs text-gray-400">Agentic ERP</p>
        </div>
      </div>

      {/* Company name */}
      {user?.companyName && (
        <div className="px-6 py-3 border-b border-gray-800">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Company</p>
          <p className="text-sm font-medium text-gray-200 mt-0.5 truncate">{user.companyName}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
            {label === 'AI Agent' && (
              <span className="ml-auto flex h-2 w-2 rounded-full bg-green-400" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
            {user ? getInitials(user.name) : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
