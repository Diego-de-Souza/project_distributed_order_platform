import { StatusOrder } from "src/shared/enums/status-order.enum";
import { OrderItemEntity } from "./order-item.entity";

export class OrderEntity {
    private status: StatusOrder;
    private total: number;
    private items: OrderItemEntity[];
    private paymentErrorCode: string | null = null;
    private paymentErrorMessage: string | null = null;
    private version: number;

    constructor(
        private readonly clientId: string,
        private readonly id?: string,
        items?: OrderItemEntity[],
        status?: StatusOrder,
        total?: number,
        version: number = 0,
    ) {
        if (!clientId) {
            throw new Error('Client ID is required');
        }
        if (version < 0) {
            throw new Error('Version must be greater than or equal to 0');
        }

        this.items = items ? [...items] : [];
        this.status = status ?? StatusOrder.PENDING;
        this.total = total ?? 0;
        this.version = version;

        if (this.items.length > 0 && total === undefined) {
            this.calculateTotal();
        }
    }

    getId(): string {
        return this.id ?? '';
    }

    getClientId(): string {
        return this.clientId;
    }

    getItems(): OrderItemEntity[] {
        return [...this.items];
    }

    getTotal(): number {
        return this.total;
    }

    getStatus(): StatusOrder {
        return this.status;
    }

    getVersion(): number {
        return this.version;
    }

    getPaymentErrorCode(): string | null {
        return this.paymentErrorCode;
    }

    getPaymentErrorMessage(): string | null {
        return this.paymentErrorMessage;
    }

    addItem(item: OrderItemEntity): void {
        this.items.push(item);
        this.calculateTotal();
        this.version += 1;
    }

    removeItem(productId: string): void {
        const index = this.items.findIndex(
            (item) => item.getProductId() === productId,
        );

        if (index === -1) {
            throw new Error('Item not found in order');
        }

        this.items.splice(index, 1);
        this.calculateTotal();
        this.version += 1;
    }

    confirmOrder(): void {
        if (this.status !== StatusOrder.PENDING) {
            throw new Error('Order must be in pending status to be confirmed');
        }

        this.status = StatusOrder.CONFIRMED;
        this.paymentErrorCode = null;
        this.paymentErrorMessage = null;
        this.version += 1;
    }

    cancelOrder(): void {
        if (this.status !== StatusOrder.PENDING) {
            throw new Error('Order must be in pending status to be cancelled');
        }

        this.status = StatusOrder.CANCELLED;
        this.version += 1;
    }

    registerPaymentFailure(code: string, message: string): void {
        if (this.status !== StatusOrder.PENDING) {
            throw new Error('Order must be in pending status to register payment failure');
        }

        this.paymentErrorCode = code;
        this.paymentErrorMessage = message;
        this.status = StatusOrder.CANCELLED;
        this.version += 1;
    }

    private calculateTotal(): void {
        this.total = this.items.reduce(
            (sum, item) => sum + item.getSubTotal(),
            0,
        );
    }
}
