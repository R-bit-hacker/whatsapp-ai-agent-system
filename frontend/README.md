# WhatsApp AI Agent Management Dashboard (Frontend)

Modern, production-ready React management dashboard for the WhatsApp AI Agent backend, built with **React**, **Tailwind CSS**, and **Axios**.

---

## 🌟 Key Features

1. **Overview Dashboard**:
   - Live metrics fetched from `/api/stats`:
     - **Total Conversations**
     - **Total Customers**
     - **Total Messages**
     - **AI Agent Status** (Active / Inactive badge with real-time indicator)
   - Agent profile summary & active system prompt preview.
   - Quick navigation shortcuts.

2. **Conversations (Chat View)**:
   - **Left Sidebar**:
     - Lists all active WhatsApp conversations fetched from `/api/conversations`.
     - Displays customer phone number, name, last message preview, and formatted timestamp.
     - Search filter to quickly locate customers by phone or name.
   - **Main Area**:
     - Fetches complete chronological message history from `/api/conversations/{id}`.
     - **WhatsApp-style chat bubbles**:
       - 🟢 **Green** (`#DCF8C6`) for customer messages (`sender="user"`).
       - ⚪ **Grey** (`bg-white` / `bg-slate-200`) for AI assistant responses (`sender="agent"`).
     - Auto-scrolls to the latest message.
     - **Interactive Message Simulator**: Test sending customer inquiries (e.g. asking for order status) directly from the dashboard and observe the AI's real-time reply!

3. **Agent Settings**:
   - Fetches and updates agent configuration via `/api/agent`.
   - **Toggle Switch**: Enable or Disable the AI Agent in real-time (`is_active`).
   - **Agent Name**: Text input for the assistant's persona.
   - **System Prompt**: Large text area with character counter and 1-click industry prompt templates (E-Commerce, Receptionist, Sales & Tracking).
   - **Save Changes Button**: Saves updates via `PUT /api/agent` with instant feedback and toast alerts.

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The frontend will run on `http://localhost:3000` (or `http://localhost:5173`) and automatically connect to the FastAPI backend running at `http://localhost:8000`.

---

## 🛠️ Project Structure

```
frontend/
├── index.html            # HTML entry point with Plus Jakarta Sans typography
├── package.json          # React, Tailwind CSS, Axios, Lucide React dependencies
├── vite.config.js        # Vite dev server configuration
├── tailwind.config.js    # Tailwind color extensions (WhatsApp teal, green, chat background)
├── postcss.config.js     # PostCSS configuration
└── src/
    ├── main.jsx          # React DOM root render
    ├── App.jsx           # App layout, sidebar routing, and global backend status
    ├── api.js            # Axios client pointing to http://localhost:8000
    ├── index.css         # Tailwind directives & WhatsApp chat background styles
    └── components/
        ├── Sidebar.jsx       # Left navigation sidebar with live status pill
        ├── Overview.jsx      # Metrics overview cards & status badge
        ├── Conversations.jsx # Split-screen chat view with WhatsApp bubbles & simulator
        └── AgentSettings.jsx # Toggle switch, agent name, and system prompt editor
```
