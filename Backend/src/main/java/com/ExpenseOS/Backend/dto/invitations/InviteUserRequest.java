package com.ExpenseOS.Backend.dto.invitations;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InviteUserRequest {

    @Email(message = "Enter a valid email")
    @NotBlank(message = "Email is required")
    private String email;
}
