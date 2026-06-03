package com.ExpenseOS.Backend.dto.groups;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddMemberRequest {
    @Email
    @NotBlank
    private String email;
}
