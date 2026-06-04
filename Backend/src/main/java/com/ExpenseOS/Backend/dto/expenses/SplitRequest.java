package com.ExpenseOS.Backend.dto.expenses;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class SplitRequest {

    @NotNull(message = "User id is required")
    private Long userId;

    @Positive(message = "Amount must be greater than zero")
    private BigDecimal amount;

    @Positive(message = "Percentage must be greater than zero")
    private BigDecimal percentage;
}
