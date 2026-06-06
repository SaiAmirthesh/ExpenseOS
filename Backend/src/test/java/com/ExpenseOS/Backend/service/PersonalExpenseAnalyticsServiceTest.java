package com.ExpenseOS.Backend.service;

import com.ExpenseOS.Backend.dto.personalexpense.CategorySpendingResponse;
import com.ExpenseOS.Backend.dto.personalexpense.MonthlySpendingResponse;
import com.ExpenseOS.Backend.entity.PersonalExpense;
import com.ExpenseOS.Backend.entity.PersonalExpenseCategory;
import com.ExpenseOS.Backend.entity.User;
import com.ExpenseOS.Backend.mapper.PersonalExpenseMapper;
import com.ExpenseOS.Backend.repository.PersonalExpenseRepository;
import com.ExpenseOS.Backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PersonalExpenseAnalyticsServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PersonalExpenseRepository personalExpenseRepository;
    @Spy private PersonalExpenseMapper personalExpenseMapper = new PersonalExpenseMapper();

    @InjectMocks private PersonalExpenseService personalExpenseService;

    @Test
    void monthlySpendingAnalysisReturnsTwelveMonths() {
        User user = user(1L, "Sai", "sai@example.com");
        when(userRepository.findByEmail("sai@example.com")).thenReturn(Optional.of(user));
        when(personalExpenseRepository.findByUserIdAndExpenseDateBetween(
                1L,
                LocalDate.of(2026, 1, 1),
                LocalDate.of(2026, 12, 31)
        )).thenReturn(List.of(
                expense("Netflix", new BigDecimal("499"), PersonalExpenseCategory.ENTERTAINMENT, LocalDate.of(2026, 1, 10), user),
                expense("Groceries", new BigDecimal("2500"), PersonalExpenseCategory.FOOD, LocalDate.of(2026, 1, 20), user),
                expense("Fuel", new BigDecimal("1500"), PersonalExpenseCategory.TRANSPORT, LocalDate.of(2026, 3, 5), user)
        ));

        List<MonthlySpendingResponse> response = personalExpenseService.getMonthlySpendingAnalysis("sai@example.com", 2026);

        assertEquals(12, response.size());
        assertEquals("JANUARY", response.get(0).getMonth());
        assertEquals(new BigDecimal("2999.00"), response.get(0).getAmount());
        assertEquals("MARCH", response.get(2).getMonth());
        assertEquals(new BigDecimal("1500.00"), response.get(2).getAmount());
    }

    @Test
    void categoryAnalysisAggregatesByCategory() {
        User user = user(1L, "Sai", "sai@example.com");
        when(userRepository.findByEmail("sai@example.com")).thenReturn(Optional.of(user));
        when(personalExpenseRepository.findByUserIdAndExpenseDateBetween(
                1L,
                LocalDate.of(2026, 1, 1),
                LocalDate.of(2026, 12, 31)
        )).thenReturn(List.of(
                expense("Netflix", new BigDecimal("499"), PersonalExpenseCategory.ENTERTAINMENT, LocalDate.of(2026, 1, 10), user),
                expense("Movie", new BigDecimal("300"), PersonalExpenseCategory.ENTERTAINMENT, LocalDate.of(2026, 2, 10), user),
                expense("Groceries", new BigDecimal("2500"), PersonalExpenseCategory.FOOD, LocalDate.of(2026, 1, 20), user)
        ));

        List<CategorySpendingResponse> response = personalExpenseService.getCategorySpendingAnalysis("sai@example.com", 2026);

        assertEquals(2, response.size());
        assertEquals(PersonalExpenseCategory.FOOD, response.get(0).getCategory());
        assertEquals(new BigDecimal("2500.00"), response.get(0).getAmount());
        assertEquals(PersonalExpenseCategory.ENTERTAINMENT, response.get(1).getCategory());
        assertEquals(new BigDecimal("799.00"), response.get(1).getAmount());
    }

    private static User user(Long id, String name, String email) {
        User user = User.builder().name(name).email(email).password("x").enabled(true).build();
        user.setId(id);
        return user;
    }

    private static PersonalExpense expense(
            String title,
            BigDecimal amount,
            PersonalExpenseCategory category,
            LocalDate date,
            User user
    ) {
        PersonalExpense expense = PersonalExpense.builder()
                .title(title)
                .amount(amount)
                .category(category)
                .expenseDate(date)
                .user(user)
                .build();
        return expense;
    }
}
