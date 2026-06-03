package com.ExpenseOS.Backend.controller;

import com.ExpenseOS.Backend.dto.balances.BalanceResponse;
import com.ExpenseOS.Backend.dto.settlements.SettlementSuggestion;
import com.ExpenseOS.Backend.service.BalanceService;
import com.ExpenseOS.Backend.service.SettlementSuggestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/groups")
@RequiredArgsConstructor
public class BalanceController {

    private final BalanceService balanceService;
    private final SettlementSuggestionService settlementSuggestionService;

    @GetMapping("/{groupId}/balances")
    public List<BalanceResponse> getBalances(
            @PathVariable Long groupId,
            Authentication authentication
    ) {
        return balanceService.getBalances(groupId, authentication.getName());
    }

    @GetMapping("/{groupId}/settlement-suggestions")
    public List<SettlementSuggestion> getSettlementSuggestions(
            @PathVariable Long groupId,
            Authentication authentication
    ) {
        return settlementSuggestionService.getSettlementSuggestions(groupId, authentication.getName());
    }
}
