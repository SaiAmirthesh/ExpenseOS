package com.ExpenseOS.Backend.mapper;

import com.ExpenseOS.Backend.dto.personalexpense.CreatePersonalExpenseRequest;
import com.ExpenseOS.Backend.dto.personalexpense.CategorySpendingResponse;
import com.ExpenseOS.Backend.dto.personalexpense.MonthlySpendingResponse;
import com.ExpenseOS.Backend.dto.personalexpense.PersonalExpenseResponse;
import com.ExpenseOS.Backend.dto.personalexpense.UpdatePersonalExpenseRequest;
import com.ExpenseOS.Backend.entity.PersonalExpense;
import com.ExpenseOS.Backend.entity.PersonalExpenseCategory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class PersonalExpenseMapper {

    public PersonalExpense toEntity(CreatePersonalExpenseRequest request) {
        return PersonalExpense.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .amount(request.getAmount())
                .category(request.getCategory())
                .expenseDate(request.getExpenseDate())
                .build();
    }

    public void updateEntity(PersonalExpense expense, UpdatePersonalExpenseRequest request) {
        expense.setTitle(request.getTitle());
        expense.setDescription(request.getDescription());
        expense.setAmount(request.getAmount());
        expense.setCategory(request.getCategory());
        expense.setExpenseDate(request.getExpenseDate());
    }

    public PersonalExpenseResponse toResponse(PersonalExpense expense) {
        return PersonalExpenseResponse.builder()
                .id(expense.getId())
                .title(expense.getTitle())
                .amount(expense.getAmount())
                .category(expense.getCategory())
                .expenseDate(expense.getExpenseDate())
                .build();
    }

    public MonthlySpendingResponse toMonthlyResponse(String month, BigDecimal amount) {
        return MonthlySpendingResponse.builder()
                .month(month)
                .amount(amount)
                .build();
    }

    public CategorySpendingResponse toCategoryResponse(PersonalExpenseCategory category, BigDecimal amount) {
        return CategorySpendingResponse.builder()
                .category(category)
                .amount(amount)
                .build();
    }
}
