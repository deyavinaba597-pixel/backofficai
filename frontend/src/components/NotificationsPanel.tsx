import React, { useEffect, useState, useCallback } from 'react';
import { X, Bell, AlertTriangle, Info, Zap, CheckCircle } from 'lucide-react';
import { notificationsApi } from '../lib/api';
import { formatRelativeTime } from '../lib/utils';
import { cn } from '../lib/utils';

interface Alert {
  id: string;
  action: string;
  details: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  createdAt: string;
}

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
}

function getAlertType(action: string): 'INFO' | 'WARNING' | 'URGENT' {
  if (action.includes('URGENT')) return 'URGENT';
  if (action.includes('WARNING')) return 'WARNING';
  return 'INFO';
}

const typeConfig = {
  INFO: {
    icon: Info,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    label: 'Info',
  },
  WARNING: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    label: 'Warning',
  },
  URGENT: {
    icon: Zap,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Urgent',
  },
};

export function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await notificationsApi.getAlerts(50);
      setAlerts(response.data);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadAlerts();
    }
  }, [open, loadAlerts]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setReadIds((prev) => new Set([...prev, id]));
    } catch {
      // Silently fail
    }
  };

  const handleMarkAllRead = async () => {
    const unread = alerts.filter((a) => !readIds.has(a.id));
    await Promise.allSettled(unread.map((a) => notificationsApi.markRead(a.id)));
    setReadIds(new Set(alerts.map((a) => a.id)));
  };

  const unreadCount = alerts.filter((a) => !readIds.has(a.id)).length;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-96 bg-white shadow-2xl transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto h-[calc(100%-65px)]">
          {loading ? (
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="rounded-lg border p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 rounded bg-gray-200" />
                      <div className="h-4 w-full rounded bg-gray-200" />
                      <div className="h-3 w-16 rounded bg-gray-200" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mb-3">
                <Bell className="h-7 w-7 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-500">No notifications yet</p>
              <p className="text-xs text-gray-400 mt-1">Alerts from the AI agent will appear here</p>
            </div>
          ) : (
            <div className="divide-y">
              {alerts.map((alert) => {
                const type = getAlertType(alert.action);
                const config = typeConfig[type];
                const isRead = readIds.has(alert.id) || alert.status === 'PENDING';
                const Icon = config.icon;

                return (
                  <div
                    key={alert.id}
                    className={cn(
                      'p-4 transition-colors',
                      isRead ? 'bg-white' : 'bg-indigo-50/30'
                    )}
                  >
                    <div className="flex gap-3">
                      <div className={cn('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full', config.bg)}>
                        <Icon className={cn('h-4 w-4', config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={cn('text-xs font-semibold', config.color)}>{config.label}</span>
                          {!isRead && (
                            <button
                              onClick={() => handleMarkRead(alert.id)}
                              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                              title="Mark as read"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{alert.details}</p>
                        <p className="text-xs text-gray-400 mt-1.5">
                          {formatRelativeTime(new Date(alert.createdAt))}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function useNotificationCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await notificationsApi.getAlerts(50);
        const unread = response.data.filter((a: { status: string }) => a.status !== 'PENDING').length;
        setCount(unread);
      } catch {
        // Silently fail
      }
    };

    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  return count;
}
