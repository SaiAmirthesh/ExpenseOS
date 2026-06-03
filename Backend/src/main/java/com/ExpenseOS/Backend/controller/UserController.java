package com.ExpenseOS.Backend.controller;

import com.ExpenseOS.Backend.dto.user.UserResponse;
import com.ExpenseOS.Backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public UserResponse me(
            Authentication authentication
    ){
        return userService.getCurrentUser(authentication.getName());
    }
}