package com.ExpenseOS.Backend.dto.expenses;

import com.ExpenseOS.Backend.entity.ExpenseCategory;
import com.ExpenseOS.Backend.entity.SplitType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseResponse {

    private Long id;
    private String title;
    private String description;
    private BigDecimal amount;
    private ExpenseCategory category;
    private SplitType splitType;
    private Long groupId;
    private String groupName;
    private Long paidById;
    private String paidByName;
    private String paidByEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ExpenseSplitResponse> splits;
}
