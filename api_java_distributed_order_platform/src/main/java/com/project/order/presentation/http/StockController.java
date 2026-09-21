package com.project.order.presentation.http;

import com.project.order.application.usecase.stock.GetStockUseCase;
import com.project.order.application.usecase.stock.ReleaseStockUseCase;
import com.project.order.application.usecase.stock.ReserveStockUseCase;
import com.project.order.application.usecase.stock.UpdateStockUseCase;
import com.project.order.presentation.http.dto.StockDto.StockQuantityRequest;
import com.project.order.presentation.http.dto.StockDto.StockResponse;
import com.project.order.presentation.http.dto.StockDto.UpdateStockRequest;
import com.project.order.presentation.http.mapper.StockMapper;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/stock")
public class StockController {

    private final GetStockUseCase getStockUseCase;
    private final UpdateStockUseCase updateStockUseCase;
    private final ReserveStockUseCase reserveStockUseCase;
    private final ReleaseStockUseCase releaseStockUseCase;

    public StockController(
            GetStockUseCase getStockUseCase,
            UpdateStockUseCase updateStockUseCase,
            ReserveStockUseCase reserveStockUseCase,
            ReleaseStockUseCase releaseStockUseCase
    ) {
        this.getStockUseCase = getStockUseCase;
        this.updateStockUseCase = updateStockUseCase;
        this.reserveStockUseCase = reserveStockUseCase;
        this.releaseStockUseCase = releaseStockUseCase;
    }

    @GetMapping("/{productId}")
    public StockResponse getByProductId(@PathVariable String productId) {
        return StockMapper.toResponse(getStockUseCase.execute(productId));
    }

    @PutMapping("/{productId}")
    public StockResponse update(@PathVariable String productId, @Valid @RequestBody UpdateStockRequest body) {
        return StockMapper.toResponse(updateStockUseCase.execute(productId, body.availableQuantity(), body.reservedQuantity()));
    }

    @PostMapping("/{productId}/reserve")
    public StockResponse reserve(@PathVariable String productId, @Valid @RequestBody StockQuantityRequest body) {
        return StockMapper.toResponse(reserveStockUseCase.execute(productId, body.quantity()));
    }

    @PostMapping("/{productId}/release")
    public StockResponse release(@PathVariable String productId, @Valid @RequestBody StockQuantityRequest body) {
        return StockMapper.toResponse(releaseStockUseCase.execute(productId, body.quantity()));
    }
}
