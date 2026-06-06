package com.ExpenseOS.Backend.service;

import com.ExpenseOS.Backend.dto.auth.AuthResponse;
import com.ExpenseOS.Backend.dto.auth.ChangePasswordRequest;
import com.ExpenseOS.Backend.dto.auth.LoginRequest;
import com.ExpenseOS.Backend.dto.auth.RefreshTokenRequest;
import com.ExpenseOS.Backend.dto.auth.RegisterRequest;
import com.ExpenseOS.Backend.entity.RefreshToken;
import com.ExpenseOS.Backend.entity.User;
import com.ExpenseOS.Backend.exception.InvalidCredentialsException;
import com.ExpenseOS.Backend.exception.InvalidOperationException;
import com.ExpenseOS.Backend.exception.ResourceNotFoundException;
import com.ExpenseOS.Backend.exception.UserAlreadyExistsException;
import com.ExpenseOS.Backend.repository.RefreshTokenRepository;
import com.ExpenseOS.Backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
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

        String accessToken = jwtService.generateAccessToken(user.getEmail(), user.getTokenVersion());
        String refreshToken = issueRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .email(user.getEmail())
                .name(user.getName())
                .build();
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken storedToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid refresh token"));

        if (storedToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(storedToken);
            throw new InvalidCredentialsException("Refresh token expired");
        }

        User user = storedToken.getUser();
        if (user == null || !Boolean.TRUE.equals(user.getEnabled())) {
            throw new InvalidCredentialsException("User is disabled");
        }

        Long tokenVersion = jwtService.extractTokenVersion(storedToken.getToken());
        if (!tokenVersion.equals(user.getTokenVersion() == null ? 0L : user.getTokenVersion())) {
            refreshTokenRepository.delete(storedToken);
            throw new InvalidCredentialsException("Refresh token is no longer valid");
        }

        refreshTokenRepository.delete(storedToken);

        String accessToken = jwtService.generateAccessToken(user.getEmail(), user.getTokenVersion());
        String refreshToken = issueRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .email(user.getEmail())
                .name(user.getName())
                .build();
    }

    @Transactional
    public String changePassword(String currentUserEmail, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean currentPasswordMatches = passwordEncoder.matches(request.getCurrentPassword(), user.getPassword());
        if (!currentPasswordMatches) {
            throw new InvalidCredentialsException("Current password is incorrect");
        }

        if (request.getConfirmPassword() != null && !request.getConfirmPassword().isBlank()
                && !request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new InvalidOperationException("New password and confirm password do not match");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new InvalidOperationException("New password must be different from current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setTokenVersion(user.getTokenVersion() == null ? 1L : user.getTokenVersion() + 1L);
        userRepository.save(user);
        refreshTokenRepository.deleteByUser(user);

        return "Password changed successfully";
    }

    private String issueRefreshToken(User user) {
        refreshTokenRepository.deleteByUser(user);

        String refreshTokenValue = jwtService.generateRefreshToken(user.getEmail(), user.getTokenVersion());

        RefreshToken refreshToken = RefreshToken.builder()
                .token(refreshTokenValue)
                .user(user)
                .expiryDate(LocalDateTime.now().plus(Duration.ofMillis(jwtService.getRefreshTokenExpiration())))
                .build();

        refreshTokenRepository.save(refreshToken);
        return refreshTokenValue;
    }



}
