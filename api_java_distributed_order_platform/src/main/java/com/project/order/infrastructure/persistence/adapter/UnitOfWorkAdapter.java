package com.project.order.infrastructure.persistence.adapter;

import com.project.order.application.port.OrderRepository;
import com.project.order.application.port.PaymentRepository;
import com.project.order.application.port.StockRepository;
import com.project.order.application.port.UnitOfWorkRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.DefaultTransactionDefinition;

/**
 * Contraponto do @Transactional usado nos outros casos de uso: aqui a
 * transação é aberta e fechada NA MÃO (begin/commit/rollback), porque o
 * CreatePaymentUseCase precisa fazer uma chamada de I/O externo (o gateway
 * de pagamento) ENTRE a leitura inicial e a escrita final, e essa chamada
 * não pode ficar dentro de uma transação de banco (I/O externo não deve
 * seguar conexão/transação aberta). Um único método @Transactional não dá
 * pra "pausar" no meio — por isso o PlatformTransactionManager é pilotado
 * diretamente.
 *
 * ponytail: ThreadLocal simples, sem suporte a transação aninhada/reentrante
 * — está sozinho por request, é o suficiente para o alcance deste projeto.
 */
@Component
public class UnitOfWorkAdapter implements UnitOfWorkRepository {

    private final PlatformTransactionManager transactionManager;
    private final PaymentRepositoryAdapter paymentRepository;
    private final OrderRepositoryAdapter orderRepository;
    private final StockRepositoryAdapter stockRepository;

    private final ThreadLocal<TransactionStatus> currentTransaction = new ThreadLocal<>();

    public UnitOfWorkAdapter(
            PlatformTransactionManager transactionManager,
            PaymentRepositoryAdapter paymentRepository,
            OrderRepositoryAdapter orderRepository,
            StockRepositoryAdapter stockRepository
    ) {
        this.transactionManager = transactionManager;
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.stockRepository = stockRepository;
    }

    @Override
    public void begin() {
        if (currentTransaction.get() != null) {
            throw new IllegalStateException("Transaction already started");
        }
        DefaultTransactionDefinition definition = new DefaultTransactionDefinition();
        definition.setPropagationBehavior(DefaultTransactionDefinition.PROPAGATION_REQUIRES_NEW);
        currentTransaction.set(transactionManager.getTransaction(definition));
    }

    @Override
    public void commit() {
        transactionManager.commit(requireTransaction());
        currentTransaction.remove();
    }

    @Override
    public void rollback() {
        transactionManager.rollback(requireTransaction());
        currentTransaction.remove();
    }

    @Override
    public PaymentRepository getPaymentRepository() {
        return paymentRepository;
    }

    @Override
    public OrderRepository getOrderRepository() {
        return orderRepository;
    }

    @Override
    public StockRepository getStockRepository() {
        return stockRepository;
    }

    private TransactionStatus requireTransaction() {
        TransactionStatus status = currentTransaction.get();
        if (status == null) {
            throw new IllegalStateException("No transaction started");
        }
        return status;
    }
}
