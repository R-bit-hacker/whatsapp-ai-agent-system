import json
import logging
import os
import random
import re
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx
from dotenv import load_dotenv
from openai import AsyncOpenAI
from sqlalchemy.orm import Session

from models import Agent, Business, Conversation, Customer, Message

# Force load .env immediately
load_dotenv(override=True)

logger = logging.getLogger("whatsapp_agent")
logger.setLevel(logging.INFO)


# ==============================================================
# 1. LLM CLIENT INITIALIZATION (GROQ & OPENAI AUTO-COMPATIBILITY)
# ==============================================================

def get_llm_config():
    """
    Dynamically configures LLM client and candidate models.
    Always force reloads .env so changes are picked up instantly without restarting.
    """
    load_dotenv(override=True)
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    configured_model = os.getenv("OPENAI_MODEL", "").strip()
    
    is_groq = api_key.startswith("gsk_")

    if is_groq:
        base_url = "https://api.groq.com/openai/v1"
        client = AsyncOpenAI(api_key=api_key, base_url=base_url) if api_key else None
        
        # Primary candidate models on Groq for function calling
        models = []
        if configured_model and configured_model not in ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"]:
            models.append(configured_model)
        models.extend([
            "openai/gpt-oss-120b",
            "qwen/qwen3.8-27b",
            "llama-3.3-70b-versatile",
            "openai/gpt-oss-20b"
        ])
        # Deduplicate while preserving order
        candidate_models = list(dict.fromkeys(models))
        logger.info(f"Groq Client initialized with candidate models: {candidate_models}")
    else:
        # Standard OpenAI client
        client = AsyncOpenAI(api_key=api_key) if api_key else None
        candidate_models = [configured_model or "gpt-4o-mini"]
        logger.info(f"OpenAI Client initialized with model: {candidate_models}")

    return client, candidate_models


# ==============================================================
# 2. BUSINESS DATA: PRODUCT CATALOG & SAMPLE ORDERS
# ==============================================================

PRODUCT_CATALOG = [
    {
        "id": "PROD-001",
        "name": "Wireless Noise-Canceling Headphones",
        "category": "Audio",
        "price": 149.99,
        "currency": "USD",
        "in_stock": True,
        "stock_count": 42,
        "description": "Premium over-ear wireless headphones with active noise cancellation, 30-hour battery life, and Bluetooth 5.3."
    },
    {
        "id": "PROD-002",
        "name": "Smart Fitness Watch Ultra",
        "category": "Wearables",
        "price": 199.99,
        "currency": "USD",
        "in_stock": True,
        "stock_count": 18,
        "description": "Water-resistant smartwatch with AMOLED display, heart rate monitor, SpO2 sensor, and GPS fitness tracking."
    },
    {
        "id": "PROD-003",
        "name": "Pro Mechanical Gaming Keyboard",
        "category": "Peripherals",
        "price": 89.99,
        "currency": "USD",
        "in_stock": True,
        "stock_count": 27,
        "description": "Tenkeyless RGB mechanical keyboard with hot-swappable tactile switches and detachable USB-C cable."
    },
    {
        "id": "PROD-004",
        "name": "Ergonomic Aluminum Laptop Stand",
        "category": "Accessories",
        "price": 39.99,
        "currency": "USD",
        "in_stock": True,
        "stock_count": 65,
        "description": "Adjustable ventilated aluminum riser stand compatible with laptops from 10 to 17 inches."
    },
    {
        "id": "PROD-005",
        "name": "7-in-1 Dual HDMI USB-C Hub",
        "category": "Connectivity",
        "price": 49.99,
        "currency": "USD",
        "in_stock": False,
        "stock_count": 0,
        "description": "Multiport adapter featuring 4K 60Hz HDMI, 100W Power Delivery pass-through, SD card reader, and 3x USB 3.0 ports."
    }
]

SAMPLE_ORDERS = {
    "9999": {
        "order_id": "9999",
        "customer_name": "Rubaisha",
        "items": ["Wireless Noise-Canceling Headphones"],
        "total_amount": 149.99,
        "currency": "USD",
        "status": "Shipped",
        "carrier": "DHL Express",
        "tracking_number": "DHL-PK-8829103",
        "estimated_delivery": "Within 2 business days"
    },
    "12345": {
        "order_id": "12345",
        "customer_name": "John Doe",
        "items": ["Smart Fitness Watch Ultra"],
        "total_amount": 199.99,
        "currency": "USD",
        "status": "Delivered",
        "carrier": "FedEx",
        "tracking_number": "FDX-992144",
        "delivered_on": "Yesterday at 2:30 PM"
    },
    "ORD-9988": {
        "order_id": "ORD-9988",
        "customer_name": "Sarah Connor",
        "items": ["Pro Mechanical Gaming Keyboard", "Ergonomic Aluminum Laptop Stand"],
        "total_amount": 129.98,
        "currency": "USD",
        "status": "Processing",
        "carrier": "Pending dispatch",
        "estimated_delivery": "Expected dispatch tomorrow"
    }
}


# ==============================================================
# 3. LLM TOOLS IMPLEMENTATION
# ==============================================================

def check_order_status(order_id: str) -> str:
    """
    Check the current fulfillment and shipping status of an order given its order ID.
    Checks SAMPLE_ORDERS first; falls back to a deterministic realistic order status.
    """
    clean_id = str(order_id).strip().lstrip("#").upper()
    
    # Check known sample orders
    for key, order in SAMPLE_ORDERS.items():
        if key.upper() == clean_id:
            logger.info(f"Found known order #{order_id}: {order['status']}")
            return json.dumps({
                "found": True,
                "order_id": order["order_id"],
                "customer_name": order.get("customer_name"),
                "status": order["status"],
                "items": order["items"],
                "total": f"${order['total_amount']} {order['currency']}",
                "carrier": order.get("carrier"),
                "tracking_number": order.get("tracking_number"),
                "details": order.get("estimated_delivery") or order.get("delivered_on") or "In transit",
                "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
            })

    # Deterministic fallback status for any other order ID
    fallback_statuses = ["Processing", "Shipped", "Delivered"]
    idx = sum(ord(c) for c in clean_id) % len(fallback_statuses)
    status = fallback_statuses[idx]
    
    return json.dumps({
        "found": True,
        "order_id": order_id,
        "status": status,
        "details": f"Order #{order_id} is currently {status}.",
        "carrier": "Standard Express",
        "tracking_number": f"TRK-{clean_id}-US",
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    })


def get_products_info(query: str = "") -> str:
    """
    Search and retrieve product catalog information, prices, stock availability, and specs.
    If query is empty, returns all products in catalog.
    """
    q = (query or "").strip().lower()
    if not q or q in ["all", "products", "list", "catalog", "everything"]:
        matching = PRODUCT_CATALOG
    else:
        matching = [
            p for p in PRODUCT_CATALOG
            if q in p["name"].lower() or q in p["category"].lower() or q in p["description"].lower()
        ]
        if not matching:
            matching = PRODUCT_CATALOG

    results = []
    for item in matching:
        results.append({
            "id": item["id"],
            "name": item["name"],
            "category": item["category"],
            "price": f"${item['price']:.2f} {item['currency']}",
            "availability": "In Stock" if item["in_stock"] else "Out of Stock",
            "stock_units": item["stock_count"],
            "description": item["description"]
        })

    return json.dumps({
        "count": len(results),
        "products": results
    })


TOOL_REGISTRY = {
    "check_order_status": check_order_status,
    "get_products_info": get_products_info,
}

# Clean tool definitions (NO "additionalProperties": False to maintain strict Groq compatibility)
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "check_order_status",
            "description": "Look up the real-time shipping or fulfillment status, tracking number, and delivery details of an order using its order ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {
                        "type": "string",
                        "description": "The unique identifier of the customer's order, e.g. '9999', '12345', or 'ORD-9988'."
                    }
                },
                "required": ["order_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_products_info",
            "description": "Retrieve product catalog information, prices, inventory availability, and specs for customer inquiries.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Product name or keyword to search (e.g. 'headphones', 'smartwatch', 'keyboard', or empty to list all products)."
                    }
                }
            }
        }
    }
]


# ==============================================================
# 4. SMART TOOL-AWARE FALLBACK RESPONDER
# ==============================================================

def smart_tool_aware_fallback(user_message: str, system_prompt: str = "") -> str:
    """
    Intelligent tool-aware fallback responder.
    Never shows a generic error message! If LLM is unreachable, rate-limited,
    or tool calling fails, it inspects the user message, executes the matching tool,
    and returns a natural, helpful customer response.
    """
    msg = user_message.lower()

    # 1. Order Status Tracking
    order_patterns = [
        r'#?([0-9]{4,8})',
        r'(?:order\s*#?|ord[-_]?)([a-zA-Z0-9\-]+)',
        r'(?:tracking|status)\s*(?:of|for)?\s*#?([a-zA-Z0-9\-]+)'
    ]
    extracted_order = None
    for pattern in order_patterns:
        match = re.search(pattern, user_message, re.IGNORECASE)
        if match:
            candidate = match.group(1).strip()
            if candidate and candidate.lower() not in ["status", "the", "my"]:
                extracted_order = candidate
                break

    if extracted_order or any(word in msg for word in ["order", "track", "tracking", "status", "package", "dispatch"]):
        order_id = extracted_order or "9999"
        raw_info = check_order_status(order_id)
        info = json.loads(raw_info)
        
        customer_greeting = f" for {info['customer_name']}" if info.get("customer_name") else ""
        items_str = ", ".join(info.get("items", [])) if info.get("items") else "your ordered items"
        carrier_str = f" via {info['carrier']}" if info.get("carrier") else ""
        tracking_str = f" (Tracking Number: {info['tracking_number']})" if info.get("tracking_number") else ""

        return (
            f"Hello! I looked up the details for your order #{info.get('order_id', order_id)}{customer_greeting}:\n\n"
            f"• Status: {info.get('status', 'Processing')}\n"
            f"• Items: {items_str}\n"
            f"• Carrier: {info.get('carrier', 'Standard Express')}{tracking_str}\n"
            f"• Delivery Update: {info.get('details', 'In transit')}\n\n"
            "Please let us know if you need any additional assistance!"
        )

    # 2. Products, Catalog, Stock, and Pricing
    product_keywords = [
        "product", "products", "stock", "price", "prices", "cost", "catalog", 
        "inventory", "buy", "headphones", "watch", "keyboard", "stand", "hub", "available"
    ]
    if any(word in msg for word in product_keywords):
        raw_catalog = get_products_info(user_message)
        data = json.loads(raw_catalog)
        products = data.get("products", [])

        lines = ["Here are the products currently available in our store:\n"]
        for p in products:
            status_text = f"In Stock ({p['stock_units']} available)" if "In Stock" in p.get("availability", "") else "Out of Stock"
            lines.append(f"• {p['name']} — {p['price']} [{status_text}]\n  {p['description']}")

        lines.append("\nPlease let me know if you would like more details or want to place an order!")
        return "\n".join(lines)

    # 3. Greetings & General Inquiries
    return (
        "Hello! Welcome to our store support. I can assist you with:\n\n"
        "1. Product catalog, prices, and stock availability (headphones, smartwatches, keyboards, etc.).\n"
        "2. Order status and delivery tracking (e.g., Order #9999, ORD-9988, 12345).\n\n"
        "How can I help you today?"
    )


# ==============================================================
# 5. LLM RESPONSE GENERATION
# ==============================================================

async def generate_agent_response(
    system_prompt: str,
    chat_history: List[Message],
    new_user_message: str
) -> str:
    """
    Calls Groq or OpenAI API with system prompt context, conversation history,
    and handles tool/function calling for check_order_status and get_products_info.
    Uses clean dictionary construction for Groq compatibility and falls back seamlessly.
    """
    # 1. Force load .env immediately so changes take effect without restarts
    load_dotenv(override=True)
    client, candidate_models = get_llm_config()

    if not client:
        logger.warning("No LLM client configured. Using smart fallback responder.")
        return smart_tool_aware_fallback(new_user_message, system_prompt)

    # Build messages array
    messages: List[Dict[str, Any]] = [
        {"role": "system", "content": system_prompt}
    ]

    # Include recent chat history
    for msg in chat_history:
        role = "user" if msg.sender == "user" else "assistant"
        messages.append({"role": role, "content": msg.content})

    # Add the current incoming user message
    messages.append({"role": "user", "content": new_user_message})

    # Try candidate models
    last_error = None
    for model in candidate_models:
        try:
            logger.info(f"Attempting completion with model '{model}'...")
            
            # 1st call: Model decides whether to call tools
            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                tools=TOOLS,
                tool_choice="auto"
            )

            response_message = response.choices[0].message

            # Check if the model triggered any tool calls
            if response_message.tool_calls:
                # Append clean assistant message dictionary (avoids OpenAI SDK model_dump extra fields)
                clean_assistant_msg = {
                    "role": "assistant",
                    "content": response_message.content or "",
                    "tool_calls": [
                        {
                            "id": tc.id,
                            "type": "function",
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments
                            }
                        }
                        for tc in response_message.tool_calls
                    ]
                }
                messages.append(clean_assistant_msg)

                for tool_call in response_message.tool_calls:
                    function_name = tool_call.function.name
                    raw_args = tool_call.function.arguments
                    
                    if isinstance(raw_args, dict):
                        function_args = raw_args
                    else:
                        try:
                            function_args = json.loads(raw_args) if raw_args else {}
                        except Exception:
                            function_args = {}

                    logger.info(f"Agent triggered tool '{function_name}' with args: {function_args}")

                    tool_func = TOOL_REGISTRY.get(function_name)
                    if tool_func:
                        try:
                            function_result = tool_func(**function_args)
                        except Exception as err:
                            logger.error(f"Error executing tool {function_name}: {err}")
                            function_result = json.dumps({"error": str(err)})
                    else:
                        function_result = json.dumps({"error": f"Unknown tool '{function_name}'"})

                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": function_result
                    })

                # 2nd call: LLM synthesizes final answer using tool results
                second_response = await client.chat.completions.create(
                    model=model,
                    messages=messages
                )
                final_content = second_response.choices[0].message.content or ""
                if final_content.strip():
                    return final_content

            # Normal reply without tools
            content = response_message.content or ""
            if content.strip():
                return content

        except Exception as e:
            error_str = str(e)
            logger.warning(f"Model '{model}' failed: {error_str}")
            last_error = e
            # If 404 (model not found), continue to next candidate model
            if "404" in error_str or "does not exist" in error_str:
                continue
            # For other errors, break and use smart fallback
            break

    # If all LLM calls failed or error occurred, use Smart Tool-Aware Fallback
    logger.info(f"Falling back to Smart Tool-Aware Fallback (reason: {last_error})")
    return smart_tool_aware_fallback(new_user_message, system_prompt)


# ==============================================================
# 6. WHATSAPP CLOUD API CLIENT
# ==============================================================

async def send_whatsapp_message(to_phone: str, text: str) -> Dict[str, Any]:
    """
    Sends an outbound WhatsApp text message via Meta WhatsApp Cloud API (Graph API v21.0).
    """
    load_dotenv(override=True)
    token = os.getenv("WHATSAPP_TOKEN", os.getenv("WHATSAPP_ACCESS_TOKEN", "")).strip()
    phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "").strip()

    if not token or not phone_id:
        logger.warning(
            f"[WhatsApp Simulated] No token or phone ID set. Simulated send to {to_phone}: {text}"
        )
        return {
            "status": "simulated",
            "to": to_phone,
            "message": text,
            "timestamp": datetime.utcnow().isoformat()
        }

    url = f"https://graph.facebook.com/v21.0/{phone_id}/messages"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to_phone,
        "type": "text",
        "text": {
            "preview_url": False,
            "body": text
        }
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            if response.status_code >= 400:
                logger.error(f"WhatsApp Cloud API Error: {response.status_code} - {response.text}")
            response.raise_for_status()
            logger.info(f"Successfully dispatched WhatsApp message to {to_phone}")
            return response.json()
    except Exception as e:
        logger.error(f"Failed to send WhatsApp message to {to_phone}: {e}")
        return {"error": str(e), "status": "failed"}


# ==============================================================
# 7. MESSAGE ORCHESTRATION PIPELINE
# ==============================================================

async def process_incoming_message(
    db: Session,
    sender_phone: str,
    sender_name: Optional[str],
    incoming_text: str
) -> Optional[str]:
    """
    Core pipeline:
    1. Finds or creates customer
    2. Finds or creates default business
    3. Finds or creates active conversation
    4. Saves incoming user message to database
    5. Checks Agent.is_active status
    6. Gathers recent chat history context
    7. Generates AI response with tools
    8. Saves AI response message to database
    9. Dispatches reply back to user via WhatsApp Cloud API
    """
    # 1. Customer resolution
    customer = db.query(Customer).filter_by(phone_number=sender_phone).first()
    if not customer:
        customer = Customer(
            phone_number=sender_phone,
            name=sender_name if sender_name else "WhatsApp User"
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
    elif sender_name and (customer.name == "WhatsApp User" or not customer.name):
        customer.name = sender_name
        db.commit()

    # 2. Business resolution
    business = db.query(Business).first()
    if not business:
        business = Business(name="WhatsApp AI Tech Store")
        db.add(business)
        db.commit()
        db.refresh(business)

    # 3. Conversation resolution
    conversation = (
        db.query(Conversation)
        .filter_by(customer_id=customer.id, business_id=business.id, status="active")
        .first()
    )
    if not conversation:
        conversation = Conversation(
            business_id=business.id,
            customer_id=customer.id,
            status="active",
            last_message_at=datetime.utcnow()
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # 4. Save incoming user message
    user_msg = Message(
        conversation_id=conversation.id,
        sender="user",
        content=incoming_text,
        created_at=datetime.utcnow()
    )
    db.add(user_msg)
    conversation.last_message_at = datetime.utcnow()
    db.commit()
    db.refresh(user_msg)

    # 5. Check Agent status
    agent = db.query(Agent).filter_by(business_id=business.id).first()
    if not agent or not agent.is_active:
        logger.info(f"Agent is inactive or disabled for business {business.id}. Message stored without AI reply.")
        return None

    # 6. Gather recent chat history for context (last 10 messages before current)
    recent_history = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id, Message.id != user_msg.id)
        .order_by(Message.created_at.desc())
        .limit(10)
        .all()
    )
    recent_history.reverse()

    # 7. Generate AI response using LLM + Tool calling
    ai_reply = await generate_agent_response(
        system_prompt=agent.system_prompt,
        chat_history=recent_history,
        new_user_message=incoming_text
    )

    # 8. Save AI response to DB
    agent_msg = Message(
        conversation_id=conversation.id,
        sender="agent",
        content=ai_reply,
        created_at=datetime.utcnow()
    )
    db.add(agent_msg)
    conversation.last_message_at = datetime.utcnow()
    db.commit()

    # 9. Send response back to user via WhatsApp Cloud API
    await send_whatsapp_message(to_phone=sender_phone, text=ai_reply)

    return ai_reply
