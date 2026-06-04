package com.ExpenseOS.Backend.service;

import com.ExpenseOS.Backend.dto.personalexpense.CreatePersonalExpenseRequest;
import com.ExpenseOS.Backend.dto.personalexpense.PersonalExpenseResponse;
import com.ExpenseOS.Backend.dto.personalexpense.UpdatePersonalExpenseRequest;
import com.ExpenseOS.Backend.entity.PersonalExpense;
import com.ExpenseOS.Backend.entity.User;
import com.ExpenseOS.Backend.exception.ForbiddenOperationException;
import com.ExpenseOS.Backend.exception.ResourceNotFoundException;
import com.ExpenseOS.Backend.mapper.PersonalExpenseMapper;
import com.ExpenseOS.Backend.repository.PersonalExpenseRepository;
import com.ExpenseOS.Backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PersonalExpenseService {

    private final UserRepository userRepository;
    private final PersonalExpenseRepository personalExpenseRepository;
    private final PersonalExpenseMapper personalExpenseMapper;

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User Not Found"));
    }

    private PersonalExpense getOwnedExpense(Long id, Long userId) {
        return personalExpenseRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Personal Expense Not Found"));
    }

    private void ensureOwner(PersonalExpense expense, Long userId) {
        if (!expense.getUser().getId().equals(userId)) {
            throw new ForbiddenOperationException("You cannot access another user's expense");
        }
    }

    @Transactional
    public PersonalExpenseResponse createExpense(CreatePersonalExpenseRequest request, String currentUserEmail) {
        User user = getUserByEmail(currentUserEmail);
        PersonalExpense expense = personalExpenseMapper.toEntity(request);
        expense.setUser(user);
        return personalExpenseMapper.toResponse(personalExpenseRepository.save(expense));
    }

    @Transactional
    public PersonalExpenseResponse updateExpense(
            Long id,
            UpdatePersonalExpenseRequest request,
            String currentUserEmail
    ) {
        User user = getUserByEmail(currentUserEmail);
        PersonalExpense expense = getOwnedExpense(id, user.getId());
        ensureOwner(expense, user.getId());
        personalExpenseMapper.updateEntity(expense, request);
        return personalExpenseMapper.toResponse(personalExpenseRepository.save(expense));
    }

    @Transactional
    public void deleteExpense(Long id, String currentUserEmail) {
        User user = getUserByEmail(currentUserEmail);
        PersonalExpense expense = getOwnedExpense(id, user.getId());
        ensureOwner(expense, user.getId());
        personalExpenseRepository.delete(expense);
    }

    @Transactional(readOnly = true)
    public PersonalExpenseResponse getExpense(Long id, String currentUserEmail) {
        User user = getUserByEmail(currentUserEmail);
        PersonalExpense expense = getOwnedExpense(id, user.getId());
        ensureOwner(expense, user.getId());
        return personalExpenseMapper.toResponse(expense);
    }

    @Transactional(readOnly = true)
    public List<PersonalExpenseResponse> getAllExpenses(String currentUserEmail) {
        User user = getUserByEmail(currentUserEmail);
        return personalExpenseRepository.findByUserIdOrderByExpenseDateDesc(user.getId())
                .stream()
                .map(personalExpenseMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PersonalExpenseResponse> getByCategory(
            String currentUserEmail,
            com.ExpenseOS.Backend.entity.PersonalExpenseCategory category
    ) {
        User user = getUserByEmail(currentUserEmail);
        return personalExpenseRepository.findByUserIdAndCategory(user.getId(), category)
                .stream()
                .map(personalExpenseMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PersonalExpenseResponse> getByDateRange(
            String currentUserEmail,
            LocalDate startDate,
            LocalDate endDate
    ) {
        User user = getUserByEmail(currentUserEmail);
        return personalExpenseRepository.findByUserIdAndExpenseDateBetween(user.getId(), startDate, endDate)
                .stream()
                .map(personalExpenseMapper::toResponse)
                .toList();
    }
}
