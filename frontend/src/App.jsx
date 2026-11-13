import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import Conversations from './components/Conversations';
import AgentSettings from './components/AgentSettings';
import WhatsAppSimulatorModal from './components/WhatsAppSimulatorModal';
import { api } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // Fetch stats from backend
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const data = await api.getStats();
      setStats(data);
      setBackendOnline(true);
    } catch (err) {
      console.warn('Backend not reachable:', err.message);
      setBackendOnline(false);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Poll stats every 15 seconds
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAgentUpdated = (updatedAgent) => {
    setStats((prev) => (prev ? { ...prev, active_agent: updatedAgent } : prev));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans">
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        agentStatus={stats?.active_agent}
        backendOnline={backendOnline}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Offline Warning Banner */}
        {!backendOnline && (
          <div className="bg-amber-500 text-slate-900 px-4 py-2 text-xs font-semibold flex items-center justify-between shrink-0 shadow-sm">
            <span>
              ⚠️ Connecting to FastAPI backend at <code className="bg-amber-600/30 px-1 py-0.5 rounded">http://localhost:8000</code>... Ensure backend is running (<code className="bg-amber-600/30 px-1 py-0.5 rounded">uvicorn main:app --reload</code>).
            </span>
            <button
              onClick={fetchStats}
              className="underline hover:text-white transition-colors text-[11px] cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Tab Views */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <Overview
              stats={stats}
              loading={loadingStats}
              onRefresh={fetchStats}
              onNavigate={setActiveTab}
              onOpenSimulator={() => setIsSimulatorOpen(true)}
            />
          )}

          {activeTab === 'conversations' && (
            <div className="h-full">
              <Conversations 
                onOpenSimulator={() => setIsSimulatorOpen(true)} 
              />
            </div>
          )}

          {activeTab === 'agent' && (
            <AgentSettings onAgentUpdated={handleAgentUpdated} />
          )}
        </div>
      </main>

      {/* Global WhatsApp Live Test Simulator Modal */}
      <WhatsAppSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onMessageSent={fetchStats}
      />
    </div>
  );
}
