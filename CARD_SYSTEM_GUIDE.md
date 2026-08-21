# 💳 Card Management System Guide

## Overview

The Bank of the Brave card management system provides comprehensive debit and credit card operations including issuance, security controls, spending limits, and loan linking.

---

## ✨ Features

### Card Issuance
- **Virtual Cards**: Instant card generation (no delivery wait)
- **Physical Cards**: Traditional card with delivery tracking
- **Multiple Brands**: VISA, MASTERCARD, AMEX, DISCOVER
- **Card Types**: Debit and Credit cards
- **Primary Card**: First debit card automatically set as primary

### Security Controls
- **Card Freezing**: Temporarily disable card transactions
- **Card Unfreezing**: Re-enable frozen card
- **PIN Management**: Set/change 4-digit PIN
- **3D Secure**: Optional advanced authentication
- **Contactless Control**: Enable/disable contactless payments

### Spending Limits & Tracking
- **Daily Spend Limit**: Control max daily spending (default: $5,000)
- **ATM Limit**: Control max daily ATM withdrawals (default: $1,000)
- **Current Day Spending**: Real-time tracking of daily spending
- **Spending Reset**: Automatic reset at midnight (UTC)
- **International Transactions**: Toggle international payment support

### Advanced Features
- **Loan Linking**: Link credit cards to loan accounts for payments
- **Card Replacement**: Replace lost, stolen, or damaged cards
- **Transaction History**: View all card transactions
- **Card Cancellation**: Safely cancel cards with primary card failover

---

## 🔌 API Endpoints

### 1. List All Cards
```
GET /api/cards
```

**Authentication**: Required (JWT Token)

**Response**:
```json
{
  "message": "Cards retrieved successfully",
  "count": 2,
  "cards": [
    {
      "_id": "60d5ec49c1234567890abcde",
      "userId": "60d5ec49c1234567890abcdf",
      "accountId": "60d5ec49c1234567890abce0",
      "cardType": "debit",
      "cardFormat": "physical",
      "cardBrand": "VISA",
      "status": "active",
      "last4Digits": "1234",
      "maskedCardNumber": "****-****-****-1234",
      "cardholderName": "JOHN DOE",
      "dailySpendLimit": 5000,
      "atmDailyLimit": 1000,
      "currentDaySpending": 250,
      "currentDayATMWithdrawal": 0,
      "isPrimary": true,
      "isDefault": true,
      "hasPin": true,
      "onlinePaymentsEnabled": true,
      "internationalTransactionsEnabled": false,
      "contactlessEnabled": true,
      "threeDSecureEnabled": true,
      "issueDate": "2024-08-21T10:00:00Z",
      "createdAt": "2024-08-21T10:00:00Z",
      "updatedAt": "2024-08-21T10:00:00Z"
    }
  ]
}
```

---

### 2. Get Single Card Details
```
GET /api/cards/:cardId
```

**Authentication**: Required (JWT Token)

**Parameters**:
- `cardId` (path): Card ID

**Response**: Single card object (same structure as list endpoint)

---

### 3. Issue New Card
```
POST /api/cards/issue
```

**Authentication**: Required (JWT Token)

**Request Body**:
```json
{
  "accountId": "60d5ec49c1234567890abce0",
  "cardType": "debit",
  "cardFormat": "virtual",
  "cardBrand": "VISA"
}
```

**Parameters**:
- `accountId` (required): MongoDB ID of the account
- `cardType` (required): "debit" or "credit"
- `cardFormat` (required): "virtual" or "physical"
- `cardBrand` (required): "VISA", "MASTERCARD", "AMEX", "DISCOVER"

**Response**:
```json
{
  "message": "virtual debit card issued successfully",
  "card": { /* card object */ },
  "cardDetails": {
    "cardNumber": "4532123456789012",
    "cvv": "123",
    "expiryDate": "08/29",
    "note": "Please save these details securely. They will not be shown again."
  }
}
```

**Status Code**: 201 Created

---

### 4. Freeze Card
```
POST /api/cards/:cardId/freeze
```

**Authentication**: Required (JWT Token)

**Response**:
```json
{
  "message": "Card frozen successfully",
  "card": { /* updated card object */ }
}
```

---

### 5. Unfreeze Card
```
POST /api/cards/:cardId/unfreeze
```

**Authentication**: Required (JWT Token)

**Response**:
```json
{
  "message": "Card unfrozen successfully",
  "card": { /* updated card object */ }
}
```

---

### 6. Update Card Settings
```
POST /api/cards/:cardId/settings
```

**Authentication**: Required (JWT Token)

**Request Body** (all fields optional):
```json
{
  "dailySpendLimit": 10000,
  "atmDailyLimit": 2000,
  "onlinePaymentsEnabled": true,
  "internationalTransactionsEnabled": true,
  "contactlessEnabled": true,
  "threeDSecureEnabled": true
}
```

**Response**:
```json
{
  "message": "Card settings updated successfully",
  "card": { /* updated card object */ }
}
```

---

### 7. Set Card PIN
```
POST /api/cards/:cardId/pin
```

**Authentication**: Required (JWT Token)

**Request Body**:
```json
{
  "pin": "1234"
}
```

**Parameters**:
- `pin` (required): 4-digit numeric PIN

**Response**:
```json
{
  "message": "PIN set successfully",
  "card": { /* updated card object */ }
}
```

---

### 8. Link Card to Loan
```
POST /api/cards/:cardId/link-loan
```

**Authentication**: Required (JWT Token)

**Request Body**:
```json
{
  "loanId": "60d5ec49c1234567890abce2"
}
```

**Parameters**:
- `loanId` (required): MongoDB ID of the loan

**Response**:
```json
{
  "message": "Loan linked to card successfully",
  "card": { /* updated card object */ }
}
```

**Notes**:
- Only credit cards can be linked to loans
- Loan must belong to the authenticated user

---

### 9. Replace Card
```
POST /api/cards/:cardId/replace
```

**Authentication**: Required (JWT Token)

**Request Body**:
```json
{
  "reason": "lost",
  "cardFormat": "physical"
}
```

**Parameters**:
- `reason` (required): "lost", "stolen", or "damaged"
- `cardFormat` (optional): "virtual" or "physical" (defaults to original format)

**Response**:
```json
{
  "message": "Replacement physical card created successfully",
  "card": { /* new card object */ },
  "cardDetails": {
    "cardNumber": "4532987654321098",
    "cvv": "456",
    "expiryDate": "08/29",
    "note": "Please save these details securely."
  }
}
```

**Status Code**: 201 Created

**Notes**:
- Old card status automatically set to "cancelled"
- New card inherits primary status if applicable
- Automatic audit logging

---

### 10. Get Card Transactions
```
GET /api/cards/:cardId/transactions
```

**Authentication**: Required (JWT Token)

**Response**:
```json
{
  "message": "Card transactions retrieved successfully",
  "count": 5,
  "transactions": [
    {
      "_id": "60d5ec49c1234567890abce3",
      "fromAccountId": "60d5ec49c1234567890abce0",
      "toAccountId": "60d5ec49c1234567890abce4",
      "amount": 150.50,
      "currency": "USD",
      "transactionType": "card_purchase",
      "description": "Amazon Purchase",
      "status": "completed",
      "fee": 0,
      "exchangeRate": 1,
      "createdAt": "2024-08-21T14:30:00Z"
    }
  ]
}
```

---

### 11. Cancel Card
```
POST /api/cards/:cardId/cancel
```

**Authentication**: Required (JWT Token)

**Response**:
```json
{
  "message": "Card cancelled successfully",
  "card": { /* updated card object with status: "cancelled" */ }
}
```

**Notes**:
- If this is the primary card, another active card of same type is promoted to primary
- If no other active cards exist, no primary card is set

---

### 12. Admin: Get All Cards
```
GET /api/cards/admin/all-cards
```

**Authentication**: Required (JWT Token)  
**Authorization**: admin or compliance role required

**Query Parameters** (all optional):
- `userId`: Filter by user ID
- `status`: Filter by status (active, frozen, expired, cancelled)
- `cardType`: Filter by card type (debit, credit)

**Response**:
```json
{
  "message": "All cards retrieved",
  "count": 25,
  "cards": [ /* array of card objects with populated user/account info */ ]
}
```

---

## 🧪 Testing with Postman

### Prerequisites
1. Register and login to get JWT token
2. Create an account for card issuance

### Test Sequence

**Step 1: Login**
```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```
Copy the `token` from response.

**Step 2: Get Accounts**
```
GET /api/accounts
Authorization: Bearer {token}
```
Copy an `accountId`.

**Step 3: Issue Virtual Debit Card**
```
POST /api/cards/issue
Authorization: Bearer {token}
{
  "accountId": "{accountId}",
  "cardType": "debit",
  "cardFormat": "virtual",
  "cardBrand": "VISA"
}
```
Copy the `_id` from response as `{cardId}`.

**Step 4: Update Card Settings**
```
POST /api/cards/{cardId}/settings
Authorization: Bearer {token}
{
  "dailySpendLimit": 10000,
  "internationalTransactionsEnabled": true
}
```

**Step 5: Set PIN**
```
POST /api/cards/{cardId}/pin
Authorization: Bearer {token}
{
  "pin": "1234"
}
```

**Step 6: View All Cards**
```
GET /api/cards
Authorization: Bearer {token}
```

**Step 7: Freeze Card**
```
POST /api/cards/{cardId}/freeze
Authorization: Bearer {token}
```

**Step 8: Unfreeze Card**
```
POST /api/cards/{cardId}/unfreeze
Authorization: Bearer {token}
```

**Step 9: Issue Credit Card**
```
POST /api/cards/issue
Authorization: Bearer {token}
{
  "accountId": "{accountId}",
  "cardType": "credit",
  "cardFormat": "virtual",
  "cardBrand": "MASTERCARD"
}
```
Copy the `_id` as `{creditCardId}`.

**Step 10: Get Card Details**
```
GET /api/cards/{cardId}
Authorization: Bearer {token}
```

**Step 11: Replace Card**
```
POST /api/cards/{cardId}/replace
Authorization: Bearer {token}
{
  "reason": "damaged",
  "cardFormat": "physical"
}
```

---

## 🔐 Security Features

### Data Protection
- Sensitive fields (cardNumber, CVV, PIN) never returned in API responses
- All sensitive data hashed with SHA-256
- Passwords and PINs salted and hashed

### Access Control
- User can only manage their own cards
- Admin endpoints require admin/compliance role
- All operations logged in AuditLog

### Transaction Safety
- Daily spending limits prevent excessive charges
- ATM withdrawal limits prevent cash abuse
- Primary card failover prevents service disruption
- 3D Secure optional for enhanced security

---

## 📊 Card States

```
ACTIVE ←→ FROZEN
  ↓
EXPIRED or CANCELLED (terminal state)
  ↑
REPLACED (points to replacement card)
```

### Status Definitions
- **active**: Card is operational and can be used
- **frozen**: Card is temporarily blocked (can be unfrozen)
- **expired**: Card has reached expiration date
- **cancelled**: Card is permanently inactive

---

## 📝 Audit Logging

All card operations are automatically logged:

| Action | Details Logged |
|--------|-----------------|
| CARD_ISSUED | cardId, type, format, brand, last4 |
| CARD_FROZEN | cardId, last4 |
| CARD_UNFROZEN | cardId, last4 |
| CARD_SETTINGS_UPDATED | cardId, last4, changes |
| CARD_PIN_SET | cardId, last4 |
| LOAN_LINKED_TO_CARD | cardId, loanId, last4 |
| CARD_REPLACED | oldCardId, newCardId, reason, last4 |
| CARD_CANCELLED | cardId, last4 |

---

## ⚠️ Error Handling

### Common Errors

**400 Bad Request**
```json
{
  "errors": [
    { "param": "cardType", "msg": "Card type must be debit or credit" }
  ]
}
```

**403 Forbidden**
```json
{ "error": "Access denied" }
```

**404 Not Found**
```json
{ "error": "Card not found" }
```

**500 Server Error**
```json
{ "error": "Server error: [error details]" }
```

---

## 🔄 Spending Reset Logic

- **Reset Time**: Daily at 00:00 UTC
- **Reset Fields**: 
  - `currentDaySpending` → 0
  - `currentDayATMWithdrawal` → 0
  - `spendingResetDate` → current date

*Note: Manual reset trigger should be implemented in a cron job or background task*

---

## 💡 Best Practices

### For Users
1. **Save card details immediately** after issuance (never shown again)
2. **Set a PIN** for physical card protection
3. **Enable 3D Secure** for online transactions
4. **Monitor spending limits** based on your habits
5. **Freeze card immediately** if lost or stolen

### For Administrators
1. **Review audit logs** regularly for suspicious activity
2. **Monitor velocity transfers** to detect fraud
3. **Require approval** for high-value transactions
4. **Regularly verify** card status consistency
5. **Archive cancelled cards** periodically

---

## 🚀 Future Enhancements

- [ ] Biometric card authentication
- [ ] NFC payment support
- [ ] Real-time fraud detection ML model
- [ ] Dynamic spending limits based on risk
- [ ] Physical card customization
- [ ] Multi-signature card controls
- [ ] Contactless payment notifications
- [ ] Card wear and tear monitoring

---

## 📞 Support

For card-related issues:
1. Check audit logs for transaction history
2. Verify card status and limits
3. Contact compliance team for suspicious activity
4. Submit support ticket with card last4 digits

---

**Last Updated**: August 21, 2024  
**Version**: 1.0.0
