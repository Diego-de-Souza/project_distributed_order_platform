package com.project.order.infrastructure.persistence.adapter;

import com.project.order.application.exception.NotFoundException;
import com.project.order.application.port.OrderRepository;
import com.project.order.domain.model.Money;
import com.project.order.domain.model.Order;
import com.project.order.domain.model.OrderItem;
import com.project.order.infrastructure.persistence.entity.OrderItemEmbeddable;
import com.project.order.infrastructure.persistence.entity.OrderJpaEntity;
import com.project.order.infrastructure.persistence.repository.OrderJpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class OrderRepositoryAdapter implements OrderRepository {

    private final OrderJpaRepository jpaRepository;

    public OrderRepositoryAdapter(OrderJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Order create(Order order) {
        OrderJpaEntity saved = jpaRepository.save(new OrderJpaEntity(
                order.getId(), order.getClientId(), order.getStatus(), order.getTotal().getValue(),
                order.getPaymentErrorCode(), order.getPaymentErrorMessage(), toEmbeddables(order)
        ));
        return toDomain(saved);
    }

    @Override
    public Optional<Order> findById(String id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public List<Order> findAll() {
        return jpaRepository.findAll().stream().map(this::toDomain).toList();
    }

    // Mesmo raciocínio do Stock: recarrega a entidade gerenciada e só
    // atualiza os campos mutáveis, pra o @Version comparar a versão certa.
    @Override
    public Order update(Order order) {
        OrderJpaEntity entity = jpaRepository.findById(order.getId())
                .orElseThrow(() -> new NotFoundException("Order not found: " + order.getId()));
        entity.setStatus(order.getStatus());
        entity.setTotal(order.getTotal().getValue());
        entity.setPaymentErrorCode(order.getPaymentErrorCode());
        entity.setPaymentErrorMessage(order.getPaymentErrorMessage());
        entity.setItems(toEmbeddables(order));
        return toDomain(jpaRepository.save(entity));
    }

    @Override
    public void delete(String id) {
        jpaRepository.deleteById(id);
    }

    private List<OrderItemEmbeddable> toEmbeddables(Order order) {
        return order.getItems().stream()
                .map(item -> new OrderItemEmbeddable(item.getProductId(), item.getQuantity(), item.getUnitPrice().getValue()))
                .toList();
    }

    private Order toDomain(OrderJpaEntity entity) {
        List<OrderItem> items = entity.getItems().stream()
                .map(i -> new OrderItem(i.getProductId(), i.getQuantity(), new Money(i.getUnitPrice())))
                .collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));
        return new Order(entity.getId(), entity.getClientId(), items, entity.getStatus(),
                new Money(entity.getTotal()), entity.getPaymentErrorCode(), entity.getPaymentErrorMessage(), entity.getVersion());
    }
}
