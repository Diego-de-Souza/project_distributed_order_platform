import { Inject } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { lastValueFrom } from "rxjs";
import { EventPublisherRepositoryInterface } from "src/application/port/event-publisher.repository";
import { OrderEntity } from "src/domain/entities/order.entity";
import { PaymentEntity } from "src/domain/entities/payment.entity";
import { StockEntity } from "src/domain/entities/stock.entity";
import { RABBITMQ_CLIENT } from "src/shared/tokens_nest/rabbitmq.token";


export class RabbitMQEventPublisher implements EventPublisherRepositoryInterface {
    constructor(
        @Inject(RABBITMQ_CLIENT) private readonly client: ClientProxy,
    ){}

    publishCreatedOrder(order: OrderEntity): Promise<void> {
        return lastValueFrom(this.client.emit('order.created', order));
    }
    publishConfirmedOrder(order: OrderEntity): Promise<void> {
        return lastValueFrom(this.client.emit('order.confirmed', order));
    }
    publishCancelledOrder(order: OrderEntity): Promise<void> {
        return lastValueFrom(this.client.emit('order.cancelled', order));
    }
    publishPaymentPaid(payment: PaymentEntity): Promise<void> {
        return lastValueFrom(this.client.emit('payment.paid', payment));
    }
    publishPaymentFailed(payment: PaymentEntity): Promise<void> {
        return lastValueFrom(this.client.emit('payment.failed', payment));
    }
    publishStockReserved(stock: StockEntity): Promise<void> {
        return lastValueFrom(this.client.emit('stock.reserved', stock));
    }
    publishStockReleased(stock: StockEntity): Promise<void> {
        return lastValueFrom(this.client.emit('stock.released', stock));
    }
    publishStockConsumed(stock: StockEntity): Promise<void> {
        return lastValueFrom(this.client.emit('stock.consumed', stock));
    }
}