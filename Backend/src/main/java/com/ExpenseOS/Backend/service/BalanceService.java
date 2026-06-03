package com.ExpenseOS.Backend.service;

import com.ExpenseOS.Backend.dto.balances.BalanceResponse;
import com.ExpenseOS.Backend.entity.Group;
import com.ExpenseOS.Backend.entity.GroupMember;
import com.ExpenseOS.Backend.entity.SettlementStatus;
import com.ExpenseOS.Backend.entity.User;
import com.ExpenseOS.Backend.exception.InvalidOperationException;
import com.ExpenseOS.Backend.exception.ResourceNotFoundException;
import com.ExpenseOS.Backend.mapper.FinancialMapper;
import com.ExpenseOS.Backend.repository.ExpenseRepository;
import com.ExpenseOS.Backend.repository.ExpenseSplitRepository;
import com.ExpenseOS.Backend.repository.GroupMemberRepository;
import com.ExpenseOS.Backend.repository.GroupRepository;
import com.ExpenseOS.Backend.repository.SettlementRepository;
import com.ExpenseOS.Backend.repository.UserRepository;
import com.ExpenseOS.Backend.repository.projection.UserAmountProjection;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BalanceService {

    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseSplitRepository expenseSplitRepository;
    private final SettlementRepository settlementRepository;
    private final FinancialMapper financialMapper;

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

    private Map<Long, BigDecimal> toAmountMap(List<UserAmountProjection> projections) {
        return projections.stream()
                .collect(Collectors.toMap(
                        UserAmountProjection::getUserId,
                        projection -> projection.getAmount() == null ? ZERO : projection.getAmount(),
                        BigDecimal::add
                ));
    }

    @Transactional(readOnly = true)
    public List<BalanceResponse> getBalances(Long groupId, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        Group group = getGroupById(groupId);
        validateMembership(group, currentUser);

        List<GroupMember> members = groupMemberRepository.findByGroup(group);
        Map<Long, GroupMember> memberByUserId = members.stream()
                .collect(Collectors.toMap(member -> member.getUser().getId(), Function.identity()));

        Map<Long, BigDecimal> paidByUser = toAmountMap(expenseRepository.sumPaidAmountsByGroup(groupId));
        Map<Long, BigDecimal> owedByUser = toAmountMap(expenseSplitRepository.sumOwedAmountsByGroup(groupId));
        Map<Long, BigDecimal> sentByUser = toAmountMap(
                settlementRepository.sumSentAmountsByGroup(groupId, SettlementStatus.APPROVED)
        );
        Map<Long, BigDecimal> receivedByUser = toAmountMap(
                settlementRepository.sumReceivedAmountsByGroup(groupId, SettlementStatus.APPROVED)
        );

        return members.stream()
                .map(member -> {
                    Long userId = member.getUser().getId();
                    BigDecimal balance = paidByUser.getOrDefault(userId, ZERO)
                            .subtract(owedByUser.getOrDefault(userId, ZERO))
                            .add(sentByUser.getOrDefault(userId, ZERO))
                            .subtract(receivedByUser.getOrDefault(userId, ZERO))
                            .setScale(2, RoundingMode.HALF_UP);
                    return financialMapper.toBalanceResponse(memberByUserId.get(userId).getUser(), balance);
                })
                .toList();
    }
}
