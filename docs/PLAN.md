# Domínio

O domínio será Order Management.

obs.: não vou me aprofundar no trabalho de categorização dos relacionamentos e nem refinamento, eles serão implicitos na codificação.

Principais agregados (alinhados à API NestJS):
```terminal
    Client
    Product
    Stock
    Order
    Payment   (fase posterior)
```

Relacionamentos:
```terminal
    Client
    │
    └── Order
            │
            ├── OrderItem ─── Product
            │
            └── Payment


    Product
    │
    └── Stock
```

# Regras de negócio

Vamos estabelecer regras explícitas.

Cliente (Client)

Um cliente possui:
```terminal
    id
    name
    email
    status
    createdAt
    updatedAt
```

Estados:
```terminal
    ACTIVE
    INACTIVE
```

Um cliente inactive não pode criar pedidos.

Produto
```terminal
    id
    sku
    name
    price
    status
```

Estados:
```terminal
    ACTIVE
    INACTIVE
```

Produtos inativos não podem ser adicionados a novos pedidos.

Estoque (Stock)
```terminal
    productId
    availableQuantity
    reservedQuantity
    version
```

Uma reserva precisa obedecer:
```terminal
    availableQuantity >= requestedQuantity
```

Esse será um dos nossos principais pontos de estudo de concorrência.

# Pedido (Order)

O pedido terá:
```terminal
    id
    clientId
    items
    status
    total
    createdAt
    updatedAt
    version
```

Estados:
```terminal
    PENDING
    CONFIRMED
    CANCELLED
```

Transições válidas:
```terminal
    PENDING ──────► CONFIRMED
    │
    └──────────► CANCELLED
```

Não permitiremos:
```terminal
    CONFIRMED → PENDING
    CONFIRMED → CANCELLED
    CANCELLED → CONFIRMED
```

Isso é proposital.

O estado não será simplesmente um campo que qualquer camada pode modificar.

O próprio domínio deverá controlar suas transições.

# OrderItem
```terminal
    id
    productId
    quantity
    unitPrice
    subtotal
```

A regra:
```terminal
    subtotal = quantity × unitPrice
```

O preço utilizado no pedido será o preço registrado no momento da criação.

Isso evita que uma alteração posterior no produto modifique pedidos históricos.

# Casos de uso

A primeira versão terá:
```terminal
    CreateClient
    GetClient
    CreateProduct
    GetProduct
    UpdateStock
    GetStock
    ReserveStock
    ReleaseStock


    CreateOrder
    GetOrder
    ListOrders


    ConfirmOrder
    CancelOrder
```

Posteriormente:
```terminal
    ProcessPayment
    RefundPayment
```

# API REST

Teremos contratos semelhantes nas três implementações.
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
```

# Exemplo de criação de pedido

Request:
```bash
    {
    "clientId": "client-123",
    "items": [
        {
        "productId": "product-001",
        "quantity": 2
        },
        {
        "productId": "product-002",
        "quantity": 1
        }
    ]
    }
```

O fluxo conceitual será:
```terminal
    POST /orders
        │
        ▼
    Validar Client
        │
        ▼
    Validar Products
        │
        ▼
    Consultar preços
        │
        ▼
    Reservar Stock
        │
        ▼
    Criar Order
        │
        ▼
    Persistir
        │
        ▼
    Publicar OrderCreated
```

# Primeiro grande problema: concorrência

Imagine:

Estoque = 1

Chegam simultaneamente:

Request A → comprar 1
Request B → comprar 1

Sem controle:

A lê estoque = 1
B lê estoque = 1


A reserva
B reserva


Resultado:
estoque = -1

Isso caracteriza uma race condition.

Vamos implementar soluções diferentes nas APIs para treinar os trade-offs.

NestJS

Vamos ver:
```terminal
    Database transaction
    +
    Optimistic Locking
    +
    Redis
```

Spring Boot

Vamos ver principalmente:
```terminal
    @Transactional
    +
    Optimistic Locking
    +
    Pessimistic Locking
```

FastAPI

Vamos ver:
```terminal
    Async processing
    +
    Message Broker
    +
    Idempotency
    +
    Distributed coordination
```

O objetivo não será simplesmente escolher "a melhor".

Aqui treinamos o entender quando cada abordagem é adequada.

# Idempotência

Outro requisito importante.

Imagine:

POST /orders

O cliente envia a requisição.

O servidor cria o pedido.

Mas a resposta não chega ao cliente.

O cliente envia novamente.

Sem idempotência:

Pedido 1
Pedido 2

Com uma chave:

Idempotency-Key: 8f73c...

podemos associar a operação à chave e tratar uma repetição como a mesma operação.

Esse conceito será obrigatório no projeto.

# Mensageria

Vamos utilizar eventos.

Exemplo:
```terminal
    OrderCreated
    OrderConfirmed
    OrderCancelled
    InventoryReserved
    InventoryReleased
    PaymentProcessed
```

Fluxo:
```terminal
    Order Service
        │
        │ OrderCreated
        ▼
    RabbitMQ
        │
        ├──────────────► Inventory Consumer
        │
        ├──────────────► Payment Consumer
        │
        └──────────────► Notification Consumer
```

Isso vai permitir treinar event-driven architecture e desacoplamento.

# Persistência

Inicialmente:

PostgreSQL

Cada implementação poderá utilizar seu próprio mecanismo:
```terminal
    NestJS
    └── TypeORM ou Prisma


    Spring Boot
    └── Spring Data JPA / Hibernate


    FastAPI
    └── SQLAlchemy
```

Mas existe uma regra pedagógica importante:

não vamos esconder SQL e banco atrás do framework.

Relembrando e consolinando um poujco de:
```terminal
    Index
    Primary Key
    Foreign Key
    Unique Constraint
    Transaction
    Isolation Level
    Lock
    Deadlock
    Query Plan
```

# Arquitetura da primeira API

Começaremos pela NestJS.

A arquitetura será:
```terminal
                 Presentation
                      │
                      ▼
                Application
                      │
                      ▼
                   Domain
                      ▲
                      │
               Infrastructure
```

A dependência deve apontar para dentro:

Presentation ─────► Application
Infrastructure ───► Application
Application ──────► Domain
Domain ───────────► NOTHING

Esse último ponto é fundamental.

O domínio não deve saber que existe:

NestJS
PostgreSQL
Redis
RabbitMQ
HTTP
TypeORM
14. Primeira estrutura do projeto
order-platform/
│
├── apps/
│   ├── nest-api/
│   ├── spring-api/
│   └── fastapi/
│
├── infrastructure/
│   ├── postgres/
│   ├── redis/
│   └── rabbitmq/
│
├── docs/
│   ├── architecture/
│   ├── api/
│   └── decisions/
│
└── docker-compose.yml

E dentro da NestJS:

nest-api/
└── src/
    ├── domain/
    │   ├── entities/
    │   ├── value-objects/
    │   ├── repositories/
    │   └── services/
    │
    ├── application/
    │   ├── use-cases/
    │   ├── dto/
    │   └── ports/
    │
    ├── infrastructure/
    │   ├── persistence/
    │   ├── messaging/
    │   └── cache/
    │
    └── presentation/
        ├── controllers/
        ├── guards/
        ├── filters/
        └── interceptors/
15. Nossa primeira tarefa prática

Antes de implementar qualquer endpoint, vamos construir a camada Domain da NestJS.

A sequência será:

1. Entity
      ↓
2. Value Objects
      ↓
3. Domain Rules
      ↓
4. Repository Contracts
      ↓
5. Use Cases
      ↓
6. Infrastructure
      ↓
7. REST
      ↓
8. Tests
      ↓
9. Concurrency

E eu sugiro uma regra para o treinamento: cada etapa terá uma explicação arquitetural antes do código, incluindo o problema que estamos resolvendo, alternativas rejeitadas, princípio SOLID envolvido, trade-offs e como testar.