package com.ExpenseOS.Backend.repository;

import com.ExpenseOS.Backend.entity.Group;
import com.ExpenseOS.Backend.entity.GroupInvitation;
import com.ExpenseOS.Backend.entity.InvitationStatus;
import com.ExpenseOS.Backend.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GroupInvitationRepository extends JpaRepository<GroupInvitation, Long> {

    void deleteByGroup(Group group);

    @EntityGraph(attributePaths = {"group", "invitedBy", "invitedUser"})
    List<GroupInvitation> findByInvitedByOrInvitedUserOrderByCreatedAtDesc(User invitedBy, User invitedUser);

    @EntityGraph(attributePaths = {"group", "invitedBy", "invitedUser"})
    List<GroupInvitation> findByInvitedUserAndStatusOrderByCreatedAtDesc(User invitedUser, InvitationStatus status);

    boolean existsByGroupAndInvitedUserAndStatus(Group group, User invitedUser, InvitationStatus status);

    Optional<GroupInvitation> findByIdAndInvitedUser(Long id, User invitedUser);
}
