package com.ExpenseOS.Backend.service;

import com.ExpenseOS.Backend.dto.auth.AuthResponse;
import com.ExpenseOS.Backend.dto.auth.LoginRequest;
import com.ExpenseOS.Backend.dto.auth.RegisterRequest;
import com.ExpenseOS.Backend.entity.User;
import com.ExpenseOS.Backend.exception.InvalidCredentialsException;
import com.ExpenseOS.Backend.exception.ResourceNotFoundException;
import com.ExpenseOS.Backend.exception.UserAlreadyExistsException;
import com.ExpenseOS.Backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public String register(RegisterRequest request){
        if(userRepository.existsByEmail(request.getEmail())){
            throw new UserAlreadyExistsException("Email already exists");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .enabled(true)
                .build();

        userRepository.save(user);
        return "User Registered Successfully";
    }

    public AuthResponse login(LoginRequest request) {
        User user  = userRepository.findByEmail(request.getEmail())
                .orElseThrow(()->new ResourceNotFoundException("User Not Found"));

        boolean matches = passwordEncoder.matches(request.getPassword(), user.getPassword());
        if(!matches){
            throw new InvalidCredentialsException("invalid Credentials");
        }
        String token =
                jwtService.generateToken(user.getEmail());

        return AuthResponse.builder()
                .accessToken(token)
                .email(user.getEmail())
                .name(user.getName())
                .build();
    }



}
