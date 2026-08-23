import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/sequelize";
import { Sequelize, Transaction } from "sequelize";
import type { OrderRepositoryInterface } from "src/application/port/order.repository";
import type { PaymentRepositoryInterface } from "src/application/port/payment.repository";
import type { StockRepositoryInterface } from "src/application/port/stock.repository";
import type { UnitOfWorkInterface } from "src/application/port/unit-of-work.respository";
import { OrderRepository } from "./order-repository";
import { PaymentRepository } from "./payment-repository";
import { StockRepository } from "./stock-repository";

@Injectable()
export class SequelizeUnitOfWork implements UnitOfWorkInterface {
    private transaction: Transaction | null = null;

    constructor(
        @InjectConnection()
        private readonly sequelize: Sequelize,
        private readonly paymentRepo: PaymentRepository,
        private readonly orderRepo: OrderRepository,
        private readonly stockRepo: StockRepository,
    ) {}

    async begin(): Promise<void> {
        if (this.transaction) {
            throw new Error('Transaction already started');
        }
        this.transaction = await this.sequelize.transaction();
    }

    async commit(): Promise<void> {
        if (!this.transaction) {
            throw new Error('No transaction started');
        }
        await this.transaction.commit();
        this.transaction = null;
    }

    async rollback(): Promise<void> {
        if (!this.transaction) {
            throw new Error('No transaction started');
        }
        await this.transaction.rollback();
        this.transaction = null;
    }

    getTransaction(): Transaction | null {
        return this.transaction;
    }

    getPaymentRepository(): PaymentRepositoryInterface {
        return this.paymentRepo;
    }

    getOrderRepository(): OrderRepositoryInterface {
        return this.orderRepo;
    }

    getStockRepository(): StockRepositoryInterface {
        return this.stockRepo;
    }
}
