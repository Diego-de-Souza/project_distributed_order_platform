package com.project.order.presentation.http;

import com.project.order.application.usecase.order.CancelOrderUseCase;
import com.project.order.application.usecase.order.ConfirmOrderUseCase;
import com.project.order.application.usecase.order.CreateOrderUseCase;
import com.project.order.application.usecase.order.GetOrderUseCase;
import com.project.order.application.usecase.order.ListOrdersUseCase;
import com.project.order.presentation.http.dto.OrderDto.CreateOrderRequest;
import com.project.order.presentation.http.dto.OrderDto.OrderResponse;
import com.project.order.presentation.http.mapper.OrderMapper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final CreateOrderUseCase createOrderUseCase;
    private final GetOrderUseCase getOrderUseCase;
    private final ListOrdersUseCase listOrdersUseCase;
    private final ConfirmOrderUseCase confirmOrderUseCase;
    private final CancelOrderUseCase cancelOrderUseCase;

    public OrderController(
            CreateOrderUseCase createOrderUseCase,
            GetOrderUseCase getOrderUseCase,
            ListOrdersUseCase listOrdersUseCase,
            ConfirmOrderUseCase confirmOrderUseCase,
            CancelOrderUseCase cancelOrderUseCase
    ) {
        this.createOrderUseCase = createOrderUseCase;
        this.getOrderUseCase = getOrderUseCase;
        this.listOrdersUseCase = listOrdersUseCase;
        this.confirmOrderUseCase = confirmOrderUseCase;
        this.cancelOrderUseCase = cancelOrderUseCase;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse create(@Valid @RequestBody CreateOrderRequest body) {
        var items = body.items().stream()
                .map(i -> new CreateOrderUseCase.OrderItemRequest(i.productId(), i.quantity()))
                .toList();
        return OrderMapper.toResponse(createOrderUseCase.execute(body.clientId(), items));
    }

    @GetMapping
    public List<OrderResponse> list() {
        return listOrdersUseCase.execute().stream().map(OrderMapper::toResponse).toList();
    }

    @GetMapping("/{id}")
    public OrderResponse getById(@PathVariable String id) {
        return OrderMapper.toResponse(getOrderUseCase.execute(id));
    }

    @PostMapping("/{id}/confirm")
    public OrderResponse confirm(@PathVariable String id) {
        return OrderMapper.toResponse(confirmOrderUseCase.execute(id));
    }

    @PostMapping("/{id}/cancel")
    public OrderResponse cancel(@PathVariable String id) {
        return OrderMapper.toResponse(cancelOrderUseCase.execute(id));
    }
}
