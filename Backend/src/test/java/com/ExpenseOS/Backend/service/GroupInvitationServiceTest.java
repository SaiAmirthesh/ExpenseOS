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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GroupInvitationServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private GroupRepository groupRepository;
    @Mock private GroupMemberRepository groupMemberRepository;
    @Mock private GroupInvitationRepository groupInvitationRepository;
    @Mock private InvitationMapper invitationMapper;

    @InjectMocks private GroupInvitationService groupInvitationService;

    @Test
    void inviteUserCreatesPendingInvitation() {
        User owner = user(1L, "Sai", "sai@gmail.com");
        User invited = user(2L, "Arun", "arun@gmail.com");
        Group group = group(10L, "Goa Trip", owner);
        InviteUserRequest request = inviteRequest("arun@gmail.com");

        when(userRepository.findByEmail("sai@gmail.com")).thenReturn(Optional.of(owner));
        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.existsByGroupAndUser(group, owner)).thenReturn(true);
        when(userRepository.findByEmail("arun@gmail.com")).thenReturn(Optional.of(invited));
        when(groupMemberRepository.existsByGroupAndUser(group, invited)).thenReturn(false);
        when(groupInvitationRepository.existsByGroupAndInvitedUserAndStatus(group, invited, InvitationStatus.PENDING))
                .thenReturn(false);
        when(groupInvitationRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(invitationMapper.toResponse(any())).thenAnswer(invocation -> toResponse(invocation.getArgument(0)));

        InvitationResponse response = groupInvitationService.inviteUser(10L, request, "sai@gmail.com");

        ArgumentCaptor<GroupInvitation> captor = ArgumentCaptor.forClass(GroupInvitation.class);
        verify(groupInvitationRepository).save(captor.capture());
        GroupInvitation saved = captor.getValue();
        assertEquals(group, saved.getGroup());
        assertEquals(owner, saved.getInvitedBy());
        assertEquals(invited, saved.getInvitedUser());
        assertEquals(InvitationStatus.PENDING, saved.getStatus());
        assertEquals(InvitationStatus.PENDING, response.getStatus());
    }

    @Test
    void duplicatePendingInviteIsRejected() {
        User owner = user(1L, "Sai", "sai@gmail.com");
        User invited = user(2L, "Arun", "arun@gmail.com");
        Group group = group(10L, "Goa Trip", owner);
        InviteUserRequest request = inviteRequest("arun@gmail.com");

        when(userRepository.findByEmail("sai@gmail.com")).thenReturn(Optional.of(owner));
        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.existsByGroupAndUser(group, owner)).thenReturn(true);
        when(userRepository.findByEmail("arun@gmail.com")).thenReturn(Optional.of(invited));
        when(groupMemberRepository.existsByGroupAndUser(group, invited)).thenReturn(false);
        when(groupInvitationRepository.existsByGroupAndInvitedUserAndStatus(group, invited, InvitationStatus.PENDING))
                .thenReturn(true);

        assertThrows(InvalidOperationException.class,
                () -> groupInvitationService.inviteUser(10L, request, "sai@gmail.com"));

        verify(groupInvitationRepository, never()).save(any());
    }

    @Test
    void existingMemberCannotBeInvited() {
        User owner = user(1L, "Sai", "sai@gmail.com");
        User invited = user(2L, "Arun", "arun@gmail.com");
        Group group = group(10L, "Goa Trip", owner);
        InviteUserRequest request = inviteRequest("arun@gmail.com");

        when(userRepository.findByEmail("sai@gmail.com")).thenReturn(Optional.of(owner));
        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.existsByGroupAndUser(group, owner)).thenReturn(true);
        when(userRepository.findByEmail("arun@gmail.com")).thenReturn(Optional.of(invited));
        when(groupMemberRepository.existsByGroupAndUser(group, invited)).thenReturn(true);

        assertThrows(InvalidOperationException.class,
                () -> groupInvitationService.inviteUser(10L, request, "sai@gmail.com"));
    }

    @Test
    void acceptInvitationCreatesGroupMember() {
        User invited = user(2L, "Arun", "arun@gmail.com");
        User owner = user(1L, "Sai", "sai@gmail.com");
        Group group = group(10L, "Goa Trip", owner);
        GroupInvitation invitation = invitation(99L, group, owner, invited, InvitationStatus.PENDING);

        when(userRepository.findByEmail("arun@gmail.com")).thenReturn(Optional.of(invited));
        when(groupInvitationRepository.findByIdAndInvitedUser(99L, invited)).thenReturn(Optional.of(invitation));
        when(groupMemberRepository.existsByGroupAndUser(group, invited)).thenReturn(false);
        when(groupMemberRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(groupInvitationRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(invitationMapper.toResponse(any())).thenAnswer(invocation -> toResponse(invocation.getArgument(0)));

        InvitationResponse response = groupInvitationService.acceptInvitation(99L, "arun@gmail.com");

        verify(groupMemberRepository).save(any(GroupMember.class));
        assertEquals(InvitationStatus.ACCEPTED, response.getStatus());
        assertEquals(invited, invitation.getInvitedUser());
        assertEquals(InvitationStatus.ACCEPTED, invitation.getStatus());
    }

    @Test
    void rejectInvitationMarksRejected() {
        User invited = user(2L, "Arun", "arun@gmail.com");
        User owner = user(1L, "Sai", "sai@gmail.com");
        Group group = group(10L, "Goa Trip", owner);
        GroupInvitation invitation = invitation(99L, group, owner, invited, InvitationStatus.PENDING);

        when(userRepository.findByEmail("arun@gmail.com")).thenReturn(Optional.of(invited));
        when(groupInvitationRepository.findByIdAndInvitedUser(99L, invited)).thenReturn(Optional.of(invitation));
        when(groupInvitationRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(invitationMapper.toResponse(any())).thenAnswer(invocation -> toResponse(invocation.getArgument(0)));

        InvitationResponse response = groupInvitationService.rejectInvitation(99L, "arun@gmail.com");

        assertEquals(InvitationStatus.REJECTED, response.getStatus());
    }

    @Test
    void unauthorizedAcceptIsBlocked() {
        User invited = user(2L, "Arun", "arun@gmail.com");
        User attacker = user(3L, "Rahul", "rahul@gmail.com");
        User owner = user(1L, "Sai", "sai@gmail.com");
        Group group = group(10L, "Goa Trip", owner);
        GroupInvitation invitation = invitation(99L, group, owner, invited, InvitationStatus.PENDING);

        when(userRepository.findByEmail("rahul@gmail.com")).thenReturn(Optional.of(attacker));
        when(groupInvitationRepository.findByIdAndInvitedUser(99L, attacker)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> groupInvitationService.acceptInvitation(99L, "rahul@gmail.com"));
    }

    @Test
    void unauthorizedRejectIsBlocked() {
        User invited = user(2L, "Arun", "arun@gmail.com");
        User attacker = user(3L, "Rahul", "rahul@gmail.com");
        User owner = user(1L, "Sai", "sai@gmail.com");
        Group group = group(10L, "Goa Trip", owner);
        GroupInvitation invitation = invitation(99L, group, owner, invited, InvitationStatus.PENDING);

        when(userRepository.findByEmail("rahul@gmail.com")).thenReturn(Optional.of(attacker));
        when(groupInvitationRepository.findByIdAndInvitedUser(99L, attacker)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> groupInvitationService.rejectInvitation(99L, "rahul@gmail.com"));
    }

    @Test
    void nonOwnerCannotInvite() {
        User owner = user(1L, "Sai", "sai@gmail.com");
        User member = user(2L, "Arun", "arun@gmail.com");
        User outsider = user(3L, "Rahul", "rahul@gmail.com");
        Group group = group(10L, "Goa Trip", owner);
        InviteUserRequest request = inviteRequest("arun@gmail.com");

        when(userRepository.findByEmail("rahul@gmail.com")).thenReturn(Optional.of(outsider));
        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));

        assertThrows(ForbiddenOperationException.class,
                () -> groupInvitationService.inviteUser(10L, request, "rahul@gmail.com"));

        verify(userRepository, never()).findByEmail("arun@gmail.com");
    }

    private static User user(Long id, String name, String email) {
        User user = User.builder().name(name).email(email).password("x").enabled(true).build();
        user.setId(id);
        return user;
    }

    private static Group group(Long id, String name, User createdBy) {
        Group group = Group.builder().name(name).description("desc").createdBy(createdBy).build();
        group.setId(id);
        return group;
    }

    private static GroupInvitation invitation(
            Long id,
            Group group,
            User invitedBy,
            User invitedUser,
            InvitationStatus status
    ) {
        GroupInvitation invitation = GroupInvitation.builder()
                .group(group)
                .invitedBy(invitedBy)
                .invitedUser(invitedUser)
                .status(status)
                .respondedAt(LocalDateTime.now())
                .build();
        invitation.setId(id);
        return invitation;
    }

    private static InviteUserRequest inviteRequest(String email) {
        InviteUserRequest request = new InviteUserRequest();
        request.setEmail(email);
        return request;
    }

    private static InvitationResponse toResponse(GroupInvitation invitation) {
        return InvitationResponse.builder()
                .id(invitation.getId())
                .groupId(invitation.getGroup().getId())
                .groupName(invitation.getGroup().getName())
                .invitedBy(invitation.getInvitedBy().getName())
                .invitedUser(invitation.getInvitedUser().getName())
                .status(invitation.getStatus())
                .build();
    }
}
