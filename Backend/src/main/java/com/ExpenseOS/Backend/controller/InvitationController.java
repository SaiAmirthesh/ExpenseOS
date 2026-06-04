package com.ExpenseOS.Backend.controller;

import com.ExpenseOS.Backend.dto.invitations.InviteUserRequest;
import com.ExpenseOS.Backend.dto.invitations.InvitationResponse;
import com.ExpenseOS.Backend.service.GroupInvitationService;
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
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class InvitationController {

    private final GroupInvitationService groupInvitationService;

    @PostMapping("/groups/{groupId}/invite")
    public InvitationResponse inviteUser(
            @PathVariable Long groupId,
            @Valid @RequestBody InviteUserRequest request,
            Authentication authentication
    ) {
        return groupInvitationService.inviteUser(groupId, request, authentication.getName());
    }

    @GetMapping("/invitations")
    public List<InvitationResponse> getInvitations(Authentication authentication) {
        return groupInvitationService.getInvitations(authentication.getName());
    }

    @GetMapping("/invitations/pending")
    public List<InvitationResponse> getPendingInvitations(Authentication authentication) {
        return groupInvitationService.getPendingInvitations(authentication.getName());
    }

    @PostMapping("/invitations/{id}/accept")
    public InvitationResponse acceptInvitation(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return groupInvitationService.acceptInvitation(id, authentication.getName());
    }

    @PostMapping("/invitations/{id}/reject")
    public InvitationResponse rejectInvitation(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return groupInvitationService.rejectInvitation(id, authentication.getName());
    }
}
