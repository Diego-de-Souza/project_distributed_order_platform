package com.project.order.application.usecase.order;

import com.project.order.application.exception.BusinessRuleException;
import com.project.order.application.exception.ConflictException;
import com.project.order.application.exception.NotFoundException;
import com.project.order.application.port.ClientRepository;
import com.project.order.application.port.EventPublisherRepository;
import com.project.order.application.port.OrderRepository;
import com.project.order.application.port.ProductRepository;
import com.project.order.application.port.StockRepository;
import com.project.order.domain.model.Client;
import com.project.order.domain.model.Order;
import com.project.order.domain.model.OrderItem;
import com.project.order.domain.model.Product;
import com.project.order.domain.model.Stock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Fluxo: valida cliente -> por item, valida produto + reserva estoque ->
 * cria o pedido. Tudo dentro de UMA transação de banco (@Transactional):
 * se qualquer item falhar (produto inativo, estoque insuficiente, conflito
 * de versão), a transação inteira desfaz as reservas já feitas nos itens
 * anteriores. É o Spring cuidando do que, no NestJS, a gente fazia na mão
 * com sequelize.transaction(...).
 */
@Service
public class CreateOrderUseCase {

    private static final Logger log = LoggerFactory.getLogger(CreateOrderUseCase.class);

    private final OrderRepository orderRepository;
    private final ClientRepository clientRepository;
    private final ProductRepository productRepository;
    private final StockRepository stockRepository;
    private final EventPublisherRepository eventPublisher;

    public CreateOrderUseCase(
            OrderRepository orderRepository,
            ClientRepository clientRepository,
            ProductRepository productRepository,
            StockRepository stockRepository,
            EventPublisherRepository eventPublisher
    ) {
        this.orderRepository = orderRepository;
        this.clientRepository = clientRepository;
        this.productRepository = productRepository;
        this.stockRepository = stockRepository;
        this.eventPublisher = eventPublisher;
    }

    public record OrderItemRequest(String productId, int quantity) {}

    @Transactional
    public Order execute(String clientId, List<OrderItemRequest> items) {
        if (items == null || items.isEmpty()) {
            throw new BusinessRuleException("Order must have at least one item");
        }

        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new NotFoundException("Client not found"));
        if (!client.canCreateOrder()) {
            throw new BusinessRuleException("Inactive client cannot create orders");
        }

        Order order = Order.create(clientId);

        for (OrderItemRequest itemRequest : items) {
            Product product = productRepository.findById(itemRequest.productId())
                    .orElseThrow(() -> new NotFoundException("Product not found: " + itemRequest.productId()));
            if (!product.canBeOrdered()) {
                throw new BusinessRuleException("Product inactive: " + itemRequest.productId());
            }

            Stock stock = stockRepository.findById(itemRequest.productId())
                    .orElseThrow(() -> new NotFoundException("Stock not found: " + itemRequest.productId()));

            try {
                stock.reserve(itemRequest.quantity());
            } catch (IllegalArgumentException e) {
                throw new BusinessRuleException(e.getMessage());
            }

            try {
                stockRepository.update(stock);
            } catch (OptimisticLockingFailureException e) {
                throw new ConflictException("Stock was modified by another request, retry");
            }

            order.addItem(new OrderItem(itemRequest.productId(), itemRequest.quantity(), product.getPrice()));
            publishQuietly(() -> eventPublisher.publishStockReserved(stock), "StockReserved", stock.getProductId());
        }

        Order created = orderRepository.create(order);
        publishQuietly(() -> eventPublisher.publishCreatedOrder(created), "OrderCreated", created.getId());

        return created;
    }

    private void publishQuietly(Runnable action, String eventName, String subjectId) {
        try {
            action.run();
        } catch (Exception e) {
            log.error("Failed to publish {} for {}", eventName, subjectId, e);
        }
    }
}
