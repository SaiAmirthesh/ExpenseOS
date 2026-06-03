package com.ExpenseOS.Backend.controller;

import com.ExpenseOS.Backend.dto.settlements.SettlementRequest;
import com.ExpenseOS.Backend.dto.settlements.SettlementResponse;
import com.ExpenseOS.Backend.service.SettlementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
public class SettlementController {

    private final SettlementService settlementService;

    @PostMapping("/settlements")
    public SettlementResponse createSettlement(
            @Valid @RequestBody SettlementRequest request,
            Authentication authentication
    ) {
        return settlementService.createSettlement(request, authentication.getName());
    }

    @GetMapping("/settlements/pending")
    public List<SettlementResponse> getPendingSettlements(Authentication authentication) {
        return settlementService.getPendingSettlements(authentication.getName());
    }

    @PostMapping("/settlements/{id}/approve")
    public SettlementResponse approveSettlement(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return settlementService.approveSettlement(id, authentication.getName());
    }

    @PostMapping("/settlements/{id}/reject")
    public SettlementResponse rejectSettlement(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return settlementService.rejectSettlement(id, authentication.getName());
    }

    @GetMapping("/groups/{groupId}/settlements")
    public List<SettlementResponse> getSettlements(
            @PathVariable Long groupId,
            Authentication authentication
    ) {
        return settlementService.getSettlements(groupId, authentication.getName());
    }
}
