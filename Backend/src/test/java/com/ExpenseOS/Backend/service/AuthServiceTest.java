package com.ExpenseOS.Backend.service;

import com.ExpenseOS.Backend.dto.auth.AuthResponse;
import com.ExpenseOS.Backend.dto.auth.ChangePasswordRequest;
import com.ExpenseOS.Backend.dto.auth.LoginRequest;
import com.ExpenseOS.Backend.dto.auth.RefreshTokenRequest;
import com.ExpenseOS.Backend.entity.User;
import com.ExpenseOS.Backend.exception.InvalidCredentialsException;
import com.ExpenseOS.Backend.exception.InvalidOperationException;
import com.ExpenseOS.Backend.exception.ResourceNotFoundException;
import com.ExpenseOS.Backend.repository.RefreshTokenRepository;
import com.ExpenseOS.Backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;

    @InjectMocks private AuthService authService;

    @Test
    void loginReturnsAccessAndRefreshTokens() {
        User user = user(1L, "Sai", "sai@example.com", "old-hash", 0L);
        LoginRequest request = loginRequest("sai@example.com", "old-pass");

        when(userRepository.findByEmail("sai@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("old-pass", "old-hash")).thenReturn(true);
        when(jwtService.generateAccessToken("sai@example.com", 0L)).thenReturn("access-token");
        when(jwtService.generateRefreshToken("sai@example.com", 0L)).thenReturn("refresh-token");
        when(jwtService.getRefreshTokenExpiration()).thenReturn(604800000L);
        when(refreshTokenRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        AuthResponse response = authService.login(request);

        assertEquals("access-token", response.getAccessToken());
        assertEquals("refresh-token", response.getRefreshToken());
        verify(refreshTokenRepository).deleteByUser(user);
    }

    @Test
    void refreshTokenRotatesTokens() {
        User user = user(1L, "Sai", "sai@example.com", "old-hash", 0L);
        com.ExpenseOS.Backend.entity.RefreshToken storedToken = refreshToken(user, "old-refresh");
        RefreshTokenRequest request = refreshRequest("old-refresh");

        when(refreshTokenRepository.findByToken("old-refresh")).thenReturn(Optional.of(storedToken));
        when(jwtService.generateAccessToken("sai@example.com", 0L)).thenReturn("new-access-token");
        when(jwtService.generateRefreshToken("sai@example.com", 0L)).thenReturn("new-refresh-token");
        when(jwtService.getRefreshTokenExpiration()).thenReturn(604800000L);
        when(refreshTokenRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        AuthResponse response = authService.refreshToken(request);

        assertEquals("new-access-token", response.getAccessToken());
        assertEquals("new-refresh-token", response.getRefreshToken());
        verify(refreshTokenRepository).delete(storedToken);
        verify(refreshTokenRepository).deleteByUser(user);
    }

    @Test
    void changePasswordSuccess() {
        User user = user(1L, "Sai", "sai@example.com", "old-hash", 0L);
        ChangePasswordRequest request = request("old-pass", "new-pass", "new-pass");

        when(userRepository.findByEmail("sai@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("old-pass", "old-hash")).thenReturn(true);
        when(passwordEncoder.matches("new-pass", "old-hash")).thenReturn(false);
        when(passwordEncoder.encode("new-pass")).thenReturn("new-hash");
        when(userRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        String response = authService.changePassword("sai@example.com", request);

        assertEquals("Password changed successfully", response);
        assertEquals("new-hash", user.getPassword());
        assertEquals(1L, user.getTokenVersion());
        verify(userRepository).save(user);
        verify(refreshTokenRepository).deleteByUser(user);
    }

    @Test
    void changePasswordFailsForWrongCurrentPassword() {
        User user = user(1L, "Sai", "sai@example.com", "old-hash", 0L);

        when(userRepository.findByEmail("sai@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-pass", "old-hash")).thenReturn(false);

        assertThrows(InvalidCredentialsException.class,
                () -> authService.changePassword("sai@example.com", request("wrong-pass", "new-pass", "new-pass")));
    }

    @Test
    void changePasswordFailsForMismatchedConfirmation() {
        User user = user(1L, "Sai", "sai@example.com", "old-hash", 0L);

        when(userRepository.findByEmail("sai@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("old-pass", "old-hash")).thenReturn(true);

        assertThrows(InvalidOperationException.class,
                () -> authService.changePassword("sai@example.com", request("old-pass", "new-pass", "different-pass")));
    }

    @Test
    void changePasswordFailsWhenNewPasswordMatchesCurrentPassword() {
        User user = user(1L, "Sai", "sai@example.com", "old-hash", 0L);

        when(userRepository.findByEmail("sai@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("old-pass", "old-hash")).thenReturn(true, true);

        assertThrows(InvalidOperationException.class,
                () -> authService.changePassword("sai@example.com", request("old-pass", "old-pass", "old-pass")));
    }

    @Test
    void changePasswordFailsForUnknownUser() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> authService.changePassword("missing@example.com", request("old-pass", "new-pass", "new-pass")));
    }

    private static LoginRequest loginRequest(String email, String password) {
        LoginRequest request = new LoginRequest();
        request.setEmail(email);
        request.setPassword(password);
        return request;
    }

    private static RefreshTokenRequest refreshRequest(String token) {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken(token);
        return request;
    }

    private static ChangePasswordRequest request(String currentPassword, String newPassword, String confirmPassword) {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword(currentPassword);
        request.setNewPassword(newPassword);
        request.setConfirmPassword(confirmPassword);
        return request;
    }

    private static User user(Long id, String name, String email, String password, Long tokenVersion) {
        User user = User.builder()
                .name(name)
                .email(email)
                .password(password)
                .enabled(true)
                .tokenVersion(tokenVersion)
                .build();
        user.setId(id);
        return user;
    }

    private static com.ExpenseOS.Backend.entity.RefreshToken refreshToken(User user, String token) {
        com.ExpenseOS.Backend.entity.RefreshToken refreshToken = com.ExpenseOS.Backend.entity.RefreshToken.builder()
                .token(token)
                .user(user)
                .expiryDate(java.time.LocalDateTime.now().plusDays(7))
                .build();
        refreshToken.setId(100L);
        return refreshToken;
    }
}
