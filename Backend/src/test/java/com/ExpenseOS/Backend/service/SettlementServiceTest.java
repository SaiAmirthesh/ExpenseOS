package com.ExpenseOS.Backend.service;

import com.ExpenseOS.Backend.dto.settlements.SettlementRequest;
import com.ExpenseOS.Backend.dto.settlements.SettlementResponse;
import com.ExpenseOS.Backend.entity.Group;
import com.ExpenseOS.Backend.entity.Settlement;
import com.ExpenseOS.Backend.entity.SettlementStatus;
import com.ExpenseOS.Backend.entity.User;
import com.ExpenseOS.Backend.exception.ForbiddenOperationException;
import com.ExpenseOS.Backend.exception.InvalidOperationException;
import com.ExpenseOS.Backend.mapper.FinancialMapper;
import com.ExpenseOS.Backend.repository.GroupMemberRepository;
import com.ExpenseOS.Backend.repository.GroupRepository;
import com.ExpenseOS.Backend.repository.SettlementRepository;
import com.ExpenseOS.Backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SettlementServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private GroupRepository groupRepository;
    @Mock private GroupMemberRepository groupMemberRepository;
    @Mock private SettlementRepository settlementRepository;
    @Mock private SettlementSuggestionService settlementSuggestionService;
    @Mock private FinancialMapper financialMapper;

    @InjectMocks private SettlementService settlementService;

    @Test
    void createsPendingSettlementWithAuthenticatedSender() {
        User sender = user(1L, "Sai", "sai@example.com");
        User receiver = user(2L, "Arun", "arun@example.com");
        Group group = group(10L, sender);

        SettlementRequest request = new SettlementRequest();
        request.setGroupId(10L);
        request.setToUserId(2L);
        request.setAmount(bd("1000"));
        request.setNote("UPI");

        when(userRepository.findByEmail("sai@example.com")).thenReturn(Optional.of(sender));
        when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));
        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.existsByGroupAndUser(group, sender)).thenReturn(true);
        when(groupMemberRepository.existsByGroupAndUser(group, receiver)).thenReturn(true);
        when(settlementSuggestionService.getSuggestedAmountForPair(10L, 1L, 2L, "sai@example.com"))
                .thenReturn(bd("2000"));
        when(settlementRepository.sumPendingAmountBetweenUsers(10L, 1L, 2L, SettlementStatus.PENDING))
                .thenReturn(bd("0"));
        when(settlementRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(financialMapper.toSettlementResponse(any())).thenAnswer(invocation -> toResponse(invocation.getArgument(0)));

        SettlementResponse response = settlementService.createSettlement(request, "sai@example.com");

        ArgumentCaptor<Settlement> captor = ArgumentCaptor.forClass(Settlement.class);
        verify(settlementRepository).save(captor.capture());
        Settlement saved = captor.getValue();
        assertEquals(SettlementStatus.PENDING, saved.getStatus());
        assertEquals(sender, saved.getFromUser());
        assertEquals(receiver, saved.getToUser());
        assertEquals(bd("1000"), saved.getAmount());
        assertEquals("UPI", saved.getNote());
        assertNotNull(response);
        assertEquals(SettlementStatus.PENDING, response.getStatus());
    }

    @Test
    void rejectsOverpaymentAttempt() {
        User sender = user(1L, "Sai", "sai@example.com");
        User receiver = user(2L, "Arun", "arun@example.com");
        Group group = group(10L, sender);

        SettlementRequest request = new SettlementRequest();
        request.setGroupId(10L);
        request.setToUserId(2L);
        request.setAmount(bd("5000"));
        request.setNote("UPI");

        when(userRepository.findByEmail("sai@example.com")).thenReturn(Optional.of(sender));
        when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));
        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.existsByGroupAndUser(group, sender)).thenReturn(true);
        when(groupMemberRepository.existsByGroupAndUser(group, receiver)).thenReturn(true);
        when(settlementSuggestionService.getSuggestedAmountForPair(10L, 1L, 2L, "sai@example.com"))
                .thenReturn(bd("2000"));
        when(settlementRepository.sumPendingAmountBetweenUsers(10L, 1L, 2L, SettlementStatus.PENDING))
                .thenReturn(bd("0"));

        assertThrows(InvalidOperationException.class,
                () -> settlementService.createSettlement(request, "sai@example.com"));

        verify(settlementRepository, never()).save(any());
    }

    @Test
    void approvesOnlyWhenReceiverCallsApprove() {
        User sender = user(1L, "Sai", "sai@example.com");
        User receiver = user(2L, "Arun", "arun@example.com");
        Group group = group(10L, sender);
        Settlement settlement = pendingSettlement(99L, group, sender, receiver);

        when(userRepository.findByEmail("arun@example.com")).thenReturn(Optional.of(receiver));
        when(settlementRepository.findById(99L)).thenReturn(Optional.of(settlement));
        when(settlementRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(financialMapper.toSettlementResponse(any())).thenAnswer(invocation -> toResponse(invocation.getArgument(0)));

        SettlementResponse response = settlementService.approveSettlement(99L, "arun@example.com");

        assertEquals(SettlementStatus.APPROVED, response.getStatus());
        assertNotNull(response.getApprovedAt());
    }

    @Test
    void rejectsOnlyWhenReceiverCallsReject() {
        User sender = user(1L, "Sai", "sai@example.com");
        User receiver = user(2L, "Arun", "arun@example.com");
        Group group = group(10L, sender);
        Settlement settlement = pendingSettlement(99L, group, sender, receiver);

        when(userRepository.findByEmail("arun@example.com")).thenReturn(Optional.of(receiver));
        when(settlementRepository.findById(99L)).thenReturn(Optional.of(settlement));
        when(settlementRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(financialMapper.toSettlementResponse(any())).thenAnswer(invocation -> toResponse(invocation.getArgument(0)));

        SettlementResponse response = settlementService.rejectSettlement(99L, "arun@example.com");

        assertEquals(SettlementStatus.REJECTED, response.getStatus());
    }

    @Test
    void returnsPendingSettlementsForCurrentReceiver() {
        User receiver = user(2L, "Arun", "arun@example.com");
        User sender = user(1L, "Sai", "sai@example.com");
        Group group = group(10L, sender);
        Settlement settlement = pendingSettlement(99L, group, sender, receiver);

        when(userRepository.findByEmail("arun@example.com")).thenReturn(Optional.of(receiver));
        when(settlementRepository.findByToUserIdAndStatusOrderByCreatedAtAsc(2L, SettlementStatus.PENDING))
                .thenReturn(List.of(settlement));
        when(financialMapper.toSettlementResponse(any())).thenAnswer(invocation -> toResponse(invocation.getArgument(0)));

        List<SettlementResponse> pending = settlementService.getPendingSettlements("arun@example.com");

        assertEquals(1, pending.size());
        assertEquals(SettlementStatus.PENDING, pending.get(0).getStatus());
        assertEquals(2L, pending.get(0).getToUserId());
    }

    @Test
    void blocksUnauthorizedApprovalAttempt() {
        User sender = user(1L, "Sai", "sai@example.com");
        User receiver = user(2L, "Arun", "arun@example.com");
        User attacker = user(3L, "Rahul", "rahul@example.com");
        Group group = group(10L, sender);
        Settlement settlement = pendingSettlement(99L, group, sender, receiver);

        when(userRepository.findByEmail("rahul@example.com")).thenReturn(Optional.of(attacker));
        when(settlementRepository.findById(99L)).thenReturn(Optional.of(settlement));

        assertThrows(ForbiddenOperationException.class,
                () -> settlementService.approveSettlement(99L, "rahul@example.com"));
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

    private static Settlement pendingSettlement(Long id, Group group, User sender, User receiver) {
        Settlement settlement = Settlement.builder()
                .group(group)
                .fromUser(sender)
                .toUser(receiver)
                .amount(bd("1000"))
                .note("UPI")
                .status(SettlementStatus.PENDING)
                .settledAt(LocalDateTime.now())
                .build();
        settlement.setId(id);
        return settlement;
    }

    private static SettlementResponse toResponse(Settlement settlement) {
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

    private static BigDecimal bd(String value) {
        return new BigDecimal(value).setScale(2);
    }
}
