package com.ExpenseOS.Backend.dto.groups;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MemberResponse {
    private Long id;
    private String name;
    private String email;
}