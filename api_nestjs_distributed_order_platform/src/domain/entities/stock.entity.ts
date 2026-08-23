export class StockEntity {
    private availableQuantity: number;
    private reservedQuantity: number;
    private version: number;

    constructor(
        private readonly productId: string,
        availableQuantity: number,
        reservedQuantity: number,
        version: number = 0,
    ) {
        if (!productId) {
            throw new Error('Product ID is required');
        }
        if (availableQuantity < 0) {
            throw new Error('Available quantity must be greater than or equal to 0');
        }
        if (reservedQuantity < 0) {
            throw new Error('Reserved quantity must be greater than or equal to 0');
        }
        if (version < 0) {
            throw new Error('Version must be greater than or equal to 0');
        }

        this.availableQuantity = availableQuantity;
        this.reservedQuantity = reservedQuantity;
        this.version = version;
    }

    getProductId(): string {
        return this.productId;
    }

    getAvailableQuantity(): number {
        return this.availableQuantity;
    }

    getReservedQuantity(): number {
        return this.reservedQuantity;
    }

    getVersion(): number {
        return this.version;
    }

    reserve(quantity: number): void {
        if (quantity <= 0) {
            throw new Error('Quantity must be greater than 0');
        }
        if (this.availableQuantity < quantity) {
            throw new Error('Insufficient stock available');
        }

        this.availableQuantity -= quantity;
        this.reservedQuantity += quantity;
        this.version += 1;
    }

    release(quantity: number): void {
        if (quantity <= 0) {
            throw new Error('Quantity must be greater than 0');
        }
        if (this.reservedQuantity < quantity) {
            throw new Error('Insufficient reserved stock to release');
        }

        this.reservedQuantity -= quantity;
        this.availableQuantity += quantity;
        this.version += 1;
    }

    /** Consome reserva após pagamento aprovado (reserved ↓). */
    consume(quantity: number): void {
        if (quantity <= 0) {
            throw new Error('Quantity must be greater than 0');
        }
        if (this.reservedQuantity < quantity) {
            throw new Error('Insufficient reserved stock');
        }

        this.reservedQuantity -= quantity;
        this.version += 1;
    }

    setQuantities(availableQuantity: number, reservedQuantity: number): void {
        if (availableQuantity < 0 || reservedQuantity < 0) {
            throw new Error('Quantities must be greater than or equal to 0');
        }

        this.availableQuantity = availableQuantity;
        this.reservedQuantity = reservedQuantity;
        this.version += 1;
    }
}
