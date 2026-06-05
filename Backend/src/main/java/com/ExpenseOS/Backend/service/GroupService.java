package com.ExpenseOS.Backend.service;

import com.ExpenseOS.Backend.dto.groups.AddMemberRequest;
import com.ExpenseOS.Backend.dto.groups.CreateGroupRequest;
import com.ExpenseOS.Backend.dto.groups.GroupResponse;
import com.ExpenseOS.Backend.dto.groups.MemberResponse;
import com.ExpenseOS.Backend.entity.*;
import com.ExpenseOS.Backend.exception.ForbiddenOperationException;
import com.ExpenseOS.Backend.exception.InvalidOperationException;
import com.ExpenseOS.Backend.exception.ResourceNotFoundException;
import com.ExpenseOS.Backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final SettlementRepository settlementRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseSplitRepository expenseSplitRepository;
    private final GroupInvitationRepository groupInvitationRepository;

    // ── Helpers ──────────────────────────────────────────────────────────────

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User Not Found"));
    }

    private User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User Not Found"));
    }

    private Group findGroupById(long groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group Not Found"));
    }

    private void assertActiveGroupOwner(Group group, String email) {
        User requester = getUserByEmail(email);
        if (!group.getCreatedBy().getId().equals(requester.getId())) {
            throw new ForbiddenOperationException("Only the group owner can perform this action");
        }
        if (!groupMemberRepository.existsByGroupAndUser(group, requester)) {
            throw new ForbiddenOperationException("You are no longer a member of this group");
        }
    }

    private GroupResponse mapToResponse(Group group) {
        return GroupResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .description(group.getDescription())
                .createdBy(group.getCreatedBy().getEmail())
                .build();
    }

    /** Calculate a member's net balance in a group (positive = owed to them, negative = they owe) */
    private BigDecimal getMemberBalance(Group group, User user) {
        BigDecimal ZERO = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        // What they paid towards group expenses
        BigDecimal paid = expenseRepository.sumPaidAmountsByGroup(group.getId())
                .stream()
                .filter(p -> p.getUserId().equals(user.getId()))
                .map(p -> p.getAmount() == null ? ZERO : p.getAmount())
                .reduce(ZERO, BigDecimal::add);

        // What they owe from splits
        BigDecimal owed = expenseSplitRepository.sumOwedAmountsByGroup(group.getId())
                .stream()
                .filter(p -> p.getUserId().equals(user.getId()))
                .map(p -> p.getAmount() == null ? ZERO : p.getAmount())
                .reduce(ZERO, BigDecimal::add);

        // Approved settlements they sent (reduces what they owe)
        BigDecimal sent = settlementRepository.sumSentAmountsByGroup(group.getId(), SettlementStatus.APPROVED)
                .stream()
                .filter(p -> p.getUserId().equals(user.getId()))
                .map(p -> p.getAmount() == null ? ZERO : p.getAmount())
                .reduce(ZERO, BigDecimal::add);

        // Approved settlements they received (reduces what they are owed)
        BigDecimal received = settlementRepository.sumReceivedAmountsByGroup(group.getId(), SettlementStatus.APPROVED)
                .stream()
                .filter(p -> p.getUserId().equals(user.getId()))
                .map(p -> p.getAmount() == null ? ZERO : p.getAmount())
                .reduce(ZERO, BigDecimal::add);

        return paid.subtract(owed).add(sent).subtract(received).setScale(2, RoundingMode.HALF_UP);
    }

    // ── Public API ────────────────────────────────────────────────────────────

    public GroupResponse createGroup(CreateGroupRequest request, String email) {
        User user = getUserByEmail(email);
        Group group = Group.builder()
                .name(request.getName())
                .description(request.getDescription())
                .createdBy(user)
                .build();
        Group savedGroup = groupRepository.save(group);
        groupMemberRepository.save(GroupMember.builder().group(savedGroup).user(user).build());
        return mapToResponse(savedGroup);
    }

    public List<GroupResponse> listGroups(String email) {
        User user = getUserByEmail(email);
        return groupMemberRepository.findByUser(user).stream()
                .map(GroupMember::getGroup)
                .map(this::mapToResponse)
                .toList();
    }

    public GroupResponse getGroupById(long groupId) {
        return mapToResponse(findGroupById(groupId));
    }

    @Transactional
    public void deleteGroup(long groupId, String email) {
        Group group = findGroupById(groupId);
        assertActiveGroupOwner(group, email);

        // Block if any settlements are still PENDING
        if (settlementRepository.existsByGroupIdAndStatus(group.getId(), SettlementStatus.PENDING)) {
            throw new InvalidOperationException(
                    "Cannot delete group: resolve all pending settlements first.");
        }

        // Cascade delete in FK-safe order:
        // 1. ExpenseSplits (reference Expenses)
        expenseSplitRepository.deleteByExpenseGroupId(group.getId());
        expenseSplitRepository.flush();

        // 2. Expenses (reference Group)
        expenseRepository.deleteByGroup(group);
        expenseRepository.flush();

        // 3. Settlements (reference Group)
        settlementRepository.deleteByGroup(group);
        settlementRepository.flush();

        // 4. Invitations (reference Group)
        groupInvitationRepository.deleteByGroup(group);
        groupInvitationRepository.flush();

        // 5. Members (reference Group)
        groupMemberRepository.deleteByGroup(group);
        groupMemberRepository.flush();

        // 6. Group itself
        groupRepository.delete(group);
    }

    @Transactional
    public void leaveGroup(long groupId, String email) {
        Group group = findGroupById(groupId);
        User user = getUserByEmail(email);

        // Owner cannot leave — they must transfer ownership or delete the group
        if (group.getCreatedBy().getId().equals(user.getId())) {
            throw new ForbiddenOperationException(
                    "Group owner cannot leave. Delete the group or transfer ownership.");
        }

        if (!groupMemberRepository.existsByGroupAndUser(group, user)) {
            throw new InvalidOperationException("You are not a member of this group");
        }

        // Block if the user has any PENDING settlements in this group
        if (settlementRepository.existsByGroupIdAndStatus(group.getId(), SettlementStatus.PENDING)) {
            throw new InvalidOperationException(
                    "Resolve all pending settlements before leaving the group.");
        }

        // Check net balance is exactly zero (no outstanding debt/credit)
        BigDecimal balance = getMemberBalance(group, user);
        if (balance.compareTo(BigDecimal.ZERO) != 0) {
            throw new InvalidOperationException(
                    "You cannot leave the group while you have an outstanding balance of ₹"
                    + balance.abs().toPlainString() + ". Settle all dues first.");
        }

        groupMemberRepository.deleteByGroupAndUser(group, user);
    }

    public MemberResponse addMember(Long groupId, AddMemberRequest request, String currentUserEmail) {
        Group group = findGroupById(groupId);
        assertActiveGroupOwner(group, currentUserEmail);
        User user = getUserByEmail(request.getEmail());
        if (groupMemberRepository.existsByGroupAndUser(group, user)) {
            throw new InvalidOperationException("User already exists in the group");
        }
        groupMemberRepository.save(GroupMember.builder().group(group).user(user).build());
        return MemberResponse.builder().id(user.getId()).name(user.getName()).email(user.getEmail()).build();
    }

    public List<MemberResponse> getMember(Long groupId) {
        Group group = findGroupById(groupId);
        return groupMemberRepository.findByGroup(group).stream()
                .map(member -> MemberResponse.builder()
                        .id(member.getUser().getId())
                        .name(member.getUser().getName())
                        .email(member.getUser().getEmail())
                        .build())
                .toList();
    }

    @Transactional
    public void removeMember(Long groupId, Long userId, String currentUserEmail) {
        Group group = findGroupById(groupId);
        assertActiveGroupOwner(group, currentUserEmail);
        User user = getUserById(userId);
        if (group.getCreatedBy().getId().equals(user.getId())) {
            throw new ForbiddenOperationException("You cannot remove the group owner");
        }
        groupMemberRepository.deleteByGroupAndUser(group, user);
    }
}
