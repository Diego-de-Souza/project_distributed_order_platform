"""
Event-Driven de verdade começa aqui: em vez de cada caso de uso chamar um
método específico do publisher pra cada tipo de evento (o jeito do NestJS
e do Java), a API Python emite um objeto de evento tipado num barramento
genérico (EventBus) e quem quiser reage de forma assíncrona e desacoplada.

ponytail: o EventBus abaixo é 100% em processo (asyncio.create_task) — não
publica em fila nenhuma. É o suficiente pra demonstrar o padrão pub/sub e
concorrência via event loop; trocar por um publisher RabbitMQ real (com
consumers/workers) é o próximo degrau, quando a Fase 5 (mensageria) entrar
pra valer nas três APIs.
"""
from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from typing import Any, Awaitable, Callable, DefaultDict
from collections import defaultdict

logger = logging.getLogger("order.events")


@dataclass(frozen=True)
class DomainEvent:
    name: str
    payload: dict[str, Any]


EventHandler = Callable[[DomainEvent], Awaitable[None]]


class EventBus:
    def __init__(self) -> None:
        self._handlers: DefaultDict[str, list[EventHandler]] = defaultdict(list)

    def subscribe(self, event_name: str, handler: EventHandler) -> None:
        self._handlers[event_name].append(handler)

    async def publish(self, event: DomainEvent) -> None:
        handlers = self._handlers.get(event.name, [])
        if not handlers:
            logger.info("[event] %s %s (sem subscribers)", event.name, event.payload)
            return
        # fire-and-forget: cada handler roda como uma task própria, então um
        # handler lento (ou que falha) não atrasa nem derruba a resposta HTTP.
        for handler in handlers:
            asyncio.create_task(_safe_call(handler, event))


async def _safe_call(handler: EventHandler, event: DomainEvent) -> None:
    try:
        await handler(event)
    except Exception:  # noqa: BLE001 - handler de evento nunca deve derrubar o processo
        logger.exception("Event handler failed for %s", event.name)


async def _log_subscriber(event: DomainEvent) -> None:
    logger.info("[event] %s %s", event.name, event.payload)


def build_default_event_bus() -> EventBus:
    bus = EventBus()
    for name in (
        "order.created", "order.confirmed", "order.cancelled",
        "payment.paid", "payment.failed",
        "stock.reserved", "stock.released", "stock.consumed",
    ):
        bus.subscribe(name, _log_subscriber)
    return bus
