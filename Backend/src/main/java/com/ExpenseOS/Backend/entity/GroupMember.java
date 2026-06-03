package com.ExpenseOS.Backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "group_members",
        uniqueConstraints = {
            @UniqueConstraint(
                columnNames = {"group_id", "user_id"}
            )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupMember extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
