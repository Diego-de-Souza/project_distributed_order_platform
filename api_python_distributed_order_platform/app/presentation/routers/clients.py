from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.application import commands, queries
from app.application.ports import CacheStore, ClientRepository
from app.presentation.deps import get_cache_store, get_client_repository
from app.presentation.mappers import to_client_response
from app.presentation.schemas import ClientResponse, CreateClientRequest

router = APIRouter(prefix="/clients", tags=["clients"])


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(body: CreateClientRequest, clients: ClientRepository = Depends(get_client_repository)) -> ClientResponse:
    client = await commands.create_client(body.name, body.email, clients)
    return to_client_response(client)


@router.get("", response_model=list[ClientResponse])
async def list_clients(clients: ClientRepository = Depends(get_client_repository)) -> list[ClientResponse]:
    result = await queries.list_clients(clients)
    return [to_client_response(c) for c in result]


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: str,
    clients: ClientRepository = Depends(get_client_repository),
    cache: CacheStore = Depends(get_cache_store),
) -> ClientResponse:
    client = await queries.get_client(client_id, clients, cache)
    return to_client_response(client)


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
async def delete_client(client_id: str, clients: ClientRepository = Depends(get_client_repository)) -> None:
    await commands.delete_client(client_id, clients)
