export class UpdateStockDto {
    availableQuantity!: number;
    reservedQuantity?: number;
}

export class StockQuantityDto {
    quantity!: number;
}