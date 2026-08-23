export class OrderItemEntity {
    constructor(
        private readonly productId: string,
        private readonly quantity: number,
        private readonly unitPrice: number,
    ){
        if(!productId){
            throw new Error('Product ID is required');
        }
        if(quantity <= 0){
            throw new Error('Quantity must be greater than 0');
        }
        if(unitPrice <= 0){
            throw new Error('Unit price must be greater than 0');
        }
    }

    getSubTotal(): number {
        return this.quantity * this.unitPrice;
    }

    getProductId(): string {
        return this.productId;
    }

    getQuantity(): number {
        return this.quantity;
    }

    getUnitPrice(): number {
        return this.unitPrice;
    }
}