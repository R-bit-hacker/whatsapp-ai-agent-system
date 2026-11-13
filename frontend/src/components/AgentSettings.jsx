import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Save, 
  Check, 
  AlertCircle, 
  Sparkles, 
  RefreshCw,
  Sliders,
  ShieldCheck,
  Store,
  Layers
} from 'lucide-react';
import { api } from '../api';

export default function AgentSettings({ onAgentUpdated }) {
  const [businessName, setBusinessName] = useState('');
  const [name, setName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch current settings
  const loadSettings = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const data = await api.getAgent();
      if (data) {
        setBusinessName(data.business_name || 'WhatsApp AI Tech Store');
        setName(data.name || '');
        setSystemPrompt(data.system_prompt || '');
        setIsActive(data.is_active ?? true);
      }
    } catch (err) {
      console.error('Failed to load agent settings:', err);
      setErrorMessage('Could not load agent settings from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Handle Save
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessMessage('');
      setErrorMessage('');

      const updated = await api.updateAgent({
        business_name: businessName.trim(),
        name: name.trim(),
        system_prompt: systemPrompt.trim(),
        is_active: isActive,
      });

      setSuccessMessage('Agent & business settings updated successfully!');
      if (onAgentUpdated) {
        onAgentUpdated(updated);
      }

      setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
    } catch (err) {
      console.error('Failed to update agent:', err);
      setErrorMessage(
        err.response?.data?.detail || 'Failed to update agent settings. Please verify backend is running.'
      );
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = (templatePrompt) => {
    setSystemPrompt(templatePrompt);
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded"></div>
        <div className="h-96 bg-white rounded-xl shadow-sm border border-slate-200 animate-pulse p-6"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-emerald-600" />
            Agent & Business Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Configure your AI agent persona, business name, active state, and tool execution instructions.
          </p>
        </div>

        <button
          onClick={loadSettings}
          disabled={loading || saving}
          title="Reload configuration"
          className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-800 text-sm shadow-sm animate-fadeIn">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3 text-rose-800 text-sm shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        {/* 1. Toggle Switch: Enable/Disable Agent */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <div>
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bot className="w-4 h-4 text-emerald-600" />
              AI Agent Active Toggle
            </label>
            <p className="text-xs text-slate-500 mt-1">
              When enabled, incoming customer WhatsApp messages will be processed and answered by the AI agent.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
            <span className="ml-3 text-xs font-semibold text-slate-700 min-w-[60px]">
              {isActive ? (
                <span className="text-emerald-600">Active</span>
              ) : (
                <span className="text-slate-400">Disabled</span>
              )}
            </span>
          </label>
        </div>

        {/* 2. Business Name & Agent Name Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              Business Name
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. WhatsApp AI Tech Store"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all placeholder:text-slate-400 font-medium"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              The company name associated with this WhatsApp account.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-emerald-600" />
              Agent Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AI Customer Support Assistant"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all placeholder:text-slate-400 font-medium"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Display persona name shown in dashboard transcripts.
            </p>
          </div>
        </div>

        {/* 3. System Prompt Textarea */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              System Prompt & Instructions (Context)
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              {systemPrompt.length} characters
            </span>
          </div>

          <textarea
            required
            rows={8}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="You are a helpful customer support agent for our company..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-xs md:text-sm text-slate-900 font-mono leading-relaxed focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all placeholder:text-slate-400"
          ></textarea>

          {/* Quick Prompt Templates */}
          <div className="mt-3">
            <p className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              Quick Templates:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  applyTemplate(
                    "You are a friendly, professional AI customer support and sales agent for our electronics & gadgets store. Help customers with product recommendations, pricing, stock availability, and order status tracking.\n\nCRITICAL TOOL CALLING RULES:\n1. When customers ask about products, pricing, specs, or what items are in stock, ALWAYS invoke the 'get_products_info' tool.\n2. When customers ask for their order status or provide an order ID (e.g., #9999, 12345, ORD-9988), ALWAYS invoke the 'check_order_status' tool.\n3. Respond warmly, politely, and format prices clearly with dollar signs ($)."
                  )
                }
                className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 transition-colors cursor-pointer"
              >
                Full Tech Store & Order Support
              </button>
              <button
                type="button"
                onClick={() =>
                  applyTemplate(
                    "You are an e-commerce assistant. Answer customer inquiries about product availability, prices, and orders. Call 'get_products_info' for catalog lookups and 'check_order_status' when customers mention order numbers."
                  )
                }
                className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 transition-colors cursor-pointer"
              >
                Concise Catalog Assistant
              </button>
            </div>
          </div>
        </div>

        {/* Function Calling Info Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Registered LLM Tools:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <code className="text-emerald-700 font-bold block mb-0.5">get_products_info(query: str)</code>
              <p className="text-[11px] text-slate-500">Searches live inventory, prices, availability, and specs.</p>
            </div>
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <code className="text-emerald-700 font-bold block mb-0.5">check_order_status(order_id: str)</code>
              <p className="text-[11px] text-slate-500">Retrieves real-time order tracking and fulfillment status.</p>
            </div>
          </div>
        </div>

        {/* 4. Save Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-md shadow-emerald-500/20 hover:shadow-lg transition-all disabled:opacity-50 gap-2 cursor-pointer"
          >
            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
