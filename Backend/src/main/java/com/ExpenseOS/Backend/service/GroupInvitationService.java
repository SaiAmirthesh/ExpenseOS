package com.ExpenseOS.Backend.service;

import com.ExpenseOS.Backend.dto.invitations.InviteUserRequest;
import com.ExpenseOS.Backend.dto.invitations.InvitationResponse;
import com.ExpenseOS.Backend.entity.Group;
import com.ExpenseOS.Backend.entity.GroupInvitation;
import com.ExpenseOS.Backend.entity.GroupMember;
import com.ExpenseOS.Backend.entity.InvitationStatus;
import com.ExpenseOS.Backend.entity.User;
import com.ExpenseOS.Backend.exception.ForbiddenOperationException;
import com.ExpenseOS.Backend.exception.InvalidOperationException;
import com.ExpenseOS.Backend.exception.ResourceNotFoundException;
import com.ExpenseOS.Backend.mapper.InvitationMapper;
import com.ExpenseOS.Backend.repository.GroupInvitationRepository;
import com.ExpenseOS.Backend.repository.GroupMemberRepository;
import com.ExpenseOS.Backend.repository.GroupRepository;
import com.ExpenseOS.Backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GroupInvitationService {

    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupInvitationRepository groupInvitationRepository;
    private final InvitationMapper invitationMapper;

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User Not Found"));
    }

    private Group getGroupById(Long groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group Not Found"));
    }

    private void assertGroupOwner(Group group, User user) {
        if (!group.getCreatedBy().getId().equals(user.getId())) {
            throw new ForbiddenOperationException("Only group owner can invite users");
        }
    }

    private void assertMember(Group group, User user) {
        if (!groupMemberRepository.existsByGroupAndUser(group, user)) {
            throw new InvalidOperationException("User must be a member of the group");
        }
    }

    @Transactional
    public InvitationResponse inviteUser(Long groupId, InviteUserRequest request, String currentUserEmail) {
        User owner = getUserByEmail(currentUserEmail);
        Group group = getGroupById(groupId);
        assertGroupOwner(group, owner);
        assertMember(group, owner);

        User invitedUser = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Invited user not found"));

        if (owner.getId().equals(invitedUser.getId())) {
            throw new InvalidOperationException("You cannot invite yourself");
        }

        if (groupMemberRepository.existsByGroupAndUser(group, invitedUser)) {
            throw new InvalidOperationException("User is already a group member");
        }

        if (groupInvitationRepository.existsByGroupAndInvitedUserAndStatus(
                group,
                invitedUser,
                InvitationStatus.PENDING
        )) {
            throw new InvalidOperationException("Pending invitation already exists");
        }

        GroupInvitation invitation = GroupInvitation.builder()
                .group(group)
                .invitedBy(owner)
                .invitedUser(invitedUser)
                .status(InvitationStatus.PENDING)
                .build();

        return invitationMapper.toResponse(groupInvitationRepository.save(invitation));
    }

    @Transactional(readOnly = true)
    public List<InvitationResponse> getInvitations(String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        return groupInvitationRepository
                .findByInvitedByOrInvitedUserOrderByCreatedAtDesc(currentUser, currentUser)
                .stream()
                .map(invitationMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InvitationResponse> getPendingInvitations(String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        return groupInvitationRepository
                .findByInvitedUserAndStatusOrderByCreatedAtDesc(currentUser, InvitationStatus.PENDING)
                .stream()
                .map(invitationMapper::toResponse)
                .toList();
    }

    @Transactional
    public InvitationResponse acceptInvitation(Long invitationId, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        GroupInvitation invitation = groupInvitationRepository.findByIdAndInvitedUser(invitationId, currentUser)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation Not Found"));

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new InvalidOperationException("Invitation is not pending");
        }

        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitation.setRespondedAt(java.time.LocalDateTime.now());

        Group group = invitation.getGroup();
        if (!groupMemberRepository.existsByGroupAndUser(group, currentUser)) {
            GroupMember member = GroupMember.builder()
                    .group(group)
                    .user(currentUser)
                    .build();
            groupMemberRepository.save(member);
        }

        return invitationMapper.toResponse(groupInvitationRepository.save(invitation));
    }

    @Transactional
    public InvitationResponse rejectInvitation(Long invitationId, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        GroupInvitation invitation = groupInvitationRepository.findByIdAndInvitedUser(invitationId, currentUser)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation Not Found"));

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new InvalidOperationException("Invitation is not pending");
        }

        invitation.setStatus(InvitationStatus.REJECTED);
        invitation.setRespondedAt(java.time.LocalDateTime.now());

        return invitationMapper.toResponse(groupInvitationRepository.save(invitation));
    }
}
