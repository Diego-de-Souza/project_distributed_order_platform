package com.project.order.presentation.http;

import com.project.order.application.usecase.product.CreateProductUseCase;
import com.project.order.application.usecase.product.GetProductUseCase;
import com.project.order.presentation.http.dto.ProductDto.CreateProductRequest;
import com.project.order.presentation.http.dto.ProductDto.ProductResponse;
import com.project.order.presentation.http.mapper.ProductMapper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/products")
public class ProductController {

    private final CreateProductUseCase createProductUseCase;
    private final GetProductUseCase getProductUseCase;

    public ProductController(CreateProductUseCase createProductUseCase, GetProductUseCase getProductUseCase) {
        this.createProductUseCase = createProductUseCase;
        this.getProductUseCase = getProductUseCase;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse create(@Valid @RequestBody CreateProductRequest body) {
        int initialStock = body.initialStock() != null ? body.initialStock() : 0;
        return ProductMapper.toResponse(createProductUseCase.execute(body.sku(), body.name(), body.price(), initialStock));
    }

    @GetMapping("/{id}")
    public ProductResponse getById(@PathVariable String id) {
        return ProductMapper.toResponse(getProductUseCase.execute(id));
    }
}
