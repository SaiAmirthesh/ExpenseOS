package com.ExpenseOS.Backend.repository;

import com.ExpenseOS.Backend.entity.Group;
import com.ExpenseOS.Backend.entity.GroupMember;
import com.ExpenseOS.Backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository
        extends JpaRepository<GroupMember, Long> {

    List<GroupMember> findByGroup(Group group);

    Optional<GroupMember> findByGroupAndUser(
            Group group,
            User user
    );

    boolean existsByGroupAndUser(
            Group group,
            User user
    );

    void deleteByGroupAndUser(
            Group group,
            User user
    );

    void deleteByGroup(Group group);
}
