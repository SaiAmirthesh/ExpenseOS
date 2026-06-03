package com.ExpenseOS.Backend.service;

import com.ExpenseOS.Backend.dto.balances.BalanceResponse;
import com.ExpenseOS.Backend.dto.settlements.SettlementSuggestion;
import com.ExpenseOS.Backend.entity.Group;
import com.ExpenseOS.Backend.entity.User;
import com.ExpenseOS.Backend.exception.InvalidOperationException;
import com.ExpenseOS.Backend.exception.ResourceNotFoundException;
import com.ExpenseOS.Backend.mapper.FinancialMapper;
import com.ExpenseOS.Backend.repository.GroupMemberRepository;
import com.ExpenseOS.Backend.repository.GroupRepository;
import com.ExpenseOS.Backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SettlementSuggestionService {

    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final BalanceService balanceService;
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

    private List<BalanceHolder> creditors(List<BalanceResponse> balances) {
        return balances.stream()
                .filter(balance -> balance.getBalance().compareTo(BigDecimal.ZERO) > 0)
                .map(balance -> new BalanceHolder(
                        balance.getUserId(),
                        balance.getName(),
                        balance.getBalance()
                ))
                .sorted(Comparator.comparing(BalanceHolder::amount).reversed())
                .toList();
    }

    private List<BalanceHolder> debtors(List<BalanceResponse> balances) {
        return balances.stream()
                .filter(balance -> balance.getBalance().compareTo(BigDecimal.ZERO) < 0)
                .map(balance -> new BalanceHolder(
                        balance.getUserId(),
                        balance.getName(),
                        balance.getBalance().abs()
                ))
                .sorted(Comparator.comparing(BalanceHolder::amount).reversed())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SettlementSuggestion> getSettlementSuggestions(Long groupId, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        Group group = getGroupById(groupId);
        validateMembership(group, currentUser);

        List<BalanceResponse> balances = balanceService.getBalances(groupId, currentUserEmail);
        List<BalanceHolder> creditors = creditors(balances);
        List<BalanceHolder> debtors = debtors(balances);

        List<SettlementSuggestion> suggestions = new ArrayList<>();

        int i = 0;
        int j = 0;
        while (i < debtors.size() && j < creditors.size()) {
            BalanceHolder debtor = debtors.get(i);
            BalanceHolder creditor = creditors.get(j);

            BigDecimal transfer = debtor.amount.min(creditor.amount).setScale(2, RoundingMode.HALF_UP);
            if (transfer.compareTo(BigDecimal.ZERO) > 0) {
                suggestions.add(financialMapper.toSuggestion(
                        debtor.userId,
                        debtor.name,
                        creditor.userId,
                        creditor.name,
                        transfer
                ));
            }

            debtor.amount = debtor.amount.subtract(transfer);
            creditor.amount = creditor.amount.subtract(transfer);

            if (debtor.amount.compareTo(BigDecimal.ZERO) == 0) {
                i++;
            }
            if (creditor.amount.compareTo(BigDecimal.ZERO) == 0) {
                j++;
            }
        }

        return suggestions;
    }

    @Transactional(readOnly = true)
    public BigDecimal getSuggestedAmountForPair(
            Long groupId,
            Long fromUserId,
            Long toUserId,
            String currentUserEmail
    ) {
        return getSettlementSuggestions(groupId, currentUserEmail).stream()
                .filter(suggestion -> suggestion.getFromUserId().equals(fromUserId))
                .filter(suggestion -> suggestion.getToUserId().equals(toUserId))
                .map(SettlementSuggestion::getAmount)
                .findFirst()
                .orElse(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
    }

    private static final class BalanceHolder {
        private final Long userId;
        private final String name;
        private BigDecimal amount;

        private BalanceHolder(Long userId, String name, BigDecimal amount) {
            this.userId = userId;
            this.name = name;
            this.amount = amount.setScale(2, RoundingMode.HALF_UP);
        }

        private BigDecimal amount() {
            return amount;
        }
    }
}
