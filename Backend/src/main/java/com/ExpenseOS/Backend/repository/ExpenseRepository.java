package com.ExpenseOS.Backend.repository;

import com.ExpenseOS.Backend.entity.Expense;
import com.ExpenseOS.Backend.entity.Group;
import com.ExpenseOS.Backend.repository.projection.UserAmountProjection;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    void deleteByGroup(Group group);

    @EntityGraph(attributePaths = {"paidBy", "group"})
    List<Expense> findByGroupIdOrderByCreatedAtDesc(Long groupId);

    @Query("""
            select e.paidBy.id as userId, coalesce(sum(e.amount), 0) as amount
            from Expense e
            where e.group.id = :groupId
            group by e.paidBy.id
            """)
    List<UserAmountProjection> sumPaidAmountsByGroup(@Param("groupId") Long groupId);
}
