# Projeto proposto : Distributed Order Platform

A ideia é ter um projeto simples na aplicação, mas robusto na arquitetura, este projeto é um projeto de treinamento para manter os conhecimentos sobre programação vivos na mente em um medio onde a IA vende sendo usado indiscriminadamente e os conhecimentos básicos de programação e arquitetura de software estão sendo esquecidos.

O projeto vai se dividr em um projeto com 3 linguagens (nestJS(NodeJS), Java com SpringBoot e python com fast API), sendo 3 APIs cada uma com uma arquitetura.

Um sistema de pedidos simples, porém suficientemente rico para trabalhar:

• CRUD e regras de negócio
• autenticação/autorização
• persistência
• transações
• concorrência
• filas/eventos
• idempotência
• cache
• observabilidade
• tratamento de erros
• testes unitários, integração e contrato
• Docker
• documentação OpenAPI
• métricas e tracing
• princípios SOLID
• orientação a objetos
• padrões de projeto
• resiliência
• comunicação entre serviços

As 3 APIs podem representar:

| API   | Tecnologia             | Arquitetura principal          | Principal objetivo de aprendizado              |
| ----- | ---------------------- | ------------------------------ | ---------------------------------------------- |
| API 1 | **Node.js + NestJS**   | Clean Architecture / Hexagonal | modularidade, DI, ports & adapters             |
| API 2 | **Java + Spring Boot** | DDD + Hexagonal                | domínio rico, OOP e transações                 |
| API 3 | **Python + FastAPI**   | Event-Driven / CQRS            | concorrência, async e processamento assíncrono |


## Node.js + NestJS - Clean Architecture

Pasta: `api_nestjs_distributed_order_platform/`

Estrutura atual (já no código):

```terminal
    src/
    ├── domain/
    │   └── entities/          # Client, Product, Stock, Order, OrderItem, Payment
    │
    ├── application/
    │   ├── port/              # contratos (repositories, gateway, UoW)
    │   └── use-case/          # client, product, stock, order, payment
    │
    ├── infrastructure/
    │   ├── persistence/postgres/   # Sequelize models + repositories + UoW
    │   └── payment/                # StubPaymentGateway (Stripe/MP depois)
    │
    ├── presentation/
    │   ├── http/              # controllers, dto, mappers
    │   └── payment.controller.ts
    │
    ├── modules/               # Client, Product, Order, Payment
    ├── shared/                # enums, interfaces, tokens DI
    └── config/
```

Ainda previstos (não implementados):

```terminal
    infrastructure/messaging/   # RabbitMQ publishers/consumers
    infrastructure/cache/       # Redis
    presentation/filters/
    presentation/guards/
    domain/value-objects/
```

Aqui o foco é Dependency Inversion: o domínio não conhece Sequelize, Postgres, Redis, RabbitMQ nem Stripe.

### Progresso NestJS (snapshot)

| Tema | Status |
|------|--------|
| Clean/Hex + DI + ports | ✅ |
| Client / Product / Stock / Order REST | ✅ |
| Payment + gateway stub + retry | ✅ |
| Reserva/consumo/release de estoque + TX | ✅ |
| Unit of Work | ✅ básico |
| Redis / cache | ❌ |
| RabbitMQ / eventos de domínio | ❌ |
| Idempotency-Key HTTP | ❌ |
| Auth / guards | ❌ |
| OpenAPI | ❌ |
| Filters de erro padronizados | ❌ |
| Testes unitários / integração | ❌ |
| Optimistic locking bem aplicado no estoque | ⚠️ parcial |

### Concorrência (objetivo NestJS)

```terminal
    HTTP Request
        │
        ▼
    Controller
        │
        ▼
    Use Case
        │
        ├──── PostgreSQL  (já)
        │
        ├──── Redis       (próximo)
        │
        └──── Message Broker (próximo)
```

Vamos trabalhar concorrência na criação de pedidos, evitando que duas requisições simultâneas consumam o mesmo estoque.


## Java + Spring Boot - DDD + Hexagonal

Aqui um grau de dificuldade maior no dominio

```terminal
    src/main/java
    └── com.project.order
        ├── domain
        │   ├── model
        │   ├── service
        │   ├── repository
        │   └── event
        │
        ├── application
        │   ├── command
        │   ├── query
        │   └── service
        │
        ├── infrastructure
        │   ├── persistence
        │   ├── messaging
        │   └── configuration
        │
        └── interfaces
            └── rest
```

Aqui o onjetivo será  a orientação a objetos de verdade

```terminal
    Order
    ├── addItem()
    ├── removeItem()
    ├── confirm()
    ├── cancel()
    └── calculateTotal()
```

ao invés de :
```terminal
    order.setStatus(CONFIRMED);
    order.setTotal(...);
    order.setItems(...);
```

queremos :
```terminal
    order.confirm();
```

Tambem iremos ter :

• Aggregate
• Entity
• Value Object
• Domain Service
• Domain Event
• Repository
• Transaction Boundary
• Optimistic Locking
• Pessimistic Locking
• @Transactional
• virtual threads quando fizer sentido
• concorrência em múltiplas requisições

## Python + FastAPI - Event-Driven + CORS

Essa será a API mais orientada a concorrência e processamento assíncrono.
```terminal
                    ┌── PostgreSQL
                    │
    Request ── API ─┼── Redis
                    │
                    └── RabbitMQ
                        │
                        ▼
                    Event Consumer
                        │
                ┌────────┼────────┐
                ▼        ▼        ▼
            Worker    Worker    Worker
```

trabalharemos com muitas funções assincronas, além de:

• async/await
• event loop
• I/O-bound concurrency
• workers
• filas
• retry
• backoff
• dead-letter queue
• idempotência
• correlation ID
• CQRS
• eventos de domínio

Importante: vamos diferenciar concorrência de paralelismo, porque são conceitos diferentes e isso é fundamental para um engenheiro backend.


## O mesmo domínio nas 3 APIs

Para que o treinamento realmente seja comparável, as três APIs compartilham o mesmo modelo de domínio (já alinhado à implementação NestJS):

| Entidade   | Responsabilidade                                      | Campos principais                                                                 |
| ---------- | ----------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Client** | Comprador do pedido                                   | `id`, `name`, `email`, `status` (`active` \| `inactive`), `createdAt`, `updatedAt` |
| **Product**| Catálogo comercial                                    | `id`, `sku`, `name`, `price`, `status` (`active` \| `inactive`)                    |
| **Stock**  | Estoque por produto (concorrência / reservas)         | `productId`, `availableQuantity`, `reservedQuantity`, `version`                    |
| **Order**  | Agregado raiz do pedido                               | `id`, `clientId`, `items`, `status`, `total`, `version`                            |
| **OrderItem** | Item imutável no momento da compra                 | `productId`, `quantity`, `unitPrice`, `subtotal` (= quantity × unitPrice)          |
| **Payment**| Liquidação financeira do pedido                       | `id`, `orderId`, `amount`, `status`, `attempts`, `lastError*`, `gatewayRawResponse` |

Estados do pedido: `pending` → `confirmed` \| `cancelled` (domínio controla as transições).

Estados do pagamento: `pending` → `paid` \| `failed` (também: `authorized`, `cancelled` previstos).

Ciclo de estoque no fluxo atual:

```terminal
    CreateOrder  → stock.reserve()   (available ↓, reserved ↑)
    Payment OK   → stock.consume()   (reserved ↓)
    Payment FAIL → stock.release()   (reserved ↓, available ↑)
    CancelOrder  → stock.release()
```

Regras já no código:

- cliente `inactive` não cria pedido
- produto `inactive` não entra em pedido novo
- reserva exige `availableQuantity >= requestedQuantity`
- preço do item = snapshot no momento da criação do pedido
- payment usa total do order; gateway stub + retry em timeout (até 3x)
- falha de negócio (ex.: cartão negado) **não** faz retry

Fluxo atual:
```terminal
    Client
    │
    ▼
    Criar Order (+ reservar Stock)
    │
    ▼
    POST /payments
    │
    ├─ sucesso → consume Stock + Payment PAID + Order CONFIRMED
    │
    └─ falha   → release Stock + Payment FAILED + Order CANCELLED
    │
    ▼
    Publicar evento   ← ainda NÃO implementado
```

Contrato REST (NestJS já expõe):

```terminal
    Clients
    POST   /clients
    GET    /clients/{id}

    Products
    POST   /products
    GET    /products/{id}

    Stock
    GET    /stock/{productId}
    PUT    /stock/{productId}
    POST   /stock/{productId}/reserve
    POST   /stock/{productId}/release

    Orders
    POST   /orders
    GET    /orders/{id}
    GET    /orders
    POST   /orders/{id}/confirm
    POST   /orders/{id}/cancel

    Payments
    POST   /payments          # body: { "order_id": "..." }
```

Criaremos cenários deliberadamente problemáticos, por exemplo:
```terminal
    100 requisições simultâneas
            │
            ▼
        Product X
        stock.availableQuantity = 10
            │
            ▼
    100 tentativas de compra
```

o que resolveremos:
```terminal
    Race Condition
        ↓
    Lost Update
        ↓
    Overselling
        ↓
    Idempotency
        ↓
    Consistency
```


## O treinamento será incremental

Eu não começaria criando as três APIs completas.

Faria em fases:

Fase 1 — Fundamentos
```terminal
    OOP
    SOLID
    Clean Code
    Design Patterns
    HTTP
    REST
    SQL
    Transactions
```

Fase 2 — API Node/NestJS

```terminal
    Clean Architecture          ✅
    Dependency Injection        ✅
    Repository Pattern          ✅
    Payment + Gateway Port      ✅ (stub)
    Unit Tests                  ❌
    Integration Tests           ❌
    Concurrency hardening       ⚠️ parcial
    Redis                       ❌
    RabbitMQ                    ❌
    Idempotency-Key HTTP        ❌
    OpenAPI                     ❌
```

Fase 3 — API Java/Spring

```terminal
    DDD
    Hexagonal Architecture
    Aggregates
    Value Objects
    Domain Events
    Transactions
    Optimistic Locking
    Concurrency
```

Fase 4 — API Python/FastAPI

```terminal
    asyncio
    async/await
    CQRS
    Event-Driven Architecture
    Workers
    Message Broker
    Idempotency
    Retries
```

Fase 5 — Engenharia distribuída

```terminal
    Docker
    PostgreSQL
    Redis
    RabbitMQ
    OpenTelemetry
    Prometheus
    Grafana
    ELK
    Tracing
    Correlation ID
    Circuit Breaker
    Rate Limiting
```

Fase 6 — Testes de carga

Vamos provocar situações como:

```terminal
    1 usuário
    10 usuários
    100 usuários
    1.000 usuários
    10.000 requisições
```

e comparar:

```terminal
    latência
    throughput
    CPU
    memória
    erros
    concorrência
    tempo de resposta
```


## O ponto mais importante

Cada implementação com a regra:
```terminal
    "Não basta saber fazer funcionar; você precisa saber explicar por que a arquitetura foi construída daquela maneira."
```

Para cada classe, módulo, interface e padrão, vamos responder:
```terminal
    O que é?
    Por que existe?
    Qual responsabilidade possui?
    Por que está neste módulo?
    Por que não está em outro?
    Qual princípio SOLID está sendo aplicado?
    Qual problema arquitetural resolve?
    Qual trade-off introduz?
    Como se comporta sob concorrência?
    Como testar?
    Como evoluir?
```

## Desenho da estrutura

```terminal
                         ┌──────────────────┐
                         │     Client       │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
             ┌────────────┐ ┌────────────┐ ┌────────────┐
             │ NestJS API │ │ Spring API │ │ FastAPI    │
             │            │ │            │ │            │
             │ Clean/Hex  │ │ DDD/Hex    │ │ CQRS/Event │
             └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
                   │              │              │
                   └──────────────┼──────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
               PostgreSQL       Redis       RabbitMQ
```

Cada API terá seu próprio banco lógico/schema (já preparado no `docker-compose` + init SQL), evitando que uma API dependa diretamente das tabelas internas da outra.

