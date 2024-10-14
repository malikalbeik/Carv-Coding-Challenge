from enum import Enum
from pydantic import BaseModel
from datetime import datetime
from typing import List


class Event(BaseModel):
    id: str
    name: str
    description: str
    start_time: datetime
    end_time: datetime
    available_tickets: int
    total_tickets: int
    event_tickets: List["EventTicket"] = []


class EventTicketStatusEnum(str, Enum):
    sold = "Sold"
    available = "Available"
    on_hold = "On Hold"


class EventTicket(BaseModel):
    id: str
    event_id: str
    status: EventTicketStatusEnum
    price: float


class User(BaseModel):
    id: str
    name: str
    email: str
    purchases: List["UserPurchase"] = []


class PurchaseStatusEnum(str, Enum):
    active = "Active"
    cancelled = "Cancelled"


class UserPurchase(BaseModel):
    id: str
    event_id: str
    ticket_id: str
    purchase_status: PurchaseStatusEnum
    purchase_time: datetime


class PurchaseEvent(BaseModel):
    user_id: str
    event_id: str
    ticket_id: str


class CreateEventPayload(BaseModel):
    name: str
    description: str
    start_time: datetime
    end_time: datetime
    total_tickets: int
    tickets_price: float
