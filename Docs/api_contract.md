# ExpenseOS API Contract

This document contains the complete API specification for the **ExpenseOS Backend**.

- **Base URL:** `http://localhost:8080/api/v1`
- **Security Scheme:** Bearer Token Authentication. For authenticated endpoints, include the header:
  `Authorization: Bearer <access_token>`

---

## 1. Authentication API (`/api/v1/auth`)

### Register User
* **Method:** `POST`
* **Path:** `/register`
* **Request Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123" // Minimum 6 characters
  }
  ```
* **Response:** `200 OK`
  * Body: `User Registered Successfully` (String)

### Login User
* **Method:** `POST`
* **Path:** `/login`
* **Request Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```
* **Response:** `200 OK`
  * Body (`AuthResponse`):
    ```json
    {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi...",
      "email": "john@example.com",
      "name": "John Doe"
    }
    ```

---

## 2. User API (`/api/v1/users`)

### Get Current User Profile
* **Method:** `GET`
* **Path:** `/me`
* **Headers:** `Authorization: Bearer <token>`
* **Response:** `200 OK`
  * Body (`UserResponse`):
    ```json
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
    ```

---

## 3. Group API (`/api/v1/groups`)

### Create Group
* **Method:** `POST`
* **Path:** `/`
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
  ```json
  {
    "name": "Goa Trip",
    "description": "Trip Expenses"
  }
  ```
* **Response:** `200 OK`
  * Body (`GroupResponse`):
    ```json
    {
      "id": 1,
      "name": "Goa Trip",
      "description": "Trip Expenses",
      "createdBy": "john@example.com"
    }
    ```

### List User's Groups
* **Method:** `GET`
* **Path:** `/`
* **Headers:** `Authorization: Bearer <token>`
* **Response:** `200 OK`
  * Body: List of `GroupResponse`
    ```json
    [
      {
        "id": 1,
        "name": "Goa Trip",
        "description": "Trip Expenses",
        "createdBy": "john@example.com"
      }
    ]
    ```

### Get Group Details
* **Method:** `GET`
* **Path:** `/{groupId}`
* **Headers:** `Authorization: Bearer <token>`
* **Response:** `200 OK`
  * Body (`GroupResponse`):
    ```json
    {
      "id": 1,
      "name": "Goa Trip",
      "description": "Trip Expenses",
      "createdBy": "john@example.com"
    }
    ```

### Delete Group
* **Method:** `DELETE`
* **Path:** `/{groupId}`
* **Headers:** `Authorization: Bearer <token>`
* **Response:** `204 No Content`

### Add Group Member
* **Method:** `POST`
* **Path:** `/{groupId}/members`
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
  ```json
  {
    "email": "arun@gmail.com"
  }
  ```
* **Response:** `200 OK`
  * Body (`MemberResponse`):
    ```json
    {
      "id": 2,
      "name": "Arun",
      "email": "arun@gmail.com"
    }
    ```

### Get Group Members
* **Method:** `GET`
* **Path:** `/{groupId}/members`
* **Response:** `200 OK`
  * Body: List of `MemberResponse`
    ```json
    [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      },
      {
        "id": 2,
        "name": "Arun",
        "email": "arun@gmail.com"
      }
    ]
    ```

### Remove Group Member
* **Method:** `DELETE`
* **Path:** `/{groupId}/members/{userId}`
* **Headers:** `Authorization: Bearer <token>`
* **Response:** `204 No Content`

---

## 4. Group Expense API (`/api/v1`)

### Create Group Expense
* **Method:** `POST`
* **Path:** `/expenses`
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
  ```json
  {
    "groupId": 1,
    "title": "Hotel Room",
    "description": "Goa Hotel Stay",
    "amount": 6000.00,
    "category": "TRAVEL", // See Enums
    "splitType": "EQUAL", // EQUAL, EXACT, or PERCENTAGE
    "splits": [          // Required if splitType is EXACT or PERCENTAGE
      {
        "userId": 1,
        "amount": 2000.00,
        "percentage": 33.33
      },
      {
        "userId": 2,
        "amount": 4000.00,
        "percentage": 66.67
      }
    ]
  }
  ```
* **Response:** `200 OK`
  * Body (`ExpenseResponse`):
    ```json
    {
      "id": 10,
      "title": "Hotel Room",
      "description": "Goa Hotel Stay",
      "amount": 6000.00,
      "category": "TRAVEL",
      "splitType": "EQUAL",
      "groupId": 1,
      "groupName": "Goa Trip",
      "paidById": 1,
      "paidByName": "John Doe",
      "paidByEmail": "john@example.com",
      "createdAt": "2026-06-05T18:00:00",
      "updatedAt": "2026-06-05T18:00:00",
      "splits": [
        {
          "id": 15,
          "userId": 1,
          "userName": "John Doe",
          "userEmail": "john@example.com",
          "amount": 2000.00,
          "settled": false
        },
        {
          "id": 16,
          "userId": 2,
          "userName": "Arun",
          "userEmail": "arun@gmail.com",
          "amount": 4000.00,
          "settled": false
        }
      ]
    }
    ```

### Get Expenses by Group
* **Method:** `GET`
* **Path:** `/groups/{groupId}/expenses`
* **Headers:** `Authorization: Bearer <token>`
* **Response:** `200 OK`
  * Body: List of `ExpenseResponse`

---

## 5. Balances & Suggestions API (`/api/v1/groups`)

### Get Net Balances
Returns the net outstanding balance for each member in the group. Positive balance means the member is owed money; negative balance means the member owes money.
* **Method:** `GET`
* **Path:** `/{groupId}/balances`
* **Headers:** `Authorization: Bearer <token>`
* **Response:** `200 OK`
  * Body: List of `BalanceResponse`
    ```json
    [
      {
        "userId": 1,
        "name": "John Doe",
        "balance": 4000.00
      },
      {
        "userId": 2,
        "name": "Arun",
        "balance": -2000.00
      },
      {
        "userId": 3,
        "name": "Rahul",
        "balance": -2000.00
      }
    ]
    ```

### Get Settlement Suggestions
Computes the optimized list of transactions required to settle the debts.
* **Method:** `GET`
* **Path:** `/{groupId}/settlement-suggestions`
* **Headers:** `Authorization: Bearer <token>`
* **Response:** `200 OK`
  * Body: List of `SettlementSuggestion`
    ```json
    [
      {
        "fromUserId": 2,
        "fromUserName": "Arun",
        "toUserId": 1,
        "toUserName": "John Doe",
        "amount": 2000.00
      },
      {
        "fromUserId": 3,
        "fromUserName": "Rahul",
        "toUserId": 1,
        "toUserName": "John Doe",
        "amount": 2000.00
      }
    ]
    ```

---

## 6. Settlement Request API (`/api/v1`)

### Create Settlement Request
* **Method:** `POST`
* **Path:** `/settlements`
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
  ```json
  {
    "groupId": 1,
    "toUserId": 1,
    "amount": 2000.00,
    "note": "GPay transaction #981273"
  }
  ```
* **Response:** `200 OK`
  * Body (`SettlementResponse`):
    ```json
    {
      "id": 100,
      "groupId": 1,
      "groupName": "Goa Trip",
      "fromUserId": 2,
      "fromUserName": "Arun",
      "toUserId": 1,
      "toUserName": "John Doe",
      "amount": 2000.00,
      "note": "GPay transaction #981273",
      "status": "PENDING",
      "createdAt": "2026-06-05T18:05:00"
    }
    ```

### View Pending Settlement Requests
Get all pending settlements that the current user needs to approve.
* **Method:** `GET`
* **Path:** `/settlements/pending`
* **Headers:** `Authorization: Bearer <token>`
* **Response:** `200 OK`
  * Body: List of `SettlementResponse`

### Approve Settlement Request
Approves the settlement and triggers the balance updates. Only the receiver of the payment (`toUserId`) can approve it.
* **Method:** `POST`
* **Path:** `/settlements/{id}/approve`
* **Headers:** `Authorization: Bearer <token>`
* **Response:** `200 OK`
  * Body (`SettlementResponse`): with `status` updated to `APPROVED`

### Reject Settlement Request
* **Method:** `POST`
* **Path:** `/settlements/{id}/reject`
* **Headers:** `Authorization: Bearer <token>`
* **Response:** `200 OK`
  * Body (`SettlementResponse`): with `status` updated to `REJECTED`

### Get Group Settlement History
Returns the list of all settlements (approved, rejected, or pending) in the group.
* **Method:** `GET`
* **Path:** `/groups/{groupId}/settlements`
* **Headers:** `Authorization: Bearer <token>`
* **Response:** `200 OK`
  * Body: List of `SettlementResponse`

---

## 7. Group Invitation API (`/api/v1`)

### Invite User to Group
* **Method:** `POST`
* **Path:** `/groups/{groupId}/invite`
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
  ```json
  {
    "email": "invitee@example.com"
  }
  ```
* **Response:** `200 OK`
  * Body (`InvitationResponse`):
    ```json
    {
      "id": 50,
      "groupId": 1,
      "groupName": "Goa Trip",
      "invitedBy": "john@example.com",
      "invitedUser": "invitee@example.com",
      "status": "PENDING"
    }
    ```

### Get User's Invitations
* **Method:** `GET`
* **Path:** `/invitations`
* **Headers:** `Authorization: Bearer <token>`
* **Response:** `200 OK`
  * Body: List of `InvitationResponse`

### Get Pending Invitations
* **Method:** `GET`
* **Path:** `/invitations/pending`
* **Headers:** `Authorization: Bearer <token>`
* **Response:** `200 OK`
  * Body: List of `InvitationResponse`

### Accept Group Invitation
* **Method:** `POST`
* **Path:** `/invitations/{id}/accept`
* **Headers:** `Authorization: Bearer <token>`
* **Response:** `200 OK`
  * Body (`InvitationResponse`): with `status` updated to `ACCEPTED`

### Reject Group Invitation
* **Method:** `POST`
* **Path:** `/invitations/{id}/reject`
* **Headers:** `Authorization: Bearer <token>`
* **Response:** `200 OK`
  * Body (`InvitationResponse`): with `status` updated to `REJECTED`

---

## 8. Personal Expense API (`/api/v1/personal-expenses`)

These endpoints are for individual user tracking independent of groups.

### Create Personal Expense
* **Method:** `POST`
* **Path:** `/`
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
  ```json
  {
    "title": "Groceries",
    "description": "Weekly grocery shopping",
    "amount": 120.50,
    "category": "FOOD", // See Enums
    "expenseDate": "2026-06-05"
  }
  ```
* **Response:** `200 OK`
  * Body (`PersonalExpenseResponse`):
    ```json
    {
      "id": 200,
      "title": "Groceries",
      "amount": 120.50,
      "category": "FOOD",
      "expenseDate": "2026-06-05"
    }
    ```

### List All Personal Expenses
* **Method:** `GET`
* **Path:** `/`
* **Headers:** `Authorization: Bearer <token>`
* **Response:** `200 OK`
  * Body: List of `PersonalExpenseResponse`

### Get Personal Expense Details
* **Method:** `GET`
* **Path:** `/{id}`
* **Headers:** `Authorization: Bearer <token>`
* **Response:** `200 OK`
  * Body (`PersonalExpenseResponse`)

### Update Personal Expense
* **Method:** `PUT`
* **Path:** `/{id}`
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:** Same as `CreatePersonalExpenseRequest`
* **Response:** `200 OK`
  * Body (`PersonalExpenseResponse`)

### Delete Personal Expense
* **Method:** `DELETE`
* **Path:** `/{id}`
* **Headers:** `Authorization: Bearer <token>`
* **Response:** `200 OK` / `204 No Content`

### Filter Personal Expenses by Category
* **Method:** `GET`
* **Path:** `/category/{category}`
* **Headers:** `Authorization: Bearer <token>`
* **Response:** `200 OK`
  * Body: List of `PersonalExpenseResponse`

### Filter Personal Expenses by Date Range
* **Method:** `GET`
* **Path:** `/date-range`
* **Headers:** `Authorization: Bearer <token>`
* **Params:**
  * `startDate` (String, e.g., `2026-06-01`)
  * `endDate` (String, e.g., `2026-06-30`)
* **Response:** `200 OK`
  * Body: List of `PersonalExpenseResponse`

---

## 9. Enumerations

### `ExpenseCategory` (Group Expenses)
* `FOOD`
* `TRAVEL`
* `SHOPPING`
* `RENT`
* `ENTERTAINMENT`
* `UTILITIES`
* `HEALTH`
* `OTHER`

### `SplitType`
* `EQUAL`
* `EXACT`
* `PERCENTAGE`

### `PersonalExpenseCategory`
* `FOOD`
* `TRANSPORT`
* `SHOPPING`
* `ENTERTAINMENT`
* `HEALTH`
* `EDUCATION`
* `BILLS`
* `TRAVEL`
* `OTHER`

### `InvitationStatus`
* `PENDING`
* `ACCEPTED`
* `REJECTED`

### `SettlementStatus`
* `PENDING`
* `APPROVED`
* `REJECTED`
