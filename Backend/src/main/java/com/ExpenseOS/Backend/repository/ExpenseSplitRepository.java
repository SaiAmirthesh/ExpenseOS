package com.ExpenseOS.Backend.repository;

import com.ExpenseOS.Backend.entity.ExpenseSplit;
import com.ExpenseOS.Backend.repository.projection.UserAmountProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ExpenseSplitRepository extends JpaRepository<ExpenseSplit, Long> {

    @Query("""
            select s
            from ExpenseSplit s
            join fetch s.user
            join fetch s.expense
            where s.expense.id in :expenseIds
            order by s.expense.id asc, s.id asc
            """)
    List<ExpenseSplit> findSplitsForExpenses(@Param("expenseIds") Collection<Long> expenseIds);

    @Query("""
            select s.user.id as userId, coalesce(sum(s.amount), 0) as amount
            from ExpenseSplit s
            where s.expense.group.id = :groupId
            group by s.user.id
            """)
    List<UserAmountProjection> sumOwedAmountsByGroup(@Param("groupId") Long groupId);
}
