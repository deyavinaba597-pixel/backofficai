import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, User } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAuthStore } from '../store/authStore';
import { getInitials } from '../lib/utils';
import { NotificationsPanel, useNotificationCount } from './NotificationsPanel';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/invoices': 'Invoices',
  '/expenses': 'Expenses',
  '/payroll': 'Payroll',
  '/vendors': 'Vendors',
  '/policies': 'Policies',
  '/agent': 'AI Agent',
  '/analytics': 'Analytics',
  '/audit': 'Audit Log',
};

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationCount = useNotificationCount();

  const pageTitle = pageTitles[location.pathname] || 'BackOfficeAI';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b bg-white px-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{pageTitle}</h2>
          <p className="text-xs text-gray-400">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <button
            onClick={() => setNotificationsOpen(true)}
            className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {/* User dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                  {user ? getInitials(user.name) : 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-400">{user?.role}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[180px] rounded-lg border bg-white p-1 shadow-lg"
                align="end"
                sideOffset={4}
              >
                <div className="px-3 py-2 border-b mb-1">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>

                <DropdownMenu.Item
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer outline-none"
                  onClick={() => navigate('/dashboard')}
                >
                  <User className="h-4 w-4" />
                  Profile
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />

                <DropdownMenu.Item
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer outline-none"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </header>

      <NotificationsPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </>
  );
}
