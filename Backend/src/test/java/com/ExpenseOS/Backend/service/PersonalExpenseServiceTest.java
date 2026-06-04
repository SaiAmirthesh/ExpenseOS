package com.ExpenseOS.Backend.service;

import com.ExpenseOS.Backend.dto.personalexpense.CreatePersonalExpenseRequest;
import com.ExpenseOS.Backend.dto.personalexpense.PersonalExpenseResponse;
import com.ExpenseOS.Backend.dto.personalexpense.UpdatePersonalExpenseRequest;
import com.ExpenseOS.Backend.entity.PersonalExpense;
import com.ExpenseOS.Backend.entity.PersonalExpenseCategory;
import com.ExpenseOS.Backend.entity.User;
import com.ExpenseOS.Backend.exception.ForbiddenOperationException;
import com.ExpenseOS.Backend.exception.ResourceNotFoundException;
import com.ExpenseOS.Backend.mapper.PersonalExpenseMapper;
import com.ExpenseOS.Backend.repository.PersonalExpenseRepository;
import com.ExpenseOS.Backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PersonalExpenseServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PersonalExpenseRepository personalExpenseRepository;
    @Spy private PersonalExpenseMapper personalExpenseMapper = new PersonalExpenseMapper();

    @InjectMocks private PersonalExpenseService personalExpenseService;

    @Test
    void createExpense() {
        User user = user(1L, "Sai", "sai@example.com");
        CreatePersonalExpenseRequest request = createRequest();

        when(userRepository.findByEmail("sai@example.com")).thenReturn(Optional.of(user));
        when(personalExpenseRepository.save(any())).thenAnswer(invocation -> {
            PersonalExpense expense = invocation.getArgument(0);
            expense.setId(99L);
            return expense;
        });

        PersonalExpenseResponse response = personalExpenseService.createExpense(request, "sai@example.com");

        ArgumentCaptor<PersonalExpense> captor = ArgumentCaptor.forClass(PersonalExpense.class);
        verify(personalExpenseRepository).save(captor.capture());
        assertEquals(user, captor.getValue().getUser());
        assertEquals("Netflix", response.getTitle());
    }

    @Test
    void updateExpense() {
        User user = user(1L, "Sai", "sai@example.com");
        PersonalExpense expense = expense(10L, user);
        UpdatePersonalExpenseRequest request = updateRequest();

        when(userRepository.findByEmail("sai@example.com")).thenReturn(Optional.of(user));
        when(personalExpenseRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(expense));
        when(personalExpenseRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        PersonalExpenseResponse response = personalExpenseService.updateExpense(10L, request, "sai@example.com");

        assertEquals("Netflix Premium", response.getTitle());
    }

    @Test
    void deleteExpense() {
        User user = user(1L, "Sai", "sai@example.com");
        PersonalExpense expense = expense(10L, user);

        when(userRepository.findByEmail("sai@example.com")).thenReturn(Optional.of(user));
        when(personalExpenseRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(expense));

        personalExpenseService.deleteExpense(10L, "sai@example.com");

        verify(personalExpenseRepository).delete(expense);
    }

    @Test
    void getExpense() {
        User user = user(1L, "Sai", "sai@example.com");
        PersonalExpense expense = expense(10L, user);

        when(userRepository.findByEmail("sai@example.com")).thenReturn(Optional.of(user));
        when(personalExpenseRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(expense));

        PersonalExpenseResponse response = personalExpenseService.getExpense(10L, "sai@example.com");

        assertEquals(10L, response.getId());
    }

    @Test
    void getAllExpenses() {
        User user = user(1L, "Sai", "sai@example.com");
        when(userRepository.findByEmail("sai@example.com")).thenReturn(Optional.of(user));
        when(personalExpenseRepository.findByUserIdOrderByExpenseDateDesc(1L))
                .thenReturn(List.of(expense(10L, user)));

        List<PersonalExpenseResponse> response = personalExpenseService.getAllExpenses("sai@example.com");

        assertEquals(1, response.size());
    }

    @Test
    void filterByCategory() {
        User user = user(1L, "Sai", "sai@example.com");
        when(userRepository.findByEmail("sai@example.com")).thenReturn(Optional.of(user));
        when(personalExpenseRepository.findByUserIdAndCategory(1L, PersonalExpenseCategory.ENTERTAINMENT))
                .thenReturn(List.of(expense(10L, user)));

        List<PersonalExpenseResponse> response =
                personalExpenseService.getByCategory("sai@example.com", PersonalExpenseCategory.ENTERTAINMENT);

        assertEquals(1, response.size());
    }

    @Test
    void filterByDateRange() {
        User user = user(1L, "Sai", "sai@example.com");
        when(userRepository.findByEmail("sai@example.com")).thenReturn(Optional.of(user));
        when(personalExpenseRepository.findByUserIdAndExpenseDateBetween(
                1L,
                LocalDate.parse("2026-06-01"),
                LocalDate.parse("2026-06-30")
        )).thenReturn(List.of(expense(10L, user)));

        List<PersonalExpenseResponse> response = personalExpenseService.getByDateRange(
                "sai@example.com",
                LocalDate.parse("2026-06-01"),
                LocalDate.parse("2026-06-30")
        );

        assertEquals(1, response.size());
    }

    @Test
    void unauthorizedAccessFails() {
        User owner = user(1L, "Sai", "sai@example.com");
        User attacker = user(2L, "Arun", "arun@example.com");
        PersonalExpense expense = expense(10L, owner);

        when(userRepository.findByEmail("arun@example.com")).thenReturn(Optional.of(attacker));
        when(personalExpenseRepository.findByIdAndUserId(10L, 2L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> personalExpenseService.getExpense(10L, "arun@example.com"));
    }

    @Test
    void unauthorizedUpdateFails() {
        User owner = user(1L, "Sai", "sai@example.com");
        User attacker = user(2L, "Arun", "arun@example.com");
        PersonalExpense expense = expense(10L, owner);

        when(userRepository.findByEmail("arun@example.com")).thenReturn(Optional.of(attacker));
        when(personalExpenseRepository.findByIdAndUserId(10L, 2L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> personalExpenseService.updateExpense(10L, updateRequest(), "arun@example.com"));
    }

    @Test
    void unauthorizedDeleteFails() {
        User owner = user(1L, "Sai", "sai@example.com");
        User attacker = user(2L, "Arun", "arun@example.com");

        when(userRepository.findByEmail("arun@example.com")).thenReturn(Optional.of(attacker));
        when(personalExpenseRepository.findByIdAndUserId(10L, 2L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> personalExpenseService.deleteExpense(10L, "arun@example.com"));

        verify(personalExpenseRepository, never()).delete(any());
    }

    private static CreatePersonalExpenseRequest createRequest() {
        CreatePersonalExpenseRequest request = new CreatePersonalExpenseRequest();
        request.setTitle("Netflix");
        request.setDescription("Monthly subscription");
        request.setAmount(new BigDecimal("499"));
        request.setCategory(PersonalExpenseCategory.ENTERTAINMENT);
        request.setExpenseDate(LocalDate.parse("2026-06-04"));
        return request;
    }

    private static UpdatePersonalExpenseRequest updateRequest() {
        UpdatePersonalExpenseRequest request = new UpdatePersonalExpenseRequest();
        request.setTitle("Netflix Premium");
        request.setDescription("Updated plan");
        request.setAmount(new BigDecimal("649"));
        request.setCategory(PersonalExpenseCategory.ENTERTAINMENT);
        request.setExpenseDate(LocalDate.parse("2026-06-04"));
        return request;
    }

    private static User user(Long id, String name, String email) {
        User user = User.builder().name(name).email(email).password("x").enabled(true).build();
        user.setId(id);
        return user;
    }

    private static PersonalExpense expense(Long id, User user) {
        PersonalExpense expense = PersonalExpense.builder()
                .title("Netflix")
                .description("desc")
                .amount(new BigDecimal("499"))
                .category(PersonalExpenseCategory.ENTERTAINMENT)
                .expenseDate(LocalDate.parse("2026-06-04"))
                .user(user)
                .build();
        expense.setId(id);
        return expense;
    }
}
