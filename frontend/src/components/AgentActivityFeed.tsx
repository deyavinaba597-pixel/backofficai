import React from 'react';
import { CheckCircle, XCircle, Clock, Bot, Zap, AlertTriangle } from 'lucide-react';
import { formatRelativeTime } from '../lib/utils';
import { cn } from '../lib/utils';

interface AgentLog {
  id: string;
  action: string;
  details: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  createdAt: string;
}

interface AgentActivityFeedProps {
  logs: AgentLog[];
  loading?: boolean;
  maxItems?: number;
}

function getActionIcon(action: string) {
  if (action.includes('Payroll')) return Zap;
  if (action.includes('ALERT')) return AlertTriangle;
  if (action.includes('Tool')) return Bot;
  return Bot;
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'SUCCESS':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'FAILED':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'PENDING':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    default:
      return <CheckCircle className="h-4 w-4 text-gray-400" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'SUCCESS':
      return 'bg-green-50 border-green-100';
    case 'FAILED':
      return 'bg-red-50 border-red-100';
    case 'PENDING':
      return 'bg-yellow-50 border-yellow-100';
    default:
      return 'bg-gray-50 border-gray-100';
  }
}

export function AgentActivityFeed({ logs, loading = false, maxItems = 10 }: AgentActivityFeedProps) {
  const displayLogs = logs.slice(0, maxItems);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (displayLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Bot className="h-10 w-10 text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">No agent activity yet</p>
        <p className="text-xs text-gray-400 mt-1">The AI agent will log its actions here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {displayLogs.map((log, index) => {
        const ActionIcon = getActionIcon(log.action);
        return (
          <div
            key={log.id}
            className={cn(
              'flex gap-3 rounded-lg border p-3 transition-all',
              getStatusColor(log.status),
              'animate-fade-in'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex-shrink-0 mt-0.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm">
                <ActionIcon className="h-3.5 w-3.5 text-indigo-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-gray-700 truncate">{log.action}</p>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {getStatusIcon(log.status)}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{log.details}</p>
              <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(log.createdAt)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
