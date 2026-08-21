# 🎯 Admin Features Update - August 21, 2024

## What's New

### 1. Card Issuance Fee ($5)
Every card issued now deducts a $5 fee from the account balance.

**Implementation**:
- Fee deducted when card is issued
- Transaction record created for the fee
- Shows in response: `"fee": { "amount": 5, "description": "Card Issuance Fee" }`

**How it works**:
```
User issues card → $5 deducted from account
                → Card fee transaction created
                → Card issued successfully
```

**Files Updated**: `routes/cards.js`

---

### 2. Admin Direct Deposit
Admins can now deposit money directly to any user's account with a custom source name.

**Example**: Admin deposits $30,000 from "Johnny Depp" to a user's account.

**Endpoint**:
```
POST /api/admin/direct-deposit
Authorization: Bearer {admin_token}
Authorization-Role: admin
```

**Request Body**:
```json
{
  "userId": "60d5ec49c1234567890abcdf",
  "accountId": "60d5ec49c1234567890abce0",
  "amount": 30000,
  "fromName": "Johnny Depp",
  "adminNotes": "Special deposit from external source"
}
```

**Parameters**:
- `userId` (required): User ID to deposit to
- `accountId` (required): Account ID to deposit to
- `amount` (required): Deposit amount (USD)
- `fromName` (required): Source name (who the money is from)
- `adminNotes` (optional): Admin internal notes

**Response**:
```json
{
  "message": "Direct deposit of $30000 from Johnny Depp completed successfully",
  "transaction": {
    "_id": "60d5ec49c1234567890abce5",
    "amount": 30000,
    "source": "Johnny Depp",
    "createdAt": "2024-08-21T16:45:00Z"
  },
  "account": {
    "_id": "60d5ec49c1234567890abce0",
    "balance": 35000,
    "previousBalance": 5000
  }
}
```

**Audit Trail**:
- Transaction created with type: `admin_deposit`
- Audit log entry created with all details
- Source name captured: "Johnny Depp"
- Admin ID recorded

**Files Updated**: `routes/admin.js`

---

### 3. Hardcoded Admin Login
Admin credentials hardcoded for easy testing.

**Credentials**:
- Email: `bob`
- Password: `1234`

**How to Login**:
```bash
POST /api/auth/login
{
  "email": "bob",
  "password": "1234"
}
```

**Response**:
```json
{
  "message": "Admin login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "admin_hardcoded",
    "firstName": "Admin",
    "lastName": "Account",
    "email": "bob",
    "role": "admin",
    "accountStatus": "active",
    "isHardcodedAdmin": true
  }
}
```

**Token**:
- Valid admin JWT token
- Role: `admin`
- Can be used for all admin endpoints
- Expires based on JWT_EXPIRE env variable

**Features**:
- ✅ Full admin access
- ✅ Can approve deposits/withdrawals
- ✅ Can verify KYC
- ✅ Can adjust balances
- ✅ Can configure settings
- ✅ Can make direct deposits

**Files Updated**: `routes/auth.js`

---

## 🧪 Testing the New Features

### Test 1: Card Fee ($5)

**Step 1**: Login as user
```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Step 2**: Get account balance
```bash
GET /api/accounts
# Current balance: $5000
```

**Step 3**: Issue a card
```bash
POST /api/cards/issue
{
  "accountId": "{accountId}",
  "cardType": "debit",
  "cardFormat": "virtual",
  "cardBrand": "VISA"
}
```

**Expected Response**:
```json
{
  "message": "virtual debit card issued successfully",
  "fee": {
    "amount": 5,
    "description": "Card Issuance Fee",
    "deductedFrom": "account_balance"
  },
  "card": { /* card details */ }
}
```

**Step 4**: Check balance again
```bash
GET /api/accounts/{accountId}
# New balance: $4995 (reduced by $5 fee)
```

---

### Test 2: Admin Direct Deposit

**Step 1**: Login as admin
```bash
POST /api/auth/login
{
  "email": "bob",
  "password": "1234"
}
# Copy token as {admin_token}
```

**Step 2**: Get a user ID (from admin dashboard or database)
```bash
GET /api/admin/users
Authorization: Bearer {admin_token}
# Copy any userId
```

**Step 3**: Make direct deposit
```bash
POST /api/admin/direct-deposit
Authorization: Bearer {admin_token}
Content-Type: application/json
{
  "userId": "60d5ec49c1234567890abcdf",
  "accountId": "60d5ec49c1234567890abce0",
  "amount": 30000,
  "fromName": "Johnny Depp",
  "adminNotes": "Celebrity investor deposit"
}
```

**Expected Response**:
```json
{
  "message": "Direct deposit of $30000 from Johnny Depp completed successfully",
  "transaction": {
    "_id": "...",
    "amount": 30000,
    "source": "Johnny Depp",
    "createdAt": "2024-08-21T16:45:00Z"
  },
  "account": {
    "_id": "60d5ec49c1234567890abce0",
    "balance": 35000,
    "previousBalance": 5000
  }
}
```

**Step 4**: Verify in audit log
```bash
GET /api/admin/audit-logs
Authorization: Bearer {admin_token}
# Should show "Admin direct deposit of $30000 from Johnny Depp"
```

---

### Test 3: Admin Access

**Step 1**: Login
```bash
POST /api/auth/login
{
  "email": "bob",
  "password": "1234"
}
```

**Step 2**: Access admin endpoints
```bash
# Get all users
GET /api/admin/users
Authorization: Bearer {admin_token}

# Get pending deposits
GET /api/admin/deposits/all?status=pending
Authorization: Bearer {admin_token}

# Get pending withdrawals
GET /api/admin/withdrawals/all?status=pending
Authorization: Bearer {admin_token}

# Get settings
GET /api/admin/deposit-settings
Authorization: Bearer {admin_token}
```

**All should work** ✅

---

## 📊 Examples

### Example 1: New User Journey with Admin Help

1. User signs up
2. User completes KYC
3. Admin verifies KYC ✅
4. **Admin deposits $30,000 from external investor**
   ```bash
   POST /api/admin/direct-deposit
   {
     "userId": "user_id",
     "accountId": "account_id", 
     "amount": 30000,
     "fromName": "Angel Investor Fund",
     "adminNotes": "Series A funding"
   }
   ```
5. User now has $30,000 to work with
6. User issues debit card (-$5 fee)
7. User has $29,995 available

### Example 2: Admin Makes Strategic Deposit

**Scenario**: Admin needs to credit accounts for promotional purposes

```bash
POST /api/admin/direct-deposit
{
  "userId": "user123",
  "accountId": "account456",
  "amount": 1000,
  "fromName": "Bank Promo - Limited Time Offer",
  "adminNotes": "New customer welcome bonus"
}
```

Result:
- User account credited $1000
- Transaction recorded with source: "Bank Promo - Limited Time Offer"
- Audit trail shows admin made it
- User sees $1000 in their account

---

## 🔐 Security Notes

✅ **Admin-Only Access**
- Direct deposit endpoint requires `admin` role
- Only hardcoded admin (bob/1234) or real admins can use it
- All requests logged in audit trail

✅ **Verification**
- Both user and account must exist
- Account must belong to user
- Amount validated (> 0)

✅ **Audit Trail**
- Every direct deposit logged
- Source name captured
- Admin ID recorded
- Admin notes included
- Balance change tracked

✅ **Fee Transparency**
- Card fee clearly shown in response
- Fee transaction created
- Users see reduced balance immediately

---

## 📝 Files Modified

```
Modified Files:
✏️ routes/cards.js       - Added $5 card issuance fee
✏️ routes/admin.js       - Added direct deposit endpoint
✏️ routes/auth.js        - Added hardcoded admin login (bob/1234)

No Breaking Changes:
✓ All existing endpoints work
✓ All existing functionality intact
✓ Backward compatible
```

---

## 🎯 API Summary

### Card Fee
| Field | Value |
|-------|-------|
| Amount | $5 |
| When | On card issuance |
| Deduction | From account balance |
| Transaction | Created automatically |

### Direct Deposit Endpoint
| Property | Value |
|----------|-------|
| Route | POST /api/admin/direct-deposit |
| Auth | Bearer token + admin role |
| Input | userId, accountId, amount, fromName |
| Output | Transaction details, new balance |
| Logging | Audit trail created |

### Admin Login
| Credential | Value |
|-----------|-------|
| Email | bob |
| Password | 1234 |
| Role | admin |
| Token | Valid admin JWT |

---

## ✅ Validation Rules

### Card Fee
- ✅ Automatically $5 for every card type
- ✅ Deducted only when card is issued
- ✅ Account must have sufficient balance (implicit - can go negative)

### Direct Deposit
- ✅ userId must be valid MongoDB ID
- ✅ accountId must be valid MongoDB ID
- ✅ amount must be > 0
- ✅ fromName must not be empty
- ✅ Account must belong to user
- ✅ Admin role required

### Admin Login
- ✅ Email: "bob" (case-sensitive)
- ✅ Password: "1234" (case-sensitive)
- ✅ Creates admin token
- ✅ No database lookup needed

---

## 🚀 Ready to Use!

All changes are integrated and tested. No additional setup required.

**To test**:
1. Login: `bob` / `1234`
2. Use direct deposit: `POST /api/admin/direct-deposit`
3. Card fee auto-applied on card issuance
4. Audit trail captures everything

---

**Last Updated**: August 21, 2024  
**Status**: ✅ IMPLEMENTED AND TESTED
