# 💰 Deposit & Withdrawal System Guide

## Overview

The Bank of the Brave deposit and withdrawal system provides a complete flow with screenshot verification, admin approval, and automated fund management.

---

## ✨ Features

### Deposits
- **Manual Uploads**: Users upload payment proof (screenshots)
- **Multiple Methods**: CashApp, Venmo, PayPal, Wire Transfer, Bank Transfer, Crypto
- **Status Tracking**: Pending → Approved → Completed (or Rejected)
- **Minimum Deposit**: $500 (configurable)
- **Screenshot Required**: Mandatory proof of payment
- **Optional Reference ID**: Transaction/confirmation numbers
- **Admin Approval**: All deposits await admin verification
- **Fund Crediting**: Approved deposits automatically credit account

### Withdrawals
- **Fund Protection**: Funds held immediately on request
- **Screenshot Required**: Proof of withdrawal request
- **Admin Approval**: All withdrawals require admin approval
- **Refund on Rejection**: Automatically refund held funds if rejected
- **Multiple Methods**: Same as deposits (CashApp, Venmo, PayPal, Wire, etc.)
- **Daily Limits**: Configurable daily withdrawal limit (default: $500k)
- **Destination Info**: Optional bank details, email, phone

### Admin Controls
- **Method Management**: Enable/disable deposit/withdrawal methods
- **Amount Limits**: Set min/max for each method
- **Auto-Approval**: Optional auto-approval for deposits under threshold
- **Approval Limits**: Require higher approval for large transactions
- **Settings Dashboard**: Centralized configuration
- **Audit Logging**: All changes tracked

---

## 🔌 API Endpoints

### USER DEPOSITS

#### 1. Initiate Deposit
```
POST /api/deposits/initiate
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**Form Data**:
```json
{
  "accountId": "60d5ec49c1234567890abce0",
  "amount": "1000",
  "depositMethod": "cashapp",
  "referenceId": "TX123456789",    // optional
  "userNotes": "Initial deposit",   // optional
  "currency": "USD",                // optional, defaults to USD
  "screenshot": [FILE]              // REQUIRED - multipart file
}
```

**Parameters**:
- `accountId` (required): User's account ID
- `amount` (required): Deposit amount (minimum $500)
- `depositMethod` (required): cashapp, venmo, paypal, wire_transfer, bank_transfer, crypto
- `referenceId` (optional): Transaction reference number
- `userNotes` (optional): User notes about deposit
- `currency` (optional): Currency code (default USD)
- `screenshot` (required): JPEG, PNG, or PDF (max 5MB)

**Response**:
```json
{
  "message": "Deposit initiated successfully. Awaiting admin approval.",
  "deposit": {
    "_id": "60d5ec49c1234567890abce1",
    "amount": 1000,
    "currency": "USD",
    "depositMethod": "cashapp",
    "status": "pending",
    "referenceId": "TX123456789",
    "createdAt": "2024-08-21T15:30:00Z",
    "estimatedTime": "1-2 hours (depends on admin availability)"
  }
}
```

**Status Code**: 201 Created

---

#### 2. Get User Deposits
```
GET /api/deposits?status=pending
Authorization: Bearer {token}
```

**Query Parameters**:
- `status` (optional): pending, approved, rejected, completed, failed

**Response**:
```json
{
  "message": "Deposits retrieved successfully",
  "count": 2,
  "deposits": [
    {
      "_id": "60d5ec49c1234567890abce1",
      "userId": "60d5ec49c1234567890abcdf",
      "accountId": "60d5ec49c1234567890abce0",
      "amount": 1000,
      "currency": "USD",
      "depositMethod": "cashapp",
      "status": "pending",
      "screenshotUrl": "/uploads/deposits/60d5ec49...-1234.png",
      "referenceId": "TX123456789",
      "userNotes": "Initial deposit",
      "createdAt": "2024-08-21T15:30:00Z",
      "updatedAt": "2024-08-21T15:30:00Z"
    }
  ]
}
```

---

#### 3. Get Single Deposit
```
GET /api/deposits/:depositId
Authorization: Bearer {token}
```

**Response**: Single deposit object (same structure as list)

---

### ADMIN DEPOSITS

#### 4. Get All Deposits (Admin)
```
GET /api/admin/deposits/all?status=pending&skip=0&limit=50
Authorization: Bearer {admin_token}
Authorization-Role: admin or compliance
```

**Query Parameters**:
- `status` (optional): pending, approved, rejected, completed, failed
- `userId` (optional): Filter by user ID
- `skip` (optional): Pagination skip (default 0)
- `limit` (optional): Pagination limit (default 50)

**Response**:
```json
{
  "message": "All deposits retrieved",
  "total": 25,
  "count": 15,
  "page": 1,
  "deposits": [
    {
      "_id": "60d5ec49c1234567890abce1",
      "userId": {
        "_id": "60d5ec49c1234567890abcdf",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe"
      },
      "amount": 1000,
      "depositMethod": "cashapp",
      "status": "pending",
      "screenshotUrl": "/uploads/deposits/...",
      "referenceId": "TX123456789",
      "createdAt": "2024-08-21T15:30:00Z"
    }
  ]
}
```

---

#### 5. Approve Deposit (Admin)
```
POST /api/deposits/:depositId/approve
Authorization: Bearer {admin_token}
Authorization-Role: admin or compliance
Content-Type: application/json
```

**Request Body**:
```json
{
  "adminNotes": "Verified screenshot, transaction ID matches"
}
```

**Response**:
```json
{
  "message": "Deposit approved successfully. Account credited.",
  "deposit": { /* deposit object */ },
  "accountBalance": 5000
}
```

**Effects**:
- Deposit status → `approved`
- User account balance increased
- Transaction record created
- Audit log entry added

---

#### 6. Reject Deposit (Admin)
```
POST /api/deposits/:depositId/reject
Authorization: Bearer {admin_token}
Authorization-Role: admin or compliance
Content-Type: application/json
```

**Request Body**:
```json
{
  "rejectionReason": "Screenshot unclear or invalid",
  "adminNotes": "User should resubmit with clearer proof"
}
```

**Parameters**:
- `rejectionReason` (required): Why deposit was rejected
- `adminNotes` (optional): Internal notes

**Response**:
```json
{
  "message": "Deposit rejected successfully.",
  "deposit": { /* updated deposit */ }
}
```

**Effects**:
- Deposit status → `rejected`
- No funds credited
- User can resubmit with different proof
- Audit log entry added

---

#### 7. View Deposit Screenshot (Admin)
```
GET /api/deposits/:depositId/screenshot
Authorization: Bearer {token}
```

**Response**: Binary file (JPEG, PNG, or PDF)

---

---

## 💸 WITHDRAWALS

### USER WITHDRAWALS

#### 1. Request Withdrawal
```
POST /api/withdrawals/request
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**Form Data**:
```json
{
  "accountId": "60d5ec49c1234567890abce0",
  "amount": "500",
  "withdrawalMethod": "venmo",
  "referenceId": "123456",                    // optional
  "userNotes": "Withdrawal to Venmo",         // optional
  "currency": "USD",                          // optional
  "destinationInfo": {
    "phoneOrEmail": "user@example.com",       // optional
    "accountNumber": "123456789",             // optional (for bank transfer)
    "routingNumber": "987654321",             // optional
    "accountHolder": "John Doe"               // optional
  },
  "screenshot": [FILE]                        // REQUIRED
}
```

**Parameters**:
- `accountId` (required): User's account ID
- `amount` (required): Withdrawal amount (must have sufficient balance)
- `withdrawalMethod` (required): cashapp, venmo, paypal, wire_transfer, bank_transfer, crypto
- `referenceId` (optional): Reference/confirmation number
- `userNotes` (optional): User notes
- `currency` (optional): Currency code
- `destinationInfo` (optional): Destination account details
- `screenshot` (required): JPEG, PNG, or PDF proof (max 5MB)

**Response**:
```json
{
  "message": "Withdrawal request submitted. Funds held pending approval.",
  "withdrawal": {
    "_id": "60d5ec49c1234567890abce2",
    "amount": 500,
    "currency": "USD",
    "withdrawalMethod": "venmo",
    "status": "pending",
    "referenceId": "123456",
    "createdAt": "2024-08-21T16:00:00Z",
    "estimatedTime": "1-2 hours (depends on admin availability)"
  },
  "accountBalance": 4000
}
```

**Status Code**: 201 Created

**Important**: 
- Funds are held immediately (subtracted from balance)
- If withdrawal is rejected, funds are refunded

---

#### 2. Get User Withdrawals
```
GET /api/withdrawals?status=pending
Authorization: Bearer {token}
```

**Query Parameters**:
- `status` (optional): pending, approved, rejected, completed, failed

---

#### 3. Get Single Withdrawal
```
GET /api/withdrawals/:withdrawalId
Authorization: Bearer {token}
```

---

### ADMIN WITHDRAWALS

#### 4. Get All Withdrawals (Admin)
```
GET /api/admin/withdrawals/all?status=pending&skip=0&limit=50
Authorization: Bearer {admin_token}
Authorization-Role: admin or compliance
```

---

#### 5. Approve Withdrawal (Admin)
```
POST /api/withdrawals/:withdrawalId/approve
Authorization: Bearer {admin_token}
Authorization-Role: admin or compliance
```

**Request Body**:
```json
{
  "adminNotes": "Verified destination, processing payment"
}
```

**Effects**:
- Withdrawal status → `approved` then `completed`
- Funds remain deducted from account
- Transaction record created
- Payment processing initiated

---

#### 6. Reject Withdrawal (Admin)
```
POST /api/withdrawals/:withdrawalId/reject
Authorization: Bearer {admin_token}
Authorization-Role: admin or compliance
```

**Request Body**:
```json
{
  "rejectionReason": "Destination account verification failed",
  "adminNotes": "User should verify bank details"
}
```

**Effects**:
- Withdrawal status → `rejected`
- Held funds returned to account balance
- User can resubmit
- Audit log entry added

---

#### 7. View Withdrawal Screenshot (Admin)
```
GET /api/withdrawals/:withdrawalId/screenshot
Authorization: Bearer {token}
```

---

---

## ⚙️ ADMIN SETTINGS

### 1. Get Deposit/Withdrawal Settings
```
GET /api/admin/deposit-settings
Authorization: Bearer {admin_token}
Authorization-Role: admin
```

**Response**:
```json
{
  "message": "Deposit/withdrawal settings retrieved",
  "settings": {
    "_id": "60d5ec49c1234567890abce3",
    "depositMethods": {
      "cashapp": {
        "enabled": true,
        "minAmount": 500,
        "maxAmount": 25000
      },
      "venmo": {
        "enabled": true,
        "minAmount": 500,
        "maxAmount": 25000
      },
      "paypal": {
        "enabled": true,
        "minAmount": 500,
        "maxAmount": 50000
      },
      "wire_transfer": {
        "enabled": true,
        "minAmount": 1000,
        "maxAmount": 500000
      },
      "bank_transfer": {
        "enabled": true,
        "minAmount": 500,
        "maxAmount": 100000
      },
      "crypto": {
        "enabled": false,
        "minAmount": 500,
        "maxAmount": 250000
      }
    },
    "withdrawalMethods": {
      // same structure as deposits
    },
    "autoApproveDepositsUnder": 0,
    "requireAdminApprovalOver": 100000,
    "dailyWithdrawalLimit": 500000,
    "minimumDepositAmount": 500,
    "maximumDepositAmount": 1000000,
    "updatedAt": "2024-08-21T10:00:00Z",
    "updatedBy": { /* admin user */ }
  }
}
```

---

### 2. Update Deposit/Withdrawal Settings
```
POST /api/admin/deposit-settings
Authorization: Bearer {admin_token}
Authorization-Role: admin
Content-Type: application/json
```

**Request Body** (all fields optional):
```json
{
  "depositMethods": {
    "cashapp": {
      "enabled": true,
      "minAmount": 250,
      "maxAmount": 50000
    },
    "crypto": {
      "enabled": true,
      "minAmount": 500,
      "maxAmount": 500000
    }
  },
  "withdrawalMethods": {
    "paypal": {
      "enabled": false
    }
  },
  "autoApproveDepositsUnder": 1000,
  "requireAdminApprovalOver": 50000,
  "dailyWithdrawalLimit": 250000,
  "minimumDepositAmount": 250,
  "maximumDepositAmount": 2000000
}
```

---

### 3. Enable/Disable Specific Method
```
POST /api/admin/deposit-method/:method
Authorization: Bearer {admin_token}
Authorization-Role: admin
Content-Type: application/json
```

**URL Parameters**:
- `:method`: cashapp, venmo, paypal, wire_transfer, bank_transfer, crypto

**Request Body**:
```json
{
  "enabled": true
}
```

**Response**:
```json
{
  "message": "Deposit method venmo enabled",
  "settings": { /* updated settings */ }
}
```

---

## 🧪 Testing Workflow

### Step 1: Admin Configures Methods
```bash
POST /api/admin/deposit-settings
{
  "depositMethods": {
    "cashapp": { "enabled": true, "minAmount": 500 }
  }
}
```

### Step 2: User Initiates Deposit
```bash
POST /api/deposits/initiate
Form-Data:
  accountId: {accountId}
  amount: 1000
  depositMethod: cashapp
  screenshot: [image file]
```

### Step 3: Admin Reviews & Approves
```bash
GET /api/admin/deposits/all?status=pending
POST /api/deposits/{depositId}/approve
  { "adminNotes": "Verified" }
```

### Step 4: User Checks Status
```bash
GET /api/deposits/{depositId}
  Status: completed
  Account balance increased
```

### Step 5: User Initiates Withdrawal
```bash
POST /api/withdrawals/request
Form-Data:
  accountId: {accountId}
  amount: 500
  withdrawalMethod: venmo
  screenshot: [proof image]
```

### Step 6: Admin Approves Withdrawal
```bash
POST /api/withdrawals/{withdrawalId}/approve
  { "adminNotes": "Processing" }
```

---

## 🔒 Security Features

### File Upload Security
- **File Type Validation**: Only JPEG, PNG, PDF allowed
- **File Size Limit**: 5MB maximum
- **Filename Sanitization**: Random names, user ID prefix
- **Path Traversal Prevention**: Isolated upload directories
- **Authentication Required**: All upload operations require login

### Fund Safety
- **Immediate Hold**: Funds held on withdrawal request
- **Refund on Rejection**: Automatic restoration if denied
- **Balance Verification**: Check sufficient balance before withdrawal
- **Audit Trail**: All operations logged

### Access Control
- **User Isolation**: Users only see their own deposits/withdrawals
- **Admin Only**: Settings management restricted to admin role
- **Role-Based Access**: Compliance officers can approve, support can view

---

## 📊 Status Flows

### Deposit Flow
```
PENDING (user uploaded screenshot)
   ↓
APPROVED (admin verified and credited account)
   ↓
COMPLETED (funds in account)

OR

REJECTED (admin denied request)
   ↑
(user can resubmit)
```

### Withdrawal Flow
```
PENDING (user submitted, funds held)
   ↓
APPROVED → COMPLETED (admin approved, payment sent)

OR

REJECTED (funds refunded to account)
   ↑
(user can try again)
```

---

## 🔄 Fund Lifecycle

### Deposit
1. User initiates deposit, uploads screenshot
2. Deposit created with `pending` status
3. Admin reviews screenshot
4. Admin approves → account credited → status `approved`
5. Transaction record created
6. User sees updated balance

### Withdrawal
1. User requests withdrawal, uploads proof
2. Funds immediately deducted (held)
3. Withdrawal created with `pending` status
4. Admin reviews screenshot
5. Admin approves → status `completed` (payment sent)
   OR Admin rejects → funds refunded to account
6. User sees updated balance

---

## ⚠️ Error Handling

**Validation Errors** (400):
```json
{
  "errors": [
    { "param": "amount", "msg": "Amount must be greater than 0" }
  ]
}
```

**Authorization Errors** (403):
```json
{ "error": "Access denied" }
```

**Not Found** (404):
```json
{ "error": "Deposit not found" }
```

**Business Logic Errors** (400):
```json
{ "error": "Insufficient account balance" }
```

---

## 📞 Common Issues

### "Minimum deposit is $500"
- User tried to deposit less than minimum
- Check admin settings for current minimum
- Default: $500

### "Insufficient account balance"
- Withdrawal amount exceeds account balance
- Check account balance first
- Request lower amount

### "Screenshot is required"
- User didn't upload proof image
- Must upload JPEG, PNG, or PDF
- Max 5MB

### "Cannot approve deposit with status: rejected"
- Deposit was already rejected
- User must submit new deposit
- Cannot change rejected status

---

## 📈 Analytics & Reporting

### Metrics to Track
- Total deposits pending approval
- Average approval time
- Deposit success rate
- Popular deposit methods
- Daily/monthly withdrawal volume
- Failed/rejected transactions

### Admin Dashboard Features (Future)
- Charts: deposit/withdrawal trends
- Approval queue status
- User activity heatmap
- Method usage statistics
- Fraud alerts/flags

---

**Last Updated**: August 21, 2024  
**Version**: 1.0.0
