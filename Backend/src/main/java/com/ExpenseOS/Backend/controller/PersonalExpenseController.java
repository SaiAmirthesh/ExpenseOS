package com.ExpenseOS.Backend.controller;

import com.ExpenseOS.Backend.dto.personalexpense.CreatePersonalExpenseRequest;
import com.ExpenseOS.Backend.dto.personalexpense.CategorySpendingResponse;
import com.ExpenseOS.Backend.dto.personalexpense.MonthlySpendingResponse;
import com.ExpenseOS.Backend.dto.personalexpense.PersonalExpenseResponse;
import com.ExpenseOS.Backend.dto.personalexpense.UpdatePersonalExpenseRequest;
import com.ExpenseOS.Backend.entity.PersonalExpenseCategory;
import com.ExpenseOS.Backend.service.PersonalExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/personal-expenses")
@RequiredArgsConstructor
public class PersonalExpenseController {

    private final PersonalExpenseService personalExpenseService;

    @PostMapping
    public PersonalExpenseResponse createExpense(
            @Valid @RequestBody CreatePersonalExpenseRequest request,
            Authentication authentication
    ) {
        return personalExpenseService.createExpense(request, authentication.getName());
    }

    @GetMapping
    public List<PersonalExpenseResponse> getAllExpenses(Authentication authentication) {
        return personalExpenseService.getAllExpenses(authentication.getName());
    }

    @GetMapping("/{id}")
    public PersonalExpenseResponse getExpense(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return personalExpenseService.getExpense(id, authentication.getName());
    }

    @PutMapping("/{id}")
    public PersonalExpenseResponse updateExpense(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePersonalExpenseRequest request,
            Authentication authentication
    ) {
        return personalExpenseService.updateExpense(id, request, authentication.getName());
    }

    @DeleteMapping("/{id}")
    public void deleteExpense(
            @PathVariable Long id,
            Authentication authentication
    ) {
        personalExpenseService.deleteExpense(id, authentication.getName());
    }

    @GetMapping("/category/{category}")
    public List<PersonalExpenseResponse> getByCategory(
            @PathVariable PersonalExpenseCategory category,
            Authentication authentication
    ) {
        return personalExpenseService.getByCategory(authentication.getName(), category);
    }

    @GetMapping("/date-range")
    public List<PersonalExpenseResponse> getByDateRange(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate,
            Authentication authentication
    ) {
        return personalExpenseService.getByDateRange(authentication.getName(), startDate, endDate);
    }

    @GetMapping("/analytics/monthly")
    public List<MonthlySpendingResponse> getMonthlyAnalytics(
            @RequestParam(required = false) Integer year,
            Authentication authentication
    ) {
        return personalExpenseService.getMonthlySpendingAnalysis(authentication.getName(), year);
    }

    @GetMapping("/analytics/category")
    public List<CategorySpendingResponse> getCategoryAnalytics(
            @RequestParam(required = false) Integer year,
            Authentication authentication
    ) {
        return personalExpenseService.getCategorySpendingAnalysis(authentication.getName(), year);
    }
}
