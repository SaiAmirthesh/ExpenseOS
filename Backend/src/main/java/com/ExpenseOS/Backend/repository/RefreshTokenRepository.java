package com.ExpenseOS.Backend.repository;

import com.ExpenseOS.Backend.entity.RefreshToken;
import com.ExpenseOS.Backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken,Long> {
    Optional<RefreshToken> findByToken(String Token);
    void deleteByUser(User user);
}
