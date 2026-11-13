# WhatsApp AI Agent Management System - Backend

Production-ready FastAPI backend for WhatsApp Cloud API & AI Agent Orchestration, supporting both Groq (`llama-3.3-70b-versatile`) and OpenAI (`gpt-4o-mini`).

---

## 🚀 Key Features

1. **Meta WhatsApp Cloud API Integration**:
   - `GET /webhook`: Verification endpoint checking `hub.verify_token`, `hub.mode`, and returning `hub.challenge`.
   - `POST /webhook`: Inbound message receiver with `BackgroundTasks` delegation.
   - Outbound message sender via Meta Graph API v21.0.

2. **LLM Engine (Groq & OpenAI Dual Compatibility)**:
   - Dynamic detection: If `OPENAI_API_KEY` starts with `gsk_`, automatically initializes with `base_url="https://api.groq.com/openai/v1"` and uses `llama-3.3-70b-versatile`.
   - Tool/Function Calling:
     - `get_products_info(query: str)`: Searches product catalog, prices, and inventory availability.
     - `check_order_status(order_id: str)`: Real-time order fulfillment and tracking lookup (e.g. order 9999, 12345, ORD-9988).

3. **Management & Dashboard APIs**:
   - `GET /api/stats`: Total conversations, customers, messages, active agent status.
   - `GET /api/conversations`: All conversations with customer phone and last message time.
   - `GET /api/conversations/{id}`: Chronological chat history.
   - `GET /api/agent`: Retrieve agent persona and business settings.
   - `PUT /api/agent`: Update agent name, system prompt, active toggle, and business name.
   - `POST /api/simulate-whatsapp`: Full end-to-end testing pipeline that executes tools, saves to SQLite, and dispatches real WhatsApp replies.

---

## 🏃 Running the Backend

```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1   # Or source venv/bin/activate on Linux/macOS
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

- API Docs: `http://localhost:8000/docs`
