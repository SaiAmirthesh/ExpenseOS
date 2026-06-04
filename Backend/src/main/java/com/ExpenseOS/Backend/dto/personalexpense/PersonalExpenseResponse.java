package com.ExpenseOS.Backend.dto.personalexpense;

import com.ExpenseOS.Backend.entity.PersonalExpenseCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonalExpenseResponse {

    private Long id;
    private String title;
    private BigDecimal amount;
    private PersonalExpenseCategory category;
    private LocalDate expenseDate;
}
