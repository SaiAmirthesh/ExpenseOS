package com.ExpenseOS.Backend.service;

import com.ExpenseOS.Backend.dto.expenses.CreateExpenseRequest;
import com.ExpenseOS.Backend.dto.expenses.ExpenseResponse;
import com.ExpenseOS.Backend.entity.Expense;
import com.ExpenseOS.Backend.entity.ExpenseSplit;
import com.ExpenseOS.Backend.entity.Group;
import com.ExpenseOS.Backend.entity.GroupMember;
import com.ExpenseOS.Backend.entity.SplitType;
import com.ExpenseOS.Backend.entity.User;
import com.ExpenseOS.Backend.exception.InvalidOperationException;
import com.ExpenseOS.Backend.exception.ResourceNotFoundException;
import com.ExpenseOS.Backend.mapper.ExpenseMapper;
import com.ExpenseOS.Backend.repository.ExpenseRepository;
import com.ExpenseOS.Backend.repository.ExpenseSplitRepository;
import com.ExpenseOS.Backend.repository.GroupMemberRepository;
import com.ExpenseOS.Backend.repository.GroupRepository;
import com.ExpenseOS.Backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseSplitRepository expenseSplitRepository;
    private final ExpenseMapper expenseMapper;

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User Not Found"));
    }

    private Group getGroupById(Long groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group Not Found"));
    }

    private void validateMembership(Group group, User user) {
        if (!groupMemberRepository.existsByGroupAndUser(group, user)) {
            throw new InvalidOperationException("User must be a member of the group");
        }
    }

    @Transactional
    public ExpenseResponse createExpense(CreateExpenseRequest request, String currentUserEmail) {
        User payer = getUserByEmail(currentUserEmail);
        Group group = getGroupById(request.getGroupId());
        validateMembership(group, payer);

        Expense expense = Expense.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .amount(request.getAmount())
                .category(request.getCategory())
                .splitType(SplitType.EQUAL)
                .paidBy(payer)
                .group(group)
                .build();

        Expense savedExpense = expenseRepository.save(expense);
        List<GroupMember> members = groupMemberRepository.findByGroup(group);

        if (members.isEmpty()) {
            throw new InvalidOperationException("Group must have at least one member");
        }

        BigDecimal splitAmount = request.getAmount().divide(
                BigDecimal.valueOf(members.size()),
                2,
                RoundingMode.HALF_UP
        );

        List<ExpenseSplit> splits = members.stream()
                .map(member -> ExpenseSplit.builder()
                        .expense(savedExpense)
                        .user(member.getUser())
                        .amount(splitAmount)
                        .settled(false)
                        .build())
                .toList();

        List<ExpenseSplit> savedSplits = expenseSplitRepository.saveAll(splits);
        return expenseMapper.toResponse(savedExpense, savedSplits);
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> getExpensesByGroup(Long groupId) {
        Group group = getGroupById(groupId);
        List<Expense> expenses = expenseRepository.findByGroupIdOrderByCreatedAtDesc(group.getId());

        if (expenses.isEmpty()) {
            return List.of();
        }

        List<Long> expenseIds = expenses.stream()
                .map(Expense::getId)
                .toList();

        Map<Long, List<ExpenseSplit>> splitsByExpenseId = expenseSplitRepository
                .findSplitsForExpenses(expenseIds)
                .stream()
                .collect(Collectors.groupingBy(split -> split.getExpense().getId()));

        return expenses.stream()
                .map(expense -> expenseMapper.toResponse(
                        expense,
                        splitsByExpenseId.getOrDefault(expense.getId(), List.of())
                ))
                .toList();
    }
}
