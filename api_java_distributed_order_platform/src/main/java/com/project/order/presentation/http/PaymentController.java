package com.project.order.presentation.http;

import com.project.order.application.usecase.payment.CreatePaymentUseCase;
import com.project.order.presentation.http.dto.PaymentDto.CreatePaymentRequest;
import com.project.order.presentation.http.dto.PaymentDto.PaymentResponse;
import com.project.order.presentation.http.mapper.PaymentMapper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    private final CreatePaymentUseCase createPaymentUseCase;

    public PaymentController(CreatePaymentUseCase createPaymentUseCase) {
        this.createPaymentUseCase = createPaymentUseCase;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse create(@Valid @RequestBody CreatePaymentRequest body) {
        return PaymentMapper.toResponse(createPaymentUseCase.execute(body.order_id(), body.amount()));
    }
}
