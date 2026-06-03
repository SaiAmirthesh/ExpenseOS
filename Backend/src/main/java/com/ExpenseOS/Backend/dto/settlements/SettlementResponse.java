package com.ExpenseOS.Backend.dto.settlements;

import com.ExpenseOS.Backend.entity.SettlementStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettlementResponse {

    private Long id;
    private Long groupId;
    private String groupName;
    private Long fromUserId;
    private String fromUserName;
    private Long toUserId;
    private String toUserName;
    private BigDecimal amount;
    private String note;
    private SettlementStatus status;
    private LocalDateTime settledAt;
    private LocalDateTime approvedAt;
    private LocalDateTime createdAt;
}
