import {
    BadRequestException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
} from "@nestjs/common";
import type { EventPublisherRepositoryInterface } from "src/application/port/event-publisher.repository";
import type { OrderRepositoryInterface } from "src/application/port/order.repository";
import type { PaymentGatewayInterface } from "src/application/port/payment-gateway.repository";
import type { PaymentRepositoryInterface } from "src/application/port/payment.repository";
import type { UnitOfWorkInterface } from "src/application/port/unit-of-work.respository";
import { PaymentEntity } from "src/domain/entities/payment.entity";
import { StockEntity } from "src/domain/entities/stock.entity";
import { StatusOrder } from "src/shared/enums/status-order.enum";
import type { GatewayResult } from "src/shared/interfaces/gateway.interface";
import type { PaymentCreateAttributes } from "src/shared/interfaces/payment.interface";
import { GATEWAY_REPOSITORY } from "src/shared/tokens_nest/gateway.token";
import { ORDER_REPOSITORY } from "src/shared/tokens_nest/order.token";
import {
    PAYMENT_REPOSITORY,
    UNIT_OF_WORK_REPOSITORY,
} from "src/shared/tokens_nest/payment.token";
import { EVENT_PUBLISHER } from "src/shared/tokens_nest/rabbitmq.token";

const MAX_RETRIES = 3;

@Injectable()
export class CreatePaymentUseCase {
    private readonly logger = new Logger(CreatePaymentUseCase.name);

    constructor(
        @Inject(PAYMENT_REPOSITORY)
        private readonly paymentRepository: PaymentRepositoryInterface,
        @Inject(ORDER_REPOSITORY)
        private readonly orderRepository: OrderRepositoryInterface,
        @Inject(UNIT_OF_WORK_REPOSITORY)
        private readonly uow: UnitOfWorkInterface,
        @Inject(GATEWAY_REPOSITORY)
        private readonly gateway: PaymentGatewayInterface,
        @Inject(EVENT_PUBLISHER)
        private readonly eventPublisher: EventPublisherRepositoryInterface,
    ) {}

    async execute(input: PaymentCreateAttributes): Promise<PaymentEntity> {
        const order = await this.orderRepository.findById(input.order_id);
        if (!order) {
            throw new NotFoundException('Order not found');
        }
        if (order.getStatus() !== StatusOrder.PENDING) {
            throw new BadRequestException('Order is not pending');
        }
        if (order.getItems().length === 0) {
            throw new BadRequestException('Order has no items');
        }
        if (
            input.amount !== undefined &&
            Number(input.amount) !== order.getTotal()
        ) {
            throw new BadRequestException(
                'Payment amount does not match order total',
            );
        }

        const payment = await this.paymentRepository.createPayment(
            new PaymentEntity(order.getId(), order.getTotal()),
        );
        const idempotencyKey = payment.getId();

        // Gateway FORA da TX — estoque permanece reservado até o resultado
        const gatewayResult = await this.chargeWithRetry(payment, idempotencyKey);

        await this.uow.begin();
        try {
            const tx = this.uow.getTransaction()!;

            if (gatewayResult.success) {
                for (const item of order.getItems()) {
                    const stock = await this.uow
                        .getStockRepository()
                        .findByProductId(item.getProductId(), tx);
                    if (!stock) {
                        throw new NotFoundException(
                            `Stock not found for product ${item.getProductId()}`,
                        );
                    }
                    stock.consume(item.getQuantity());
                    await this.uow
                        .getStockRepository()
                        .update(stock, undefined, tx);

                    try{
                        await this.eventPublisher.publishStockConsumed(stock);
                    }catch(error){
                        this.logger.error(
                            `Failed to publish StockConsumed for product ${item.getProductId()}`,
                            error instanceof Error ? error.stack : String(error),
                        );
                    }
                }

                payment.markAsPaid(
                    gatewayResult.externalId ?? idempotencyKey,
                    gatewayResult.raw,
                );
                order.confirmOrder();
                
            } else {
                const code = gatewayResult.errorCode ?? 'GATEWAY_ERROR';
                const message =
                    gatewayResult.errorMessage ?? 'Payment failed';

                payment.markAsFailed(code, message, gatewayResult.raw);
                order.registerPaymentFailure(code, message);

                for (const item of order.getItems()) {
                    const stock = await this.uow
                        .getStockRepository()
                        .release(item.getProductId(), item.getQuantity(), tx);
                    
                    try{
                        await this.eventPublisher.publishStockReleased(stock);
                    }catch(error){
                        this.logger.error(
                            `Failed to publish StockReleased for product ${item.getProductId()}`,
                            error instanceof Error ? error.stack : String(error),
                        );
                    }
                }
            }

            await this.uow.getPaymentRepository().updatePayment(payment, tx);
            await this.uow.getOrderRepository().update(order, tx);
            await this.uow.commit();
        } catch (error) {
            await this.safeRollback();
            try{
                await this.eventPublisher.publishPaymentFailed(payment);
            }catch(error){
                this.logger.error(
                    `Failed to publish PaymentFailed for payment ${payment.getId()}`,
                    error instanceof Error ? error.stack : String(error),
                );
            }
            throw error;
        }

        try{
            gatewayResult.success? await this.eventPublisher.publishPaymentPaid(payment) : await this.eventPublisher.publishPaymentFailed(payment);
        }catch(error){
            this.logger.error(
                `Failed to publish PaymentPaid for payment ${payment.getId()}`,
                error instanceof Error ? error.stack : String(error),
            );
        }
        
        return payment;
    }

    private async chargeWithRetry(
        payment: PaymentEntity,
        idempotencyKey: string,
    ): Promise<GatewayResult> {
        try {
            const result = await this.gateway.createCharge({
                paymentId: payment.getId(),
                orderId: payment.getOrderId(),
                amount: payment.getAmount(),
                idempotencyKey,
            });

            if (result.success || result.kind === 'BUSINESS') {
                return result;
            }

            return this.retryRetrieve(idempotencyKey);
        } catch (error) {
            if (!this.isRetriable(error)) {
                return {
                    success: false,
                    kind: 'BUSINESS',
                    status: 'failed',
                    errorCode: 'PAYMENT_REJECTED',
                    errorMessage:
                        error instanceof Error
                            ? error.message
                            : 'Payment rejected',
                    raw: error,
                };
            }

            return this.retryRetrieve(idempotencyKey);
        }
    }

    private async retryRetrieve(idempotencyKey: string): Promise<GatewayResult> {
        let lastResult: GatewayResult = {
            success: false,
            kind: 'RETRIABLE',
            status: 'pending',
            errorCode: 'GATEWAY_UNAVAILABLE',
            errorMessage: 'Gateway unavailable after retries',
        };

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            await this.sleep(attempt * 500);

            try {
                lastResult = await this.gateway.retrieveCharge({
                    idempotencyKey,
                });

                if (lastResult.success || lastResult.kind === 'BUSINESS') {
                    return lastResult;
                }
            } catch (error) {
                lastResult = {
                    success: false,
                    kind: this.isRetriable(error) ? 'RETRIABLE' : 'BUSINESS',
                    status: 'failed',
                    errorCode: this.isRetriable(error)
                        ? 'GATEWAY_UNAVAILABLE'
                        : 'PAYMENT_REJECTED',
                    errorMessage:
                        error instanceof Error
                            ? error.message
                            : 'Gateway error',
                    raw: error,
                };

                if (!this.isRetriable(error)) {
                    return lastResult;
                }
            }
        }

        return lastResult;
    }

    private isRetriable(error: unknown): boolean {
        if (!(error instanceof Error)) {
            return true;
        }

        const message = error.message.toLowerCase();
        const retriableHints = [
            'etimedout',
            'econnreset',
            'enotfound',
            'timeout',
            'socket',
            'network',
            '502',
            '503',
            '504',
        ];

        return retriableHints.some((hint) => message.includes(hint));
    }

    private async safeRollback(): Promise<void> {
        try {
            if (this.uow.getTransaction()) {
                await this.uow.rollback();
            }
        } catch {
            // ignore
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
