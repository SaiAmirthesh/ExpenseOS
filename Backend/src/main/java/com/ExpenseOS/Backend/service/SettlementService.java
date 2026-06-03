package com.ExpenseOS.Backend.service;

import com.ExpenseOS.Backend.dto.settlements.SettlementRequest;
import com.ExpenseOS.Backend.dto.settlements.SettlementResponse;
import com.ExpenseOS.Backend.entity.Group;
import com.ExpenseOS.Backend.entity.Settlement;
import com.ExpenseOS.Backend.entity.SettlementStatus;
import com.ExpenseOS.Backend.entity.User;
import com.ExpenseOS.Backend.exception.ForbiddenOperationException;
import com.ExpenseOS.Backend.exception.InvalidOperationException;
import com.ExpenseOS.Backend.exception.ResourceNotFoundException;
import com.ExpenseOS.Backend.mapper.FinancialMapper;
import com.ExpenseOS.Backend.repository.GroupMemberRepository;
import com.ExpenseOS.Backend.repository.GroupRepository;
import com.ExpenseOS.Backend.repository.SettlementRepository;
import com.ExpenseOS.Backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SettlementService {

    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final SettlementRepository settlementRepository;
    private final SettlementSuggestionService settlementSuggestionService;
    private final FinancialMapper financialMapper;

    private User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User Not Found"));
    }

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

    private Settlement getSettlementById(Long settlementId) {
        return settlementRepository.findById(settlementId)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement Not Found"));
    }

    private void assertReceiver(User currentUser, Settlement settlement) {
        if (!settlement.getToUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenOperationException("Only receiver can perform this action");
        }
    }

    private void assertPending(Settlement settlement) {
        if (settlement.getStatus() != SettlementStatus.PENDING) {
            throw new InvalidOperationException("Only pending settlements can be processed");
        }
    }

    @Transactional
    public SettlementResponse createSettlement(SettlementRequest request, String currentUserEmail) {
        User sender = getUserByEmail(currentUserEmail);
        Group group = getGroupById(request.getGroupId());
        validateMembership(group, sender);

        User receiver = getUserById(request.getToUserId());
        validateMembership(group, receiver);

        if (sender.getId().equals(receiver.getId())) {
            throw new InvalidOperationException("Sender and receiver must be different");
        }

        java.math.BigDecimal outstandingAmount = settlementSuggestionService.getSuggestedAmountForPair(
                group.getId(),
                sender.getId(),
                receiver.getId(),
                currentUserEmail
        );

        java.math.BigDecimal pendingAmount = settlementRepository.sumPendingAmountBetweenUsers(
                group.getId(),
                sender.getId(),
                receiver.getId(),
                SettlementStatus.PENDING
        );

        outstandingAmount = outstandingAmount.subtract(pendingAmount);

        if (outstandingAmount.compareTo(request.getAmount()) < 0) {
            throw new InvalidOperationException("Settlement amount exceeds outstanding debt");
        }

        Settlement settlement = Settlement.builder()
                .group(group)
                .fromUser(sender)
                .toUser(receiver)
                .amount(request.getAmount())
                .note(request.getNote())
                .status(SettlementStatus.PENDING)
                .settledAt(LocalDateTime.now())
                .build();

        return financialMapper.toSettlementResponse(settlementRepository.save(settlement));
    }

    @Transactional(readOnly = true)
    public List<SettlementResponse> getPendingSettlements(String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        return settlementRepository.findByToUserIdAndStatusOrderByCreatedAtAsc(
                currentUser.getId(),
                SettlementStatus.PENDING
        ).stream()
                .map(financialMapper::toSettlementResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SettlementResponse> getSettlements(Long groupId, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        Group group = getGroupById(groupId);
        validateMembership(group, currentUser);

        return settlementRepository.findByGroupIdOrderByCreatedAtDesc(groupId).stream()
                .map(financialMapper::toSettlementResponse)
                .toList();
    }

    @Transactional
    public SettlementResponse approveSettlement(Long settlementId, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        Settlement settlement = getSettlementById(settlementId);
        assertReceiver(currentUser, settlement);
        assertPending(settlement);

        settlement.setStatus(SettlementStatus.APPROVED);
        settlement.setApprovedAt(LocalDateTime.now());

        return financialMapper.toSettlementResponse(settlementRepository.save(settlement));
    }

    @Transactional
    public SettlementResponse rejectSettlement(Long settlementId, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        Settlement settlement = getSettlementById(settlementId);
        assertReceiver(currentUser, settlement);
        assertPending(settlement);

        settlement.setStatus(SettlementStatus.REJECTED);

        return financialMapper.toSettlementResponse(settlementRepository.save(settlement));
    }
}
