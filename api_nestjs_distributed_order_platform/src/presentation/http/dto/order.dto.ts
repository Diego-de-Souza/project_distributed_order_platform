export class CreateOrderItemDto {
    productId!: string;
    quantity!: number;
}

export class CreateOrderDto {
    clientId!: string;
    items!: CreateOrderItemDto[];
}