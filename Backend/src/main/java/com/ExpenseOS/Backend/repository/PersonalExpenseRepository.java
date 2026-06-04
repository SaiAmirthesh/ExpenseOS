package com.ExpenseOS.Backend.repository;

import com.ExpenseOS.Backend.entity.PersonalExpense;
import com.ExpenseOS.Backend.entity.PersonalExpenseCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PersonalExpenseRepository extends JpaRepository<PersonalExpense, Long> {

    List<PersonalExpense> findByUserIdOrderByExpenseDateDesc(Long userId);

    List<PersonalExpense> findByUserIdAndCategory(Long userId, PersonalExpenseCategory category);

    List<PersonalExpense> findByUserIdAndExpenseDateBetween(Long userId, LocalDate startDate, LocalDate endDate);

    Optional<PersonalExpense> findByIdAndUserId(Long id, Long userId);
}
