import React from 'react';
import { 
  MessageSquare, 
  Users, 
  MessagesSquare, 
  Bot, 
  ArrowUpRight, 
  Sparkles, 
  RefreshCw,
  CheckCircle,
  Smartphone,
  Store
} from 'lucide-react';

export default function Overview({ stats, loading, onRefresh, onNavigate, onOpenSimulator }) {
  if (loading && !stats) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-xl shadow-sm border border-slate-200 animate-pulse p-6"></div>
          ))}
        </div>
      </div>
    );
  }

  const agent = stats?.active_agent;
  const isAgentActive = agent?.is_active ?? false;
  const businessName = agent?.business_name || 'WhatsApp AI Tech Store';

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Overview</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <Store className="w-3 h-3 mr-1 text-emerald-600" />
              {businessName}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time analytics and management for your WhatsApp AI Support Assistant.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={onOpenSimulator}
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all gap-2 cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-emerald-200" />
            WhatsApp Simulator
          </button>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-colors disabled:opacity-50 gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
            {loading ? 'Refreshing...' : 'Refresh Stats'}
          </button>
        </div>
      </div>

      {/* 4 Required Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Conversations */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Conversations
            </span>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessagesSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats?.total_conversations?.toLocaleString() ?? 0}
            </span>
            <p className="text-xs text-slate-500 mt-1">Active WhatsApp threads</p>
          </div>
          <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
        </div>

        {/* Card 2: Total Customers */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Customers
            </span>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats?.total_customers?.toLocaleString() ?? 0}
            </span>
            <p className="text-xs text-slate-500 mt-1">Unique customer phone numbers</p>
          </div>
          <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
        </div>

        {/* Card 3: Total Messages */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Messages
            </span>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats?.total_messages?.toLocaleString() ?? 0}
            </span>
            <p className="text-xs text-slate-500 mt-1">Inbound & AI agent responses</p>
          </div>
          <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 to-indigo-600"></div>
        </div>

        {/* Card 4: AI Agent Status (Badge) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              AI Agent Status
            </span>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${
              isAgentActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              <Bot className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            {isAgentActive ? (
              <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-ping"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 -ml-4"></span>
                ACTIVE & RESPONDING
              </div>
            ) : (
              <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-500 mr-2"></span>
                INACTIVE (PAUSED)
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2 truncate">
              Agent: <span className="font-semibold text-slate-700">{agent?.name || 'Customer Support'}</span>
            </p>
          </div>
          <div className={`absolute -bottom-1 left-0 right-0 h-1 ${
            isAgentActive ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-rose-400 to-rose-600'
          }`}></div>
        </div>
      </div>

      {/* Profile & Prompt Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                AI
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-base">{agent?.name || 'Customer Support Assistant'}</h3>
                <p className="text-xs text-slate-500">
                  LLM Engine: Groq Llama-3.3-70b-versatile / OpenAI gpt-4o-mini
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('agent')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline cursor-pointer"
            >
              Configure Agent
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Active System Prompt & Instructions
            </label>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-700 font-mono leading-relaxed line-clamp-4">
              {agent?.system_prompt || 'No system prompt configured.'}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100">
            <div className="flex items-start gap-2 text-xs text-slate-600">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>Tool 1 (Catalog):</strong> <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700">get_products_info(query)</code>
              </span>
            </div>
            <div className="flex items-start gap-2 text-xs text-slate-600">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>Tool 2 (Orders):</strong> <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700">check_order_status(order_id)</code>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Shortcuts */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 shadow-sm text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              Interview Evaluation Tools
            </div>
            <h3 className="text-lg font-bold mt-2">Test Live WhatsApp Pipeline</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Use our built-in simulator to test incoming WhatsApp messages, tool execution, and outbound Meta Cloud API dispatch.
            </p>
          </div>

          <div className="mt-6 space-y-2.5">
            <button
              onClick={onOpenSimulator}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              Launch WhatsApp Simulator
            </button>
            <button
              onClick={() => onNavigate('conversations')}
              className="w-full py-2.5 px-4 bg-slate-700/80 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-slate-600 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              Open Live Conversations View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
