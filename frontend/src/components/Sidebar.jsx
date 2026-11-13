import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Bot, 
  Radio, 
  CheckCircle2, 
  XCircle,
  Sparkles,
  Smartphone
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  agentStatus, 
  backendOnline,
  onOpenSimulator 
}) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'conversations', label: 'Conversations', icon: MessageSquare },
    { id: 'agent', label: 'Agent Settings', icon: Bot },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0 shadow-xl border-r border-slate-800 select-none">
      <div>
        {/* Brand / Logo */}
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight leading-tight text-white flex items-center gap-1.5">
              WhatsApp AI
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </h1>
            <p className="text-xs text-slate-400 font-medium">Agent Management</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="p-4 space-y-1.5">
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Main Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Simulator Launcher Button in Sidebar */}
        <div className="px-4 pt-2">
          <button
            onClick={onOpenSimulator}
            className="w-full py-2.5 px-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 border border-emerald-400/30 cursor-pointer group"
          >
            <Smartphone className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
            <span>Test Simulator</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/20 font-mono">LIVE</span>
          </button>
        </div>
      </div>

      {/* Footer Info & Connection Status */}
      <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/40">
        <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">AI Agent</span>
            {agentStatus?.is_active ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                Active
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5"></span>
                Disabled
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {agentStatus?.name || 'Customer Support'}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs px-1 text-slate-400">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-slate-400" />
            Backend
          </span>
          {backendOnline ? (
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Connected
            </span>
          ) : (
            <span className="text-amber-400 font-medium flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              Offline
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
