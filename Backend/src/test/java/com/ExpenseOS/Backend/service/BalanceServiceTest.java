package com.ExpenseOS.Backend.service;

import com.ExpenseOS.Backend.dto.balances.BalanceResponse;
import com.ExpenseOS.Backend.entity.Group;
import com.ExpenseOS.Backend.entity.GroupMember;
import com.ExpenseOS.Backend.entity.SettlementStatus;
import com.ExpenseOS.Backend.entity.User;
import com.ExpenseOS.Backend.mapper.FinancialMapper;
import com.ExpenseOS.Backend.repository.ExpenseRepository;
import com.ExpenseOS.Backend.repository.ExpenseSplitRepository;
import com.ExpenseOS.Backend.repository.GroupMemberRepository;
import com.ExpenseOS.Backend.repository.GroupRepository;
import com.ExpenseOS.Backend.repository.SettlementRepository;
import com.ExpenseOS.Backend.repository.UserRepository;
import com.ExpenseOS.Backend.repository.projection.UserAmountProjection;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BalanceServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private GroupRepository groupRepository;
    @Mock private GroupMemberRepository groupMemberRepository;
    @Mock private ExpenseRepository expenseRepository;
    @Mock private ExpenseSplitRepository expenseSplitRepository;
    @Mock private SettlementRepository settlementRepository;
    @Mock private FinancialMapper financialMapper;

    @InjectMocks private BalanceService balanceService;

    @Test
    void calculatesApprovedBalancesOnly() {
        User sai = user(1L, "Sai", "sai@example.com");
        User arun = user(2L, "Arun", "arun@example.com");
        User rahul = user(3L, "Rahul", "rahul@example.com");
        Group group = group(10L, sai);

        when(userRepository.findByEmail("sai@example.com")).thenReturn(Optional.of(sai));
        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.existsByGroupAndUser(group, sai)).thenReturn(true);
        when(groupMemberRepository.findByGroup(group)).thenReturn(List.of(
                member(group, sai),
                member(group, arun),
                member(group, rahul)
        ));

        when(expenseRepository.sumPaidAmountsByGroup(10L)).thenReturn(List.of(amount(1L, bd("6000"))));
        when(expenseSplitRepository.sumOwedAmountsByGroup(10L)).thenReturn(List.of(
                amount(1L, bd("2000")),
                amount(2L, bd("2000")),
                amount(3L, bd("2000"))
        ));
        when(settlementRepository.sumSentAmountsByGroup(10L, SettlementStatus.APPROVED))
                .thenReturn(List.of(amount(2L, bd("2000"))));
        when(settlementRepository.sumReceivedAmountsByGroup(10L, SettlementStatus.APPROVED))
                .thenReturn(List.of(amount(1L, bd("2000"))));

        when(financialMapper.toBalanceResponse(sai, bd("2000"))).thenReturn(balance(1L, "Sai", "2000"));
        when(financialMapper.toBalanceResponse(arun, bd("0"))).thenReturn(balance(2L, "Arun", "0"));
        when(financialMapper.toBalanceResponse(rahul, bd("-2000"))).thenReturn(balance(3L, "Rahul", "-2000"));

        List<BalanceResponse> balances = balanceService.getBalances(10L, "sai@example.com");

        assertEquals(bd("2000"), balances.get(0).getBalance());
        assertEquals(bd("0"), balances.get(1).getBalance());
        assertEquals(bd("-2000"), balances.get(2).getBalance());
    }

    private static User user(Long id, String name, String email) {
        User user = User.builder().name(name).email(email).password("x").enabled(true).build();
        user.setId(id);
        return user;
    }

    private static Group group(Long id, User createdBy) {
        Group group = Group.builder().name("Trip").description("desc").createdBy(createdBy).build();
        group.setId(id);
        return group;
    }

    private static GroupMember member(Group group, User user) {
        GroupMember member = GroupMember.builder().group(group).user(user).build();
        member.setId(user.getId());
        return member;
    }

    private static UserAmountProjection amount(Long userId, BigDecimal amount) {
        return new UserAmountProjection() {
            @Override
            public Long getUserId() {
                return userId;
            }

            @Override
            public BigDecimal getAmount() {
                return amount;
            }
        };
    }

    private static BigDecimal bd(String value) {
        return new BigDecimal(value).setScale(2);
    }

    private static BalanceResponse balance(Long id, String name, String value) {
        return BalanceResponse.builder()
                .userId(id)
                .name(name)
                .balance(bd(value))
                .build();
    }
}
