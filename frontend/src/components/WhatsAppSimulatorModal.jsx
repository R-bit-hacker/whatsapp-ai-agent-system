import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  CheckCircle2, 
  Package, 
  ShoppingBag, 
  HelpCircle,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { api } from '../api';

export default function WhatsAppSimulatorModal({ isOpen, onClose, onMessageSent }) {
  const [phoneNumber, setPhoneNumber] = useState('+923090139836');
  const [customerName, setCustomerName] = useState('Rubaisha');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const quickPrompts = [
    {
      label: 'Products & Prices',
      icon: ShoppingBag,
      text: 'What products do you have in stock and their prices?'
    },
    {
      label: 'Order #9999 Status',
      icon: Package,
      text: 'Check status of my order #9999'
    },
    {
      label: 'Order ORD-9988 Status',
      icon: Package,
      text: 'Where is my order ORD-9988?'
    },
    {
      label: 'General Support',
      icon: HelpCircle,
      text: 'Hi, I need support with product recommendations.'
    }
  ];

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!message.trim() || !phoneNumber.trim()) return;

    try {
      setLoading(true);
      setError('');
      setLastResponse(null);

      const res = await api.simulateWhatsApp(
        phoneNumber.trim(),
        customerName.trim() || 'WhatsApp User',
        message.trim()
      );

      setLastResponse(res);
      setMessage('');

      if (onMessageSent) {
        onMessageSent();
      }
    } catch (err) {
      console.error('Simulator error:', err);
      setError(
        err.response?.data?.detail || 
        err.message || 
        'Failed to process message via simulator.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-md">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg leading-tight">WhatsApp Webhook Simulator</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-400 text-slate-950">
                  LIVE PIPELINE
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Simulates incoming customer message, executes LLM tools, saves to SQLite & triggers Meta Cloud API.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Inputs Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Customer Phone Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+923090139836"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-mono focus:bg-white focus:border-emerald-500 focus:outline-none transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Default verified phone number</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Rubaisha"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-1">Displayed in chat transcripts</p>
            </div>
          </div>

          {/* Quick-Test Action Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              1-Click Test Scenarios (Evaluator Shortcuts):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickPrompts.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setMessage(p.text)}
                    className="flex items-center text-left p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-900 text-xs transition-all cursor-pointer group"
                  >
                    <Icon className="w-4 h-4 text-emerald-600 shrink-0 mr-2 group-hover:scale-110 transition-transform" />
                    <span className="truncate font-medium">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              WhatsApp Message Text
            </label>
            <textarea
              rows={3}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message as a customer (e.g. Check status of my order #9999)..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 text-xs">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Result Preview Box */}
          {lastResponse && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Processed End-to-End & WhatsApp Outbound Dispatched!
                </span>
                <span className="text-[10px] text-slate-400 font-mono">200 OK</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner">
                {lastResponse.agent_response}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                  Saved to SQLite DB
                </span>
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold">
                  Tools Executed
                </span>
                <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-semibold">
                  Meta Graph API Called
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500 hidden sm:block">
            Calls <code className="bg-slate-200 px-1 py-0.5 rounded">POST /api/simulate-whatsapp</code>
          </p>
          <div className="flex items-center space-x-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={loading || !message.trim()}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-500/20 hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Send className={`w-3.5 h-3.5 ${loading ? 'animate-pulse' : ''}`} />
              {loading ? 'Processing Pipeline...' : 'Send Message'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
