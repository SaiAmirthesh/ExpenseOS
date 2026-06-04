package com.ExpenseOS.Backend.service;

import com.ExpenseOS.Backend.dto.expenses.CreateExpenseRequest;
import com.ExpenseOS.Backend.dto.expenses.ExpenseResponse;
import com.ExpenseOS.Backend.dto.expenses.SplitRequest;
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
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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

    private List<GroupMember> getGroupMembers(Group group) {
        List<GroupMember> members = groupMemberRepository.findByGroup(group);
        if (members.isEmpty()) {
            throw new InvalidOperationException("Group must have at least one member");
        }
        return members;
    }

    private List<ExpenseSplit> buildEqualSplits(Expense expense, List<GroupMember> members) {
        BigDecimal splitAmount = expense.getAmount().divide(
                BigDecimal.valueOf(members.size()),
                2,
                RoundingMode.HALF_UP
        );

        return members.stream()
                .map(member -> ExpenseSplit.builder()
                        .expense(expense)
                        .user(member.getUser())
                        .amount(splitAmount)
                        .settled(false)
                        .build())
                .toList();
    }

    private List<ExpenseSplit> buildExactSplits(
            Expense expense,
            List<GroupMember> members,
            List<SplitRequest> splitRequests
    ) {
        if (splitRequests == null || splitRequests.isEmpty()) {
            throw new InvalidOperationException("Exact splits are required");
        }

        Set<Long> memberIds = members.stream()
                .map(member -> member.getUser().getId())
                .collect(Collectors.toSet());

        Set<Long> seenUsers = new HashSet<>();
        BigDecimal total = BigDecimal.ZERO;

        List<ExpenseSplit> splits = new ArrayList<>();
        for (SplitRequest splitRequest : splitRequests) {
            if (splitRequest.getAmount() == null) {
                throw new InvalidOperationException("Exact split amount is required");
            }
            if (splitRequest.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new InvalidOperationException("Split amount must be greater than zero");
            }
            if (!memberIds.contains(splitRequest.getUserId())) {
                throw new InvalidOperationException("All split users must belong to the group");
            }
            if (!seenUsers.add(splitRequest.getUserId())) {
                throw new InvalidOperationException("Duplicate users are not allowed");
            }

            total = total.add(splitRequest.getAmount());
            User user = members.stream()
                    .map(GroupMember::getUser)
                    .filter(memberUser -> memberUser.getId().equals(splitRequest.getUserId()))
                    .findFirst()
                    .orElseThrow(() -> new InvalidOperationException("All split users must belong to the group"));

            splits.add(ExpenseSplit.builder()
                    .expense(expense)
                    .user(user)
                    .amount(splitRequest.getAmount().setScale(2, RoundingMode.HALF_UP))
                    .settled(false)
                    .build());
        }

        if (total.compareTo(expense.getAmount()) != 0) {
            throw new InvalidOperationException("Exact split amounts must equal the expense amount");
        }

        return splits;
    }

    private List<ExpenseSplit> buildPercentageSplits(
            Expense expense,
            List<GroupMember> members,
            List<SplitRequest> splitRequests
    ) {
        if (splitRequests == null || splitRequests.isEmpty()) {
            throw new InvalidOperationException("Percentage splits are required");
        }

        Set<Long> memberIds = members.stream()
                .map(member -> member.getUser().getId())
                .collect(Collectors.toSet());

        Set<Long> seenUsers = new HashSet<>();
        BigDecimal totalPercentage = BigDecimal.ZERO;
        List<ExpenseSplit> splits = new ArrayList<>();
        BigDecimal remainingAmount = expense.getAmount().setScale(2, RoundingMode.HALF_UP);

        for (int i = 0; i < splitRequests.size(); i++) {
            SplitRequest splitRequest = splitRequests.get(i);
            if (splitRequest.getPercentage() == null) {
                throw new InvalidOperationException("Percentage value is required");
            }
            if (splitRequest.getPercentage().compareTo(BigDecimal.ZERO) <= 0) {
                throw new InvalidOperationException("Percentage must be greater than zero");
            }
            if (!memberIds.contains(splitRequest.getUserId())) {
                throw new InvalidOperationException("All split users must belong to the group");
            }
            if (!seenUsers.add(splitRequest.getUserId())) {
                throw new InvalidOperationException("Duplicate users are not allowed");
            }

            totalPercentage = totalPercentage.add(splitRequest.getPercentage());
            User user = members.stream()
                    .map(GroupMember::getUser)
                    .filter(memberUser -> memberUser.getId().equals(splitRequest.getUserId()))
                    .findFirst()
                    .orElseThrow(() -> new InvalidOperationException("All split users must belong to the group"));

            BigDecimal amount;
            if (i == splitRequests.size() - 1) {
                amount = remainingAmount;
            } else {
                amount = expense.getAmount()
                        .multiply(splitRequest.getPercentage())
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                remainingAmount = remainingAmount.subtract(amount);
            }

            splits.add(ExpenseSplit.builder()
                    .expense(expense)
                    .user(user)
                    .amount(amount.setScale(2, RoundingMode.HALF_UP))
                    .settled(false)
                    .build());
        }

        if (totalPercentage.compareTo(BigDecimal.valueOf(100)) != 0) {
            throw new InvalidOperationException("Percentage splits must total 100");
        }

        return splits;
    }

    @Transactional
    public ExpenseResponse createExpense(CreateExpenseRequest request, String currentUserEmail) {
        User payer = getUserByEmail(currentUserEmail);
        Group group = getGroupById(request.getGroupId());
        validateMembership(group, payer);
        SplitType splitType = request.getSplitType() == null ? SplitType.EQUAL : request.getSplitType();
        List<GroupMember> members = getGroupMembers(group);

        Expense expense = Expense.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .amount(request.getAmount())
                .category(request.getCategory())
                .splitType(splitType)
                .paidBy(payer)
                .group(group)
                .build();

        Expense savedExpense = expenseRepository.save(expense);
        List<ExpenseSplit> splits = switch (splitType) {
            case EQUAL -> buildEqualSplits(savedExpense, members);
            case EXACT -> buildExactSplits(savedExpense, members, request.getSplits());
            case PERCENTAGE -> buildPercentageSplits(savedExpense, members, request.getSplits());
        };

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
