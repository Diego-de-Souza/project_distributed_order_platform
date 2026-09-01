import { OrderEntity } from "src/domain/entities/order.entity";
import { PaymentEntity } from "src/domain/entities/payment.entity";
import { StockEntity } from "src/domain/entities/stock.entity";


export interface EventPublisherRepositoryInterface {
    publishCreatedOrder(order: OrderEntity): Promise<void>;
    publishConfirmedOrder(order: OrderEntity): Promise<void>;
    publishCancelledOrder(order: OrderEntity): Promise<void>;
    publishPaymentPaid(payment: PaymentEntity): Promise<void>;
    publishPaymentFailed(payment: PaymentEntity): Promise<void>;
    publishStockReserved(stock: StockEntity): Promise<void>;
    publishStockReleased(stock: StockEntity): Promise<void>;
    publishStockConsumed(stock: StockEntity): Promise<void>;
}