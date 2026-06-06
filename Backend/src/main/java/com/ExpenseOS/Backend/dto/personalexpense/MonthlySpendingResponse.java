package com.ExpenseOS.Backend.dto.personalexpense;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlySpendingResponse {

    private String month;
    private BigDecimal amount;
}
