import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const api = {
  // 1. Overview stats
  getStats: async () => {
    const response = await apiClient.get('/api/stats');
    return response.data;
  },

  // 2. Conversations
  getConversations: async () => {
    const response = await apiClient.get('/api/conversations');
    return response.data;
  },

  getConversationHistory: async (id) => {
    const response = await apiClient.get(`/api/conversations/${id}`);
    return response.data;
  },

  // 3. Agent settings (supports business_name, name, system_prompt, is_active)
  getAgent: async () => {
    const response = await apiClient.get('/api/agent');
    return response.data;
  },

  updateAgent: async (agentData) => {
    const response = await apiClient.put('/api/agent', agentData);
    return response.data;
  },

  // 4. WhatsApp Webhook Live Simulator (Full end-to-end pipeline + Meta Cloud API dispatch)
  simulateWhatsApp: async (phoneNumber, customerName, message) => {
    const response = await apiClient.post('/api/simulate-whatsapp', {
      phone_number: phoneNumber,
      customer_name: customerName,
      message: message,
    });
    return response.data;
  },

  // Health check
  checkHealth: async () => {
    const response = await apiClient.get('/');
    return response.data;
  }
};

export default api;
