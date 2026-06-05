package com.ExpenseOS.Backend.repository;

import com.ExpenseOS.Backend.entity.Group;
import com.ExpenseOS.Backend.entity.Settlement;
import com.ExpenseOS.Backend.entity.SettlementStatus;
import com.ExpenseOS.Backend.repository.projection.UserAmountProjection;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SettlementRepository extends JpaRepository<Settlement, Long> {

    boolean existsByGroupIdAndStatus(Long groupId, SettlementStatus status);

    void deleteByGroup(Group group);

    @EntityGraph(attributePaths = {"fromUser", "toUser", "group"})
    List<Settlement> findByGroupIdOrderByCreatedAtDesc(Long groupId);

    @EntityGraph(attributePaths = {"fromUser", "toUser", "group"})
    List<Settlement> findByToUserIdAndStatusOrderByCreatedAtAsc(Long toUserId, SettlementStatus status);

    @Query("""
            select s.fromUser.id as userId, coalesce(sum(s.amount), 0) as amount
            from Settlement s
            where s.group.id = :groupId
              and s.status = :status
            group by s.fromUser.id
            """)
    List<UserAmountProjection> sumSentAmountsByGroup(
            @Param("groupId") Long groupId,
            @Param("status") SettlementStatus status
    );

    @Query("""
            select s.toUser.id as userId, coalesce(sum(s.amount), 0) as amount
            from Settlement s
            where s.group.id = :groupId
              and s.status = :status
            group by s.toUser.id
            """)
    List<UserAmountProjection> sumReceivedAmountsByGroup(
            @Param("groupId") Long groupId,
            @Param("status") SettlementStatus status
    );

    @Query("""
            select coalesce(sum(s.amount), 0)
            from Settlement s
            where s.group.id = :groupId
              and s.fromUser.id = :fromUserId
              and s.toUser.id = :toUserId
              and s.status = :status
            """)
    java.math.BigDecimal sumApprovedAmountBetweenUsers(
            @Param("groupId") Long groupId,
            @Param("fromUserId") Long fromUserId,
            @Param("toUserId") Long toUserId,
            @Param("status") SettlementStatus status
    );

    @Query("""
            select coalesce(sum(s.amount), 0)
            from Settlement s
            where s.group.id = :groupId
              and s.fromUser.id = :fromUserId
              and s.toUser.id = :toUserId
              and s.status = :status
            """)
    java.math.BigDecimal sumPendingAmountBetweenUsers(
            @Param("groupId") Long groupId,
            @Param("fromUserId") Long fromUserId,
            @Param("toUserId") Long toUserId,
            @Param("status") SettlementStatus status
    );
}
