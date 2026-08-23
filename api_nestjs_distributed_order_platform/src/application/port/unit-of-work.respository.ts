import type { OrderRepositoryInterface } from "./order.repository";
import type { PaymentRepositoryInterface } from "./payment.repository";
import type { StockRepositoryInterface } from "./stock.repository";
import { Transaction } from "sequelize";

export interface UnitOfWorkInterface {
    begin(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    getTransaction(): Transaction | null;

    getPaymentRepository(): PaymentRepositoryInterface;
    getOrderRepository(): OrderRepositoryInterface;
    getStockRepository(): StockRepositoryInterface;
}
