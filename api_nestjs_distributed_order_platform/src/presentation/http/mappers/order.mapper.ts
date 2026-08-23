import { OrderEntity } from "src/domain/entities/order.entity";

export function toOrderResponse(order: OrderEntity) {
    return {
        id: order.getId(),
        clientId: order.getClientId(),
        status: order.getStatus(),
        total: order.getTotal(),
        version: order.getVersion(),
        items: order.getItems().map((item) => ({
            productId: item.getProductId(),
            quantity: item.getQuantity(),
            unitPrice: item.getUnitPrice(),
            subtotal: item.getSubTotal(),
        })),
    };
}
