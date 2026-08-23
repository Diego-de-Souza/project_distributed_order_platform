import { StatusOrder } from "src/shared/enums/status-order.enum";
import { OrderItemEntity } from "./order-item.entity";

export class OrderEntity {
    private status: StatusOrder;
    private total: number;
    private items: OrderItemEntity[];

    constructor(
        private readonly clientId: string,
        private readonly id?: string,
        items?: OrderItemEntity[],
        status?: StatusOrder,
        total?: number,
        private readonly version: number = 0,
    ) {
        if (!clientId) {
            throw new Error('Client ID is required');
        }

        this.items = items ? [...items] : [];
        this.status = status ?? StatusOrder.PENDING;
        this.total = total ?? 0;

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

    addItem(item: OrderItemEntity): void {
        this.items.push(item);
        this.calculateTotal();
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
    }

    confirmOrder(): void {
        if (this.status !== StatusOrder.PENDING) {
            throw new Error('Order must be in pending status to be confirmed');
        }

        this.status = StatusOrder.CONFIRMED;
    }

    cancelOrder(): void {
        if (this.status !== StatusOrder.PENDING) {
            throw new Error('Order must be in pending status to be cancelled');
        }

        this.status = StatusOrder.CANCELLED;
    }

    private calculateTotal(): void {
        this.total = this.items.reduce(
            (sum, item) => sum + item.getSubTotal(),
            0,
        );
    }
}
