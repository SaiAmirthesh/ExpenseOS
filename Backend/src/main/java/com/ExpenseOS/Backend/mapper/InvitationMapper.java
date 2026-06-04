package com.ExpenseOS.Backend.mapper;

import com.ExpenseOS.Backend.dto.invitations.InvitationResponse;
import com.ExpenseOS.Backend.entity.GroupInvitation;
import org.springframework.stereotype.Component;

@Component
public class InvitationMapper {

    public InvitationResponse toResponse(GroupInvitation invitation) {
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
