package com.project.order.application.usecase.support;

import com.project.order.application.port.ClientRepository;
import com.project.order.application.port.EventPublisherRepository;
import com.project.order.application.port.OrderRepository;
import com.project.order.application.port.ProductRepository;
import com.project.order.application.port.StockRepository;
import com.project.order.domain.model.Client;
import com.project.order.domain.model.Order;
import com.project.order.domain.model.Payment;
import com.project.order.domain.model.Product;
import com.project.order.domain.model.Stock;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Fakes em memória dos ports, só pra testar os casos de uso sem precisar
 * de Mockito nem de banco de verdade. Cada um guarda tudo num Map — dá pra
 * simular exatamente o mesmo contrato (Optional em vez de null, etc) que
 * o adapter JPA de verdade respeita.
 */
public class InMemoryFakes {

    public static class FakeClientRepository implements ClientRepository {
        public final Map<String, Client> data = new LinkedHashMap<>();
        public Client create(Client c) { data.put(c.getId(), c); return c; }
        public Optional<Client> findById(String id) { return Optional.ofNullable(data.get(id)); }
        public List<Client> findAll() { return List.copyOf(data.values()); }
        public Client update(Client c) { data.put(c.getId(), c); return c; }
        public void delete(String id) { data.remove(id); }
    }

    public static class FakeProductRepository implements ProductRepository {
        public final Map<String, Product> data = new LinkedHashMap<>();
        public Product create(Product p) { data.put(p.getId(), p); return p; }
        public Optional<Product> findById(String id) { return Optional.ofNullable(data.get(id)); }
        public Optional<Product> findBySku(String sku) {
            return data.values().stream().filter(p -> p.getSku().equals(sku)).findFirst();
        }
        public List<Product> findAll() { return List.copyOf(data.values()); }
        public Product update(Product p) { data.put(p.getId(), p); return p; }
        public void delete(String id) { data.remove(id); }
    }

    public static class FakeStockRepository implements StockRepository {
        public final Map<String, Stock> data = new LinkedHashMap<>();
        public Stock create(Stock s) { data.put(s.getProductId(), s); return s; }
        public Optional<Stock> findById(String productId) { return Optional.ofNullable(data.get(productId)); }
        public List<Stock> findAll() { return List.copyOf(data.values()); }
        public Stock update(Stock s) { data.put(s.getProductId(), s); return s; }
        public void delete(String productId) { data.remove(productId); }
    }

    public static class FakeOrderRepository implements OrderRepository {
        public final Map<String, Order> data = new LinkedHashMap<>();
        public Order create(Order o) { data.put(o.getId(), o); return o; }
        public Optional<Order> findById(String id) { return Optional.ofNullable(data.get(id)); }
        public List<Order> findAll() { return List.copyOf(data.values()); }
        public Order update(Order o) { data.put(o.getId(), o); return o; }
        public void delete(String id) { data.remove(id); }
    }

    public static class NoOpEventPublisher implements EventPublisherRepository {
        public void publishCreatedOrder(Order order) {}
        public void publishConfirmedOrder(Order order) {}
        public void publishCancelledOrder(Order order) {}
        public void publishPaymentPaid(Payment payment) {}
        public void publishPaymentFailed(Payment payment) {}
        public void publishStockReserved(Stock stock) {}
        public void publishStockReleased(Stock stock) {}
        public void publishStockConsumed(Stock stock) {}
    }
}
