import { StockEntity } from "src/domain/entities/stock.entity";

export function toStockResponse(stock: StockEntity) {
    return {
        productId: stock.getProductId(),
        availableQuantity: stock.getAvailableQuantity(),
        reservedQuantity: stock.getReservedQuantity(),
        version: stock.getVersion(),
    };
}
