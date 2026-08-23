import { StatusProduct } from "src/shared/enums/status-product.enum";

export class ProductEntity {
    private readonly status: StatusProduct;

    constructor(
        private readonly sku: string,
        private readonly name: string,
        private readonly price: number,
        status?: StatusProduct,
        private readonly id?: string,
    ) {
        if (!sku) {
            throw new Error('SKU is required');
        }
        if (!name) {
            throw new Error('Name is required');
        }
        if (price <= 0) {
            throw new Error('Price must be greater than 0');
        }

        this.status = status ?? StatusProduct.ACTIVE;
    }

    getId(): string {
        return this.id ?? '';
    }

    getSku(): string {
        return this.sku;
    }

    getName(): string {
        return this.name;
    }

    getPrice(): number {
        return this.price;
    }

    getStatus(): StatusProduct {
        return this.status;
    }

    canBeOrdered(): boolean {
        return this.status === StatusProduct.ACTIVE;
    }
}
