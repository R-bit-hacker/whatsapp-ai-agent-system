from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from database import Base


# ==========================================
# 1. SQLAlchemy Models
# ==========================================

class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    agents = relationship("Agent", back_populates="business", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="business", cascade="all, delete-orphan")


class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    business_id = Column(Integer, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    system_prompt = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    business = relationship("Business", back_populates="agents")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    phone_number = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=True)

    # Relationships
    conversations = relationship("Conversation", back_populates="customer", cascade="all, delete-orphan")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    business_id = Column(Integer, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="active", nullable=False)
    last_message_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    business = relationship("Business", back_populates="conversations")
    customer = relationship("Customer", back_populates="conversations")
    messages = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at.asc()"
    )


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    sender = Column(String(20), nullable=False)  # "user" or "agent"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")


# ==========================================
# 2. Pydantic Schemas (API Data Transfer Objects)
# ==========================================

class MessageSchema(BaseModel):
    id: int
    conversation_id: int
    sender: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AgentBase(BaseModel):
    name: str
    system_prompt: str
    is_active: bool = True
    business_name: Optional[str] = None


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    system_prompt: Optional[str] = None
    is_active: Optional[bool] = None
    business_name: Optional[str] = None


class AgentResponse(BaseModel):
    id: int
    business_id: int
    name: str
    system_prompt: str
    is_active: bool
    business_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ConversationSummary(BaseModel):
    id: int
    business_id: int
    customer_id: int
    customer_phone: str
    customer_name: Optional[str] = None
    status: str
    last_message_at: datetime
    last_message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ConversationDetail(BaseModel):
    id: int
    business_id: int
    customer_id: int
    customer_phone: str
    customer_name: Optional[str] = None
    status: str
    last_message_at: datetime
    messages: List[MessageSchema] = []

    model_config = ConfigDict(from_attributes=True)


class StatsResponse(BaseModel):
    total_conversations: int
    total_customers: int
    total_messages: int
    active_agent: Optional[AgentResponse] = None


class SimulateWhatsAppRequest(BaseModel):
    phone_number: str
    customer_name: Optional[str] = "Customer"
    message: str
