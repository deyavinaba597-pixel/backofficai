import React, { useEffect, useState, useCallback } from 'react';
import { Bot, Activity, Plus, Trash2, MessageSquare, Pencil } from 'lucide-react';
import { AgentChat } from '../components/AgentChat';
import { AgentActivityFeed } from '../components/AgentActivityFeed';
import { agentApi } from '../lib/api';
import { formatRelativeTime } from '../lib/utils';

interface AgentLog {
  id: string;
  action: string;
  details: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
  messages?: Array<{ id: string; role: string; content: string; createdAt: string }>;
}

const SUGGESTED_PROMPTS = [
  "What's my current cash position?",
  "Are there any overdue invoices?",
  "Show me pending expenses that need approval",
  "Run payroll for all active employees",
  "What's my monthly expense breakdown?",
  "Create a new vendor called Acme Corp",
];

export function AgentLogs() {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState('');

  const loadLogs = useCallback(async () => {
    try {
      const response = await agentApi.getLogs(20);
      setLogs(response.data);
    } catch {
      // Silently fail
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const response = await agentApi.listConversations();
      setConversations(response.data);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    loadLogs();
    loadConversations();
    const interval = setInterval(loadLogs, 30000);
    return () => clearInterval(interval);
  }, [loadLogs, loadConversations]);

  const handleNewConversation = async () => {
    try {
      const response = await agentApi.createConversation();
      const newConv = response.data;
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
    } catch {
      // Silently fail
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    try {
      await agentApi.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) setActiveConversationId(null);
    } catch {
      // Silently fail
    }
  };

  const handleRenameConversation = async (id: string) => {
    if (!titleInput.trim()) return;
    try {
      await agentApi.updateConversation(id, titleInput.trim());
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: titleInput.trim() } : c))
      );
      setEditingTitle(null);
    } catch {
      // Silently fail
    }
  };

  const handleConversationMessage = () => {
    // Refresh conversations list after a message is sent
    loadConversations();
    loadLogs();
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Conversation sidebar */}
      <div className="w-64 flex flex-col rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-sm font-semibold text-gray-900">Conversations</h3>
          <button
            onClick={handleNewConversation}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            title="New conversation"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <MessageSquare className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-xs text-gray-400">No conversations yet</p>
              <button
                onClick={handleNewConversation}
                className="mt-2 text-xs text-indigo-600 hover:text-indigo-700"
              >
                Start one
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`group flex items-start gap-2 px-3 py-3 cursor-pointer transition-colors ${
                    activeConversationId === conv.id
                      ? 'bg-indigo-50 border-l-2 border-indigo-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    {editingTitle === conv.id ? (
                      <input
                        autoFocus
                        value={titleInput}
                        onChange={(e) => setTitleInput(e.target.value)}
                        onBlur={() => handleRenameConversation(conv.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameConversation(conv.id);
                          if (e.key === 'Escape') setEditingTitle(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-xs border rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    ) : (
                      <p className="text-xs font-medium text-gray-900 truncate">{conv.title}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatRelativeTime(new Date(conv.updatedAt))}
                      {conv._count && conv._count.messages > 0 && (
                        <span className="ml-1">· {conv._count.messages} msgs</span>
                      )}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTitle(conv.id);
                        setTitleInput(conv.title);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat panel */}
      <div className="flex-1 flex flex-col rounded-xl border bg-white shadow-sm overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">BackOfficeAI Agent</h3>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-gray-500">Online · Ready to help</span>
            </div>
          </div>
          {!activeConversationId && (
            <button
              onClick={handleNewConversation}
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-3 w-3" />
              New Chat
            </button>
          )}
        </div>

        {/* Chat component */}
        <div className="flex-1 overflow-hidden">
          <AgentChat
            suggestedPrompts={SUGGESTED_PROMPTS}
            conversationId={activeConversationId || undefined}
            onMessageSent={handleConversationMessage}
          />
        </div>
      </div>

      {/* Activity sidebar */}
      <div className="w-72 flex flex-col rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b">
          <Activity className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-semibold text-gray-900">Agent Activity</h3>
          <span className="ml-auto text-xs text-gray-400">{logs.length} actions</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <AgentActivityFeed logs={logs} loading={logsLoading} maxItems={20} />
        </div>

        {/* Agent capabilities */}
        <div className="border-t p-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Capabilities</p>
          <div className="flex flex-wrap gap-1.5">
            {['Invoices', 'Expenses', 'Payroll', 'Vendors', 'Policies', 'Analytics', 'Alerts', 'Audit'].map((cap) => (
              <span key={cap} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600">
                {cap}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
