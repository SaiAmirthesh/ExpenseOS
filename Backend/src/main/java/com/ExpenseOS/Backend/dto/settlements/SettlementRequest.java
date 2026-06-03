package com.ExpenseOS.Backend.dto.settlements;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class SettlementRequest {

    @NotNull(message = "Group id is required")
    private Long groupId;

    @NotNull(message = "To user id is required")
    private Long toUserId;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be greater than zero")
    private BigDecimal amount;

    private String note;
}
