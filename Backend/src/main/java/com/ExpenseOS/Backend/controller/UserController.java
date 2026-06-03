package com.ExpenseOS.Backend.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @GetMapping("/me")
    public String me(
            Authentication authentication
    ){
        return authentication.getName();
    }
}