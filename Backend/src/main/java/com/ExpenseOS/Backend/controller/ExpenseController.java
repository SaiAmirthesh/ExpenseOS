package com.ExpenseOS.Backend.controller;

import com.ExpenseOS.Backend.dto.expenses.CreateExpenseRequest;
import com.ExpenseOS.Backend.dto.expenses.ExpenseResponse;
import com.ExpenseOS.Backend.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping("/expenses")
    public ExpenseResponse createExpense(
            @Valid @RequestBody CreateExpenseRequest request,
            Authentication authentication
    ) {
        return expenseService.createExpense(request, authentication.getName());
    }

    @GetMapping("/groups/{groupId}/expenses")
    public List<ExpenseResponse> getExpensesByGroup(
            @PathVariable Long groupId,
            Authentication authentication
    ) {
        return expenseService.getExpensesByGroup(groupId);
    }
}
