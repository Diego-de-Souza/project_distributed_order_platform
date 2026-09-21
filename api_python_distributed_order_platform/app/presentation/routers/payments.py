from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.application import commands
from app.application.events import EventBus
from app.application.ports import OrderRepository, PaymentGateway, PaymentRepository
from app.presentation.deps import (
    get_event_bus, get_order_repository, get_payment_gateway, get_payment_repository, get_unit_of_work_factory,
)
from app.presentation.mappers import to_payment_response
from app.presentation.schemas import CreatePaymentRequest, PaymentResponse

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    body: CreatePaymentRequest,
    orders: OrderRepository = Depends(get_order_repository),
    payments: PaymentRepository = Depends(get_payment_repository),
    make_unit_of_work=Depends(get_unit_of_work_factory),
    gateway: PaymentGateway = Depends(get_payment_gateway),
    events: EventBus = Depends(get_event_bus),
) -> PaymentResponse:
    payment = await commands.create_payment(body.order_id, body.amount, orders, payments, make_unit_of_work, gateway, events)
    return to_payment_response(payment)
