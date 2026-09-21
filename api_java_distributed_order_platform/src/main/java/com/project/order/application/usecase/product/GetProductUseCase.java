package com.project.order.application.usecase.product;

import com.project.order.application.exception.NotFoundException;
import com.project.order.application.port.ProductRepository;
import com.project.order.application.port.RedisStoreRepository;
import com.project.order.domain.model.Money;
import com.project.order.domain.model.Product;
import com.project.order.domain.model.ProductStatus;
import org.springframework.stereotype.Service;

@Service
public class GetProductUseCase {

    private static final int PRODUCT_CACHE_TTL_SECONDS = 300;

    private record CachedProduct(String id, String sku, String name, double price, ProductStatus status) {}

    private final ProductRepository productRepository;
    private final RedisStoreRepository cacheStore;

    public GetProductUseCase(ProductRepository productRepository, RedisStoreRepository cacheStore) {
        this.productRepository = productRepository;
        this.cacheStore = cacheStore;
    }

    public Product execute(String productId) {
        String cacheKey = "product:" + productId;

        var cached = cacheStore.get(cacheKey, CachedProduct.class);
        if (cached.isPresent()) {
            CachedProduct c = cached.get();
            return new Product(c.id(), c.sku(), c.name(), new Money(c.price()), c.status());
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Product not found"));

        cacheStore.set(cacheKey, new CachedProduct(
                product.getId(), product.getSku(), product.getName(), product.getPrice().getValue(), product.getStatus()
        ), PRODUCT_CACHE_TTL_SECONDS);

        return product;
    }
}
