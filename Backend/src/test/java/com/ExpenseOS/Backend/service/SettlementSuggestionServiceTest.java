package com.ExpenseOS.Backend.service;

import com.ExpenseOS.Backend.dto.balances.BalanceResponse;
import com.ExpenseOS.Backend.dto.settlements.SettlementSuggestion;
import com.ExpenseOS.Backend.entity.Group;
import com.ExpenseOS.Backend.entity.User;
import com.ExpenseOS.Backend.mapper.FinancialMapper;
import com.ExpenseOS.Backend.repository.GroupMemberRepository;
import com.ExpenseOS.Backend.repository.GroupRepository;
import com.ExpenseOS.Backend.repository.UserRepository;
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
class SettlementSuggestionServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private GroupRepository groupRepository;
    @Mock private GroupMemberRepository groupMemberRepository;
    @Mock private BalanceService balanceService;
    @Mock private FinancialMapper financialMapper;

    @InjectMocks private SettlementSuggestionService settlementSuggestionService;

    @Test
    void generatesMinimumSettlementSuggestionsWithIdsAndNames() {
        User sai = user(1L, "Sai", "sai@example.com");
        Group group = group(10L, sai);

        when(userRepository.findByEmail("sai@example.com")).thenReturn(Optional.of(sai));
        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.existsByGroupAndUser(group, sai)).thenReturn(true);
        when(balanceService.getBalances(10L, "sai@example.com")).thenReturn(List.of(
                balance(1L, "Sai", "4000"),
                balance(2L, "Arun", "-2000"),
                balance(3L, "Rahul", "-2000")
        ));

        when(financialMapper.toSuggestion(2L, "Arun", 1L, "Sai", bd("2000")))
                .thenReturn(suggestion(2L, "Arun", 1L, "Sai", "2000"));
        when(financialMapper.toSuggestion(3L, "Rahul", 1L, "Sai", bd("2000")))
                .thenReturn(suggestion(3L, "Rahul", 1L, "Sai", "2000"));

        List<SettlementSuggestion> suggestions = settlementSuggestionService.getSettlementSuggestions(
                10L,
                "sai@example.com"
        );

        assertEquals(2, suggestions.size());
        assertEquals(2L, suggestions.get(0).getFromUserId());
        assertEquals(1L, suggestions.get(0).getToUserId());
        assertEquals(bd("2000"), suggestions.get(0).getAmount());
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

    private static BalanceResponse balance(Long id, String name, String value) {
        return BalanceResponse.builder()
                .userId(id)
                .name(name)
                .balance(bd(value))
                .build();
    }

    private static SettlementSuggestion suggestion(Long fromId, String fromName, Long toId, String toName, String value) {
        return SettlementSuggestion.builder()
                .fromUserId(fromId)
                .fromUserName(fromName)
                .toUserId(toId)
                .toUserName(toName)
                .amount(bd(value))
                .build();
    }

    private static BigDecimal bd(String value) {
        return new BigDecimal(value).setScale(2);
    }
}
