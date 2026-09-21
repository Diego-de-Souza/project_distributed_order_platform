# API Python — Distributed Order Platform

Terceira implementação do mesmo domínio (Client, Product, Stock, Order, OrderItem, Payment) já construído em NestJS e Java. Mesmo contrato REST e mesmas regras de negócio; o que muda aqui é a arquitetura de suporte, para servir de material de comparação entre os três estilos.

## Estilo arquitetural: CQRS + Event-Driven

- **CQRS explícito**: `app/application/commands.py` (escrita) e `app/application/queries.py` (leitura) são módulos separados, em vez de uma classe de caso de uso por operação. É CQRS "de verdade" só na separação de intenção — não há command bus, nem handlers, nem armazenamento de eventos separado por lado; isso seria over-engineering para o que é, no fundo, CRUD + dois fluxos ricos (pedido e pagamento).
- **Event-Driven de verdade**: em vez de um método por tipo de evento no publisher (o jeito do Java/Nest), existe um `EventBus` genérico (`app/application/events.py`) com `publish`/`subscribe` e despacho via `asyncio.create_task` (fire-and-forget). `ponytail`: é tudo em processo, não publica em fila nenhuma — o próximo degrau é trocar por RabbitMQ quando a Fase 5 (mensageria) chegar às três APIs.
- **Sem Value Objects**: diferente da API Java (que tem `Money`/`Email`), aqui a validação simples inline nos `__post_init__` dos dataclasses já cobre o mesmo invariante. Foi uma lição específica do módulo Java; replicá-la aqui seria repetir a mesma aula duas vezes.

## Camadas

```
app/
  domain/          # dataclasses puros — sem FastAPI, sem SQLAlchemy
  application/      # commands, queries, ports (Protocol), events
  infrastructure/    # SQLAlchemy (Postgres), Redis, gateway de pagamento stub
  presentation/       # FastAPI: schemas, routers, middleware, error handlers
```

- **Ports como `typing.Protocol`**: em vez de ABC com herança obrigatória, os contratos (`ClientRepository`, `PaymentGateway`, `UnitOfWork`, ...) usam *structural typing* — qualquer classe com os métodos certos serve, sem precisar herdar de nada. É o jeito idiomático em Python de fazer inversão de dependência.
- **Optimistic locking**: `StockORM`/`OrderORM` usam `version_id_col` do SQLAlchemy — mesmo papel do `@Version` do Hibernate na API Java. Um UPDATE concorrente com a versão errada levanta `StaleDataError`, traduzido para `ConflictError` (HTTP 409) no repositório.
- **UnitOfWork manual só no pagamento**: a chamada ao gateway de pagamento é I/O externo e nunca deveria travar uma transação de banco aberta. Por isso `create_payment` chama o gateway *fora* de qualquer sessão, e só abre uma sessão dedicada (`SqlAlchemyUnitOfWork`, via `async with`) para gravar o resultado.
- **Retry com backoff**: `_charge_with_retry`/`_retry_retrieve` em `commands.py` distinguem falha "retriable" (timeout/rede) de falha "de negócio" (cartão recusado) e tentam `retrieve_charge` até 3 vezes com backoff crescente — nunca cobram de novo às cegas.
- **Cache-aside**: `get_client`/`get_product` em `queries.py` leem do Redis primeiro; em caso de miss, buscam no Postgres e populam o cache com um dict explícito (nunca o dataclass de domínio bruto — datetime não é serializável em JSON direto).
- **Idempotency-Key**: `IdempotencyKeyMiddleware` (`app/presentation/middleware.py`) usa `SET key val NX EX ttl` no Redis para `POST /orders` e `POST /payments` — a mesma operação atômica que a API Java usa via `setIfAbsent`. Um reenvio com a mesma chave devolve a resposta já registrada em vez de repetir o efeito colateral.

## Rodando localmente

```bash
pip install -r requirements.txt
# Postgres/Redis via docker-compose na raiz do projeto
uvicorn app.main:app --reload --port 3030
```

## Testes

```bash
pytest
```

10 testes cobrindo estoque (reserva, conflito de versão), pedido (criação, cliente inativo, sem itens) e pagamento (aprovado, recusado, timeout-com-recuperação-via-retrieve). Usam repositórios fake em memória (`tests/fakes.py`), sem precisar de Postgres/Redis — o mesmo padrão dos testes JUnit da API Java.

## Limitação conhecida

O código não roda contra Postgres/Redis reais neste ambiente de desenvolvimento (sem os serviços do `docker-compose` disponíveis aqui) — a verificação real foi feita via `pytest` sobre os fakes, mais checagem de import (`python -c "import app.main"`) e geração do schema OpenAPI. Ao rodar localmente com o `docker-compose` da raiz do projeto, crie o banco `api_fastapi_distributed_order_platform` (ver `infrastructure/postgres/init/01-create-databases.sql`).
