package com.ExpenseOS.Backend.repository;

import com.ExpenseOS.Backend.entity.Group;
import com.ExpenseOS.Backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GroupRepository extends JpaRepository<Group, Long> {
    List<Group> findByCreatedBy(User user);
}