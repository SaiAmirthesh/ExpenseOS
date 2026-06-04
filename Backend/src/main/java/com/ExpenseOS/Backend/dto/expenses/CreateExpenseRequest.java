package com.ExpenseOS.Backend.dto.expenses;

import com.ExpenseOS.Backend.entity.ExpenseCategory;
import com.ExpenseOS.Backend.entity.SplitType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class CreateExpenseRequest {

    @NotNull(message = "Group id is required")
    private Long groupId;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be greater than zero")
    private BigDecimal amount;

    @NotNull(message = "Category is required")
    private ExpenseCategory category;

    private SplitType splitType;

    @Valid
    private List<SplitRequest> splits;
}
