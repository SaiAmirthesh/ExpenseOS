# ExpenseOS API Testing Checklist

Base URL:

```http
http://localhost:8080/api/v1
```

---

# Phase 1: Authentication

## Register Sai

POST /auth/register

```json
{
  "name": "Sai",
  "email": "sai@gmail.com",
  "password": "password123"
}
```

Expected:

```text
User Registered Successfully
```

---

## Register Arun

POST /auth/register

```json
{
  "name": "Arun",
  "email": "arun@gmail.com",
  "password": "password123"
}
```

---

## Register Rahul

POST /auth/register

```json
{
  "name": "Rahul",
  "email": "rahul@gmail.com",
  "password": "password123"
}
```

---

## Login Sai

POST /auth/login

```json
{
  "email": "sai@gmail.com",
  "password": "password123"
}
```

Save:

```text
SAI_TOKEN
```

---

## Login Arun

POST /auth/login

```json
{
  "email": "arun@gmail.com",
  "password": "password123"
}
```

Save:

```text
ARUN_TOKEN
```

---

## Login Rahul

POST /auth/login

```json
{
  "email": "rahul@gmail.com",
  "password": "password123"
}
```

Save:

```text
RAHUL_TOKEN
```

---

# Phase 2: Groups

Authorization:

```text
Bearer SAI_TOKEN
```

---

## Create Group

POST /groups

```json
{
  "name": "Goa Trip",
  "description": "Trip Expenses"
}
```

Save:

```text
GROUP_ID
```

Expected:

```json
{
  "id": 1,
  "name": "Goa Trip"
}
```

---

## Add Arun

POST /groups/{GROUP_ID}/members

```json
{
  "email": "arun@gmail.com"
}
```

Expected:

```text
Member added successfully
```

---

## Add Rahul

POST /groups/{GROUP_ID}/members

```json
{
  "email": "rahul@gmail.com"
}
```

Expected:

```text
Member added successfully
```

---

## Verify Group Members

GET /groups/{GROUP_ID}

Expected:

```text
Sai
Arun
Rahul
```

---

# Phase 3: Expenses

Authorization:

```text
Bearer SAI_TOKEN
```

---

## Create Hotel Expense

POST /expenses

```json
{
  "title": "Hotel",
  "description": "Goa Hotel",
  "amount": 6000,
  "groupId": 1,
  "category": "TRAVEL"
}
```

Expected:

```text
Expense Created
```

---

## Verify Expense

GET /groups/1/expenses

Expected:

```text
Hotel
6000
Paid By Sai
```

---

# Phase 4: Balance Engine

Authorization:

```text
Bearer SAI_TOKEN
```

---

## Get Balances

GET /groups/1/balances

Expected:

```json
[
  {
    "name":"Sai",
    "balance":4000
  },
  {
    "name":"Arun",
    "balance":-2000
  },
  {
    "name":"Rahul",
    "balance":-2000
  }
]
```

Validation:

```text
Sum of balances = 0
```

---

# Phase 5: Settlement Suggestions

Authorization:

```text
Bearer SAI_TOKEN
```

---

## Get Settlement Suggestions

GET /groups/1/settlement-suggestions

Expected:

```json
[
  {
    "fromUserName":"Arun",
    "toUserName":"Sai",
    "amount":2000
  },
  {
    "fromUserName":"Rahul",
    "toUserName":"Sai",
    "amount":2000
  }
]
```

---

# Phase 6: Settlement Request

Authorization:

```text
Bearer ARUN_TOKEN
```

---

## Create Settlement Request

POST /settlements

```json
{
  "groupId":1,
  "toUserId":1,
  "amount":2000,
  "note":"UPI Payment"
}
```

Expected:

```json
{
  "status":"PENDING"
}
```

---

# Phase 7: Pending Requests

Authorization:

```text
Bearer SAI_TOKEN
```

---

## View Pending Requests

GET /settlements/pending

Expected:

```json
[
  {
    "fromUserName":"Arun",
    "amount":2000,
    "status":"PENDING"
  }
]
```

---

# Phase 8: Verify Pending Does Not Affect Balances

Authorization:

```text
Bearer SAI_TOKEN
```

GET /groups/1/balances

Expected:

```json
[
  {
    "name":"Sai",
    "balance":4000
  },
  {
    "name":"Arun",
    "balance":-2000
  },
  {
    "name":"Rahul",
    "balance":-2000
  }
]
```

No changes yet.

---

# Phase 9: Approve Settlement

Authorization:

```text
Bearer SAI_TOKEN
```

POST /settlements/{SETTLEMENT_ID}/approve

Expected:

```json
{
  "status":"APPROVED"
}
```

---

# Phase 10: Verify Updated Balances

GET /groups/1/balances

Expected:

```json
[
  {
    "name":"Sai",
    "balance":2000
  },
  {
    "name":"Arun",
    "balance":0
  },
  {
    "name":"Rahul",
    "balance":-2000
  }
]
```

---

# Phase 11: Verify Settlement History

GET /groups/1/settlements

Expected:

```json
[
  {
    "fromUserName":"Arun",
    "toUserName":"Sai",
    "amount":2000,
    "status":"APPROVED"
  }
]
```

---

# Negative Test Cases

## Unauthorized Group Access

Use random user.

GET /groups/1/balances

Expected:

```text
403 Forbidden
```

---

## Overpayment Attempt

Authorization:

```text
Bearer RAHUL_TOKEN
```

POST /settlements

```json
{
  "groupId":1,
  "toUserId":1,
  "amount":5000
}
```

Expected:

```text
Settlement exceeds outstanding debt
```

---

## Self Settlement

```json
{
  "groupId":1,
  "toUserId":3,
  "amount":1000
}
```

where sender == receiver

Expected:

```text
Validation Error
```

---

## Unauthorized Approval

Rahul attempts:

POST /settlements/{ID}/approve

Expected:

```text
Only receiver can approve
```

---

# Final Validation

Expected Final Balances:

```text
Sai    +2000
Arun       0
Rahul  -2000
```

Expected Settlement Suggestions:

```text
Rahul -> Sai ₹2000
```

Expected System State:

```text
Auth           ✅
Groups         ✅
Members        ✅
Expenses       ✅
Expense Splits ✅
Balances       ✅
Settlements    ✅
Approval Flow  ✅
```
