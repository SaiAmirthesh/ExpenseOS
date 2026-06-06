package com.ExpenseOS.Backend.dto.personalexpense;

import com.ExpenseOS.Backend.entity.PersonalExpenseCategory;
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
public class CategorySpendingResponse {

    private PersonalExpenseCategory category;
    private BigDecimal amount;
}
