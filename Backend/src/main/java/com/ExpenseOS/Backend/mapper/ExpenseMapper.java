package com.ExpenseOS.Backend.mapper;

import com.ExpenseOS.Backend.dto.expenses.ExpenseResponse;
import com.ExpenseOS.Backend.dto.expenses.ExpenseSplitResponse;
import com.ExpenseOS.Backend.entity.Expense;
import com.ExpenseOS.Backend.entity.ExpenseSplit;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ExpenseMapper {

    public ExpenseSplitResponse toSplitResponse(ExpenseSplit split) {
        return ExpenseSplitResponse.builder()
                .id(split.getId())
                .userId(split.getUser().getId())
                .userName(split.getUser().getName())
                .userEmail(split.getUser().getEmail())
                .amount(split.getAmount())
                .settled(split.getSettled())
                .build();
    }

    public ExpenseResponse toResponse(Expense expense, List<ExpenseSplit> splits) {
        return ExpenseResponse.builder()
                .id(expense.getId())
                .title(expense.getTitle())
                .description(expense.getDescription())
                .amount(expense.getAmount())
                .category(expense.getCategory())
                .splitType(expense.getSplitType())
                .groupId(expense.getGroup().getId())
                .groupName(expense.getGroup().getName())
                .paidById(expense.getPaidBy().getId())
                .paidByName(expense.getPaidBy().getName())
                .paidByEmail(expense.getPaidBy().getEmail())
                .createdAt(expense.getCreatedAt())
                .updatedAt(expense.getUpdatedAt())
                .splits(splits.stream().map(this::toSplitResponse).toList())
                .build();
    }
}
