package com.ExpenseOS.Backend.mapper;

import com.ExpenseOS.Backend.dto.balances.BalanceResponse;
import com.ExpenseOS.Backend.dto.settlements.SettlementResponse;
import com.ExpenseOS.Backend.dto.settlements.SettlementSuggestion;
import com.ExpenseOS.Backend.entity.Settlement;
import com.ExpenseOS.Backend.entity.User;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class FinancialMapper {

    public BalanceResponse toBalanceResponse(User user, BigDecimal balance) {
        return BalanceResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .balance(balance)
                .build();
    }

    public SettlementSuggestion toSuggestion(
            Long fromUserId,
            String fromUserName,
            Long toUserId,
            String toUserName,
            BigDecimal amount
    ) {
        return SettlementSuggestion.builder()
                .fromUserId(fromUserId)
                .fromUserName(fromUserName)
                .toUserId(toUserId)
                .toUserName(toUserName)
                .amount(amount)
                .build();
    }

    public SettlementResponse toSettlementResponse(Settlement settlement) {
        return SettlementResponse.builder()
                .id(settlement.getId())
                .groupId(settlement.getGroup().getId())
                .groupName(settlement.getGroup().getName())
                .fromUserId(settlement.getFromUser().getId())
                .fromUserName(settlement.getFromUser().getName())
                .toUserId(settlement.getToUser().getId())
                .toUserName(settlement.getToUser().getName())
                .amount(settlement.getAmount())
                .note(settlement.getNote())
                .status(settlement.getStatus())
                .settledAt(settlement.getSettledAt())
                .approvedAt(settlement.getApprovedAt())
                .createdAt(settlement.getCreatedAt())
                .build();
    }
}
