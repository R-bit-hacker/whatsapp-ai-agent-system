import json
import logging
import os
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from agent import process_incoming_message
from database import Base, SessionLocal, engine, get_db
from models import (
    Agent,
    AgentResponse,
    AgentUpdate,
    Business,
    Conversation,
    ConversationDetail,
    ConversationSummary,
    Customer,
    Message,
    SimulateWhatsAppRequest,
    StatsResponse,
)

load_dotenv()

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("whatsapp_backend")

# Meta Webhook Verification Token from environment
WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "my_secure_verify_token")

DEFAULT_SYSTEM_PROMPT = (
    "You are a friendly, professional AI customer support and sales agent for our electronics & gadgets store. "
    "Help customers with product recommendations, pricing, stock availability, and order status tracking.\n\n"
    "CRITICAL TOOL CALLING RULES:\n"
    "1. When customers ask about products, pricing, specs, or what items are in stock, ALWAYS invoke the 'get_products_info' tool.\n"
    "2. When customers ask for their order status or provide an order ID (e.g., #9999, 12345, ORD-9988), ALWAYS invoke the 'check_order_status' tool.\n"
    "3. Respond warmly, politely, and format prices clearly with dollar signs ($)."
)


# ==========================================
# Lifespan: DB Initialization & Seeding
# ==========================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables if not existing
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    # Seed default Business and Agent if empty
    db = SessionLocal()
    try:
        business = db.query(Business).first()
        if not business:
            logger.info("Seeding default Business...")
            business = Business(name="WhatsApp AI Tech Store")
            db.add(business)
            db.commit()
            db.refresh(business)

        agent = db.query(Agent).filter_by(business_id=business.id).first()
        if not agent:
            logger.info("Seeding default Agent...")
            agent = Agent(
                business_id=business.id,
                name="AI Customer Support Assistant",
                system_prompt=DEFAULT_SYSTEM_PROMPT,
                is_active=True
            )
            db.add(agent)
            db.commit()
        elif "get_products_info" not in agent.system_prompt:
            # Upgrade existing prompt to include product catalog instructions
            agent.system_prompt = DEFAULT_SYSTEM_PROMPT
            db.commit()
            logger.info("Updated Agent system prompt with product catalog instructions.")
    except Exception as e:
        logger.error(f"Error during database startup seed: {e}")
    finally:
        db.close()

    yield
    logger.info("Application shutting down...")


# ==========================================
# FastAPI Application & CORS
# ==========================================

app = FastAPI(
    title="WhatsApp AI Agent Management System",
    description="Production-ready FastAPI backend for WhatsApp Cloud API & AI Agent Orchestration (Groq & OpenAI Compatible)",
    version="1.1.0",
    lifespan=lifespan
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# Root & Health Check
# ==========================================

@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "service": "WhatsApp AI Agent Management System",
        "llm_engine": "Groq / OpenAI (llama-3.3-70b-versatile or gpt-4o-mini)",
        "docs_url": "/docs"
    }


# ==========================================
# 2. WhatsApp Webhook Endpoints
# ==========================================

@app.get("/webhook", tags=["WhatsApp Webhook"])
def verify_meta_webhook(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
):
    """
    GET /webhook: Meta verification endpoint checking hub.verify_token.
    Meta Cloud API sends hub.mode='subscribe', hub.verify_token, and hub.challenge.
    """
    logger.info(f"Verification request received: mode={hub_mode}, token={hub_verify_token}")

    if hub_mode == "subscribe" and hub_verify_token == WHATSAPP_VERIFY_TOKEN:
        logger.info("Webhook verification token matched successfully.")
        return PlainTextResponse(content=hub_challenge or "", status_code=status.HTTP_200_OK)

    logger.warning("Webhook verification token mismatch or invalid mode.")
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Verification token mismatch"
    )


async def async_process_webhook_payload(payload: Dict[str, Any]):
    """
    Background worker that parses incoming WhatsApp message entries and invokes the AI pipeline.
    Handles both live production messages and Meta Developer Dashboard test webhook payloads.
    """
    logger.info("Incoming Meta Webhook payload:\n%s", json.dumps(payload, indent=2))
    db = SessionLocal()
    try:
        entries = payload.get("entry", [])
        for entry in entries:
            changes = entry.get("changes", [])
            for change in changes:
                value = change.get("value", {})
                messages = value.get("messages", [])
                contacts = value.get("contacts", [])

                if not messages:
                    # Could be a status update (delivered, read) or test ping
                    continue

                # Extract contact profile name if provided
                sender_name = "WhatsApp User"
                if contacts and len(contacts) > 0:
                    profile = contacts[0].get("profile", {})
                    sender_name = profile.get("name") or "WhatsApp User"

                for msg in messages:
                    msg_type = msg.get("type")
                    # Extract sender phone (from 'from' field or 'wa_id')
                    sender_phone = msg.get("from")
                    if not sender_phone and contacts and len(contacts) > 0:
                        sender_phone = contacts[0].get("wa_id")

                    # Extract message text content
                    text_content = ""
                    if msg_type == "text":
                        text_content = msg.get("text", {}).get("body", "").strip()
                    elif msg_type == "interactive":
                        interactive = msg.get("interactive", {})
                        if interactive.get("type") == "button_reply":
                            text_content = interactive.get("button_reply", {}).get("title", "")
                        elif interactive.get("type") == "list_reply":
                            text_content = interactive.get("list_reply", {}).get("title", "")
                    elif msg_type == "button":
                        text_content = msg.get("button", {}).get("text", "").strip()
                    elif msg_type:
                        text_content = f"[{msg_type} message received]"

                    if sender_phone and text_content:
                        logger.info(f"Processing incoming WhatsApp message from {sender_phone} ({sender_name}): {text_content}")
                        await process_incoming_message(
                            db=db,
                            sender_phone=sender_phone,
                            sender_name=sender_name,
                            incoming_text=text_content
                        )
    except Exception as e:
        logger.error(f"Error processing webhook message in background: {e}", exc_info=True)
    finally:
        db.close()


@app.post("/webhook", tags=["WhatsApp Webhook"])
async def receive_meta_webhook(
    request: Request,
    background_tasks: BackgroundTasks
):
    """
    POST /webhook: Receive incoming WhatsApp messages from Meta Cloud API.
    Acknowledge with 200 OK immediately and delegate processing to background tasks.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON body")

    background_tasks.add_task(async_process_webhook_payload, body)
    return {"status": "received"}


# ==========================================
# 3. WhatsApp Live Simulator Endpoint
# ==========================================

@app.post("/api/simulate-whatsapp", tags=["WhatsApp Webhook"])
async def simulate_whatsapp_message(
    payload: SimulateWhatsAppRequest,
    db: Session = Depends(get_db)
):
    """
    POST /api/simulate-whatsapp:
    Executes the end-to-end incoming message pipeline:
    - Resolves customer & creates/updates conversation
    - Saves user message to SQLite
    - Executes LLM (Groq / OpenAI) with tool calling (get_products_info, check_order_status)
    - Saves AI reply to SQLite
    - Dispatches real WhatsApp reply via Meta Cloud API to the phone number!
    """
    logger.info(
        f"Simulating incoming WhatsApp message from {payload.phone_number} "
        f"({payload.customer_name}): {payload.message}"
    )

    ai_reply = await process_incoming_message(
        db=db,
        sender_phone=payload.phone_number,
        sender_name=payload.customer_name or "WhatsApp User",
        incoming_text=payload.message
    )

    return {
        "status": "success",
        "phone_number": payload.phone_number,
        "customer_name": payload.customer_name,
        "incoming_message": payload.message,
        "agent_response": ai_reply,
        "whatsapp_dispatched": True
    }


# Backwards compatibility endpoint
@app.post("/api/simulate-message", tags=["Testing"])
async def simulate_incoming_message_legacy(
    phone_number: str = Query(..., description="Customer phone number"),
    message: str = Query(..., description="User message text"),
    customer_name: Optional[str] = Query(None, description="Customer name"),
    db: Session = Depends(get_db)
):
    reply = await process_incoming_message(
        db=db,
        sender_phone=phone_number,
        sender_name=customer_name,
        incoming_text=message
    )
    return {
        "status": "processed",
        "sender_phone": phone_number,
        "customer_message": message,
        "agent_response": reply
    }


# ==========================================
# 4. Dashboard APIs (CRUD)
# ==========================================

def serialize_agent(agent: Optional[Agent], business: Optional[Business]) -> Optional[AgentResponse]:
    if not agent:
        return None
    return AgentResponse(
        id=agent.id,
        business_id=agent.business_id,
        name=agent.name,
        system_prompt=agent.system_prompt,
        is_active=agent.is_active,
        business_name=business.name if business else "WhatsApp AI Tech Store"
    )


@app.get("/api/stats", response_model=StatsResponse, tags=["Dashboard"])
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    GET /api/stats: Return total conversations, customers, messages, and active agent status.
    """
    total_conversations = db.query(Conversation).count()
    total_customers = db.query(Customer).count()
    total_messages = db.query(Message).count()
    agent = db.query(Agent).first()
    business = db.query(Business).first()

    return StatsResponse(
        total_conversations=total_conversations,
        total_customers=total_customers,
        total_messages=total_messages,
        active_agent=serialize_agent(agent, business)
    )


@app.get("/api/conversations", response_model=List[ConversationSummary], tags=["Dashboard"])
def list_conversations(db: Session = Depends(get_db)):
    """
    GET /api/conversations: Return all conversations with customer phone numbers and last message time.
    """
    conversations = (
        db.query(Conversation)
        .order_by(Conversation.last_message_at.desc())
        .all()
    )

    summaries: List[ConversationSummary] = []
    for conv in conversations:
        last_msg = conv.messages[-1].content if conv.messages else None
        summaries.append(
            ConversationSummary(
                id=conv.id,
                business_id=conv.business_id,
                customer_id=conv.customer_id,
                customer_phone=conv.customer.phone_number if conv.customer else "Unknown",
                customer_name=conv.customer.name if conv.customer else None,
                status=conv.status,
                last_message_at=conv.last_message_at,
                last_message=last_msg
            )
        )

    return summaries


@app.get("/api/conversations/{conversation_id}", response_model=ConversationDetail, tags=["Dashboard"])
def get_conversation_history(conversation_id: int, db: Session = Depends(get_db)):
    """
    GET /api/conversations/{id}: Return chronological chat history.
    """
    conv = db.query(Conversation).filter_by(id=conversation_id).first()
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation #{conversation_id} not found"
        )

    return ConversationDetail(
        id=conv.id,
        business_id=conv.business_id,
        customer_id=conv.customer_id,
        customer_phone=conv.customer.phone_number if conv.customer else "Unknown",
        customer_name=conv.customer.name if conv.customer else None,
        status=conv.status,
        last_message_at=conv.last_message_at,
        messages=conv.messages
    )


@app.get("/api/agent", response_model=AgentResponse, tags=["Dashboard"])
def get_agent_config(db: Session = Depends(get_db)):
    """
    GET /api/agent: Retrieve the current agent settings.
    """
    agent = db.query(Agent).first()
    business = db.query(Business).first()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No agent configured")
    return serialize_agent(agent, business)


@app.put("/api/agent", response_model=AgentResponse, tags=["Dashboard"])
def update_agent_config(update_data: AgentUpdate, db: Session = Depends(get_db)):
    """
    PUT /api/agent: Update agent name, system prompt, is_active toggle, and business name.
    """
    business = db.query(Business).first()
    if not business:
        business = Business(name=update_data.business_name or "WhatsApp AI Tech Store")
        db.add(business)
        db.commit()
        db.refresh(business)
    elif update_data.business_name:
        business.name = update_data.business_name

    agent = db.query(Agent).first()

    if not agent:
        agent = Agent(
            business_id=business.id,
            name=update_data.name or "AI Customer Support Assistant",
            system_prompt=update_data.system_prompt or DEFAULT_SYSTEM_PROMPT,
            is_active=update_data.is_active if update_data.is_active is not None else True
        )
        db.add(agent)
    else:
        if update_data.name is not None:
            agent.name = update_data.name
        if update_data.system_prompt is not None:
            agent.system_prompt = update_data.system_prompt
        if update_data.is_active is not None:
            agent.is_active = update_data.is_active

    db.commit()
    db.refresh(agent)
    db.refresh(business)

    return serialize_agent(agent, business)
