package com.ExpenseOS.Backend.repository.projection;

import java.math.BigDecimal;

public interface UserAmountProjection {
    Long getUserId();

    BigDecimal getAmount();
}
