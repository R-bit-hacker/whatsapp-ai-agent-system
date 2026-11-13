import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Send, 
  RefreshCw, 
  MessageSquare, 
  User, 
  Bot, 
  Sparkles,
  CheckCheck,
  Smartphone,
  Package,
  ShoppingBag
} from 'lucide-react';
import { api } from '../api';

export default function Conversations({ onOpenSimulator }) {
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Test Message Simulator State
  const [simulateText, setSimulateText] = useState('');
  const [simulating, setSimulating] = useState(false);

  const messagesEndRef = useRef(null);

  // Load conversation list
  const loadConversations = async (autoSelectFirst = false) => {
    try {
      setLoadingList(true);
      const data = await api.getConversations();
      setConversations(data);
      if (autoSelectFirst && data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingList(false);
    }
  };

  // Load chat history for selected conversation
  const loadHistory = async (id) => {
    if (!id) return;
    try {
      setLoadingHistory(true);
      const data = await api.getConversationHistory(id);
      setActiveConversation(data);
    } catch (err) {
      console.error('Failed to load conversation history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadConversations(true);
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadHistory(selectedId);
    }
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  // Handle simulating a customer WhatsApp message via POST /api/simulate-whatsapp
  const handleSimulateSend = async (e) => {
    e?.preventDefault();
    if (!simulateText.trim() || !activeConversation) return;

    try {
      setSimulating(true);
      const customerPhone = activeConversation.customer_phone;
      const customerName = activeConversation.customer_name || 'Customer';
      
      await api.simulateWhatsApp(customerPhone, customerName, simulateText.trim());
      setSimulateText('');
      
      // Refresh current conversation history and conversation list
      await loadHistory(selectedId);
      await loadConversations(false);
    } catch (err) {
      console.error('Failed to send simulated message:', err);
      alert('Error simulating message: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSimulating(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    const phone = c.customer_phone?.toLowerCase() || '';
    const name = c.customer_name?.toLowerCase() || '';
    return phone.includes(q) || name.includes(q);
  });

  return (
    <div className="flex h-full bg-white overflow-hidden">
      {/* ----------------------------------------------- */}
      {/* LEFT SIDEBAR: Conversation List                 */}
      {/* ----------------------------------------------- */}
      <div className="w-80 md:w-96 border-r border-slate-200 flex flex-col bg-slate-50 shrink-0">
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              Conversations
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenSimulator}
                title="Launch Simulator Modal"
                className="p-1.5 text-emerald-600 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                onClick={() => loadConversations(false)}
                disabled={loadingList}
                title="Refresh conversation list"
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loadingList ? 'animate-spin text-emerald-600' : ''}`} />
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search phone or customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 border border-transparent rounded-lg focus:bg-white focus:border-emerald-500 focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {loadingList && conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">Loading chats...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">No conversations found</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Click "Launch Simulator" above to generate a test WhatsApp conversation!
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedId === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`w-full text-left p-3.5 transition-colors flex items-start space-x-3 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/80 border-l-4 border-emerald-500'
                      : 'hover:bg-slate-100/70 bg-white'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-semibold text-xs ${
                    isSelected ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {conv.customer_name ? conv.customer_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {conv.customer_phone}
                      </p>
                      <span className="text-[10px] text-slate-400 ml-2 whitespace-nowrap">
                        {formatTime(conv.last_message_at)}
                      </span>
                    </div>

                    {conv.customer_name && (
                      <p className="text-[11px] text-slate-500 truncate font-medium">{conv.customer_name}</p>
                    )}

                    <p className="text-xs text-slate-500 truncate mt-0.5 font-normal">
                      {conv.last_message || <span className="italic text-slate-400">No messages yet</span>}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ----------------------------------------------- */}
      {/* MAIN AREA: WhatsApp Chat View                   */}
      {/* ----------------------------------------------- */}
      <div className="flex-1 flex flex-col h-full bg-[#efeae2] whatsapp-chat-bg">
        {selectedId && activeConversation ? (
          <>
            {/* Chat Top Bar */}
            <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {activeConversation.customer_name
                    ? activeConversation.customer_name.charAt(0).toUpperCase()
                    : <User className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    {activeConversation.customer_phone}
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      {activeConversation.status || 'Active'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeConversation.customer_name || 'Customer'} • Last active {formatTime(activeConversation.last_message_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={onOpenSimulator}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Simulator
                </button>
                <button
                  onClick={() => loadHistory(selectedId)}
                  disabled={loadingHistory}
                  title="Refresh chat messages"
                  className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin text-emerald-600' : ''}`} />
                </button>
              </div>
            </div>

            {/* Chat Messages List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingHistory && !activeConversation?.messages ? (
                <div className="text-center text-xs text-slate-500 py-10">Loading chat history...</div>
              ) : activeConversation.messages?.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-white text-slate-400 mx-auto flex items-center justify-center shadow-sm mb-2">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">No messages in this conversation yet</p>
                  <p className="text-[11px] text-slate-500 mt-1">Send a simulated message below to test the AI.</p>
                </div>
              ) : (
                activeConversation.messages.map((msg) => {
                  const isCustomer = msg.sender === 'user';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                    >
                      {/* Sender label */}
                      <span className="text-[10px] font-medium text-slate-500 mb-1 px-1 flex items-center gap-1">
                        {isCustomer ? (
                          <>
                            <User className="w-3 h-3 text-slate-400" />
                            Customer ({activeConversation.customer_name || activeConversation.customer_phone})
                          </>
                        ) : (
                          <>
                            <Bot className="w-3 h-3 text-emerald-600" />
                            AI Support Agent
                          </>
                        )}
                      </span>

                      {/* WhatsApp Chat Bubbles: Green for customer, Grey for AI */}
                      <div
                        className={`max-w-md md:max-w-lg lg:max-w-xl rounded-2xl px-4 py-2.5 shadow-sm relative text-sm leading-relaxed ${
                          isCustomer
                            ? 'bg-[#dcf8c6] text-slate-900 rounded-tr-none border border-emerald-200/50'
                            : 'bg-white text-slate-900 rounded-tl-none border border-slate-200'
                        }`}
                      >
                        <p className="whitespace-pre-wrap select-text">{msg.content}</p>

                        <div className="flex items-center justify-end space-x-1 mt-1 text-[10px] text-slate-400">
                          <span>{formatTime(msg.created_at)}</span>
                          {isCustomer && (
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Test Simulation Input Bar */}
            <div className="bg-white border-t border-slate-200 p-3 shrink-0 shadow-lg space-y-2">
              {/* Quick shortcut pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                <span className="text-slate-400 shrink-0 font-medium">Quick Prompts:</span>
                <button
                  type="button"
                  onClick={() => setSimulateText('What products do you have in stock and their prices?')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-full border border-slate-200 shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ShoppingBag className="w-3 h-3 text-emerald-600" />
                  Product Catalog
                </button>
                <button
                  type="button"
                  onClick={() => setSimulateText('Check status of my order #9999')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-full border border-slate-200 shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Package className="w-3 h-3 text-emerald-600" />
                  Order #9999
                </button>
                <button
                  type="button"
                  onClick={() => setSimulateText('Where is my order ORD-9988?')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-full border border-slate-200 shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Package className="w-3 h-3 text-emerald-600" />
                  Order ORD-9988
                </button>
              </div>

              <form onSubmit={handleSimulateSend} className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={simulateText}
                    onChange={(e) => setSimulateText(e.target.value)}
                    placeholder={`Type customer message as ${activeConversation.customer_phone}...`}
                    disabled={simulating}
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all disabled:opacity-50"
                  />
                  <Sparkles className="w-4 h-4 text-emerald-500 absolute right-3 top-3 pointer-events-none" />
                </div>
                <button
                  type="submit"
                  disabled={simulating || !simulateText.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Send className={`w-4 h-4 ${simulating ? 'animate-pulse' : ''}`} />
                  {simulating ? 'Processing...' : 'Send'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300 mb-4 border border-slate-200">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-700">No Conversation Selected</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Select a conversation from the left sidebar or launch the WhatsApp Simulator to test live customer chats.
            </p>
            <button
              onClick={onOpenSimulator}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              Launch WhatsApp Simulator
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
