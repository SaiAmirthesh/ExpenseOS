package com.ExpenseOS.Backend.dto.invitations;

import com.ExpenseOS.Backend.entity.InvitationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvitationResponse {

    private Long id;
    private Long groupId;
    private String groupName;
    private String invitedBy;
    private String invitedUser;
    private InvitationStatus status;
}
