# ⚡ Quick Admin Guide

## Login (Hardcoded)

```
Email: bob
Password: 1234
```

Copy token from response, use in Bearer header.

---

## Direct Deposit (Admin Only)

Deposit money to any user from any source.

```bash
POST /api/admin/direct-deposit
Authorization: Bearer {admin_token}
{
  "userId": "user_id_here",
  "accountId": "account_id_here",
  "amount": 30000,
  "fromName": "Johnny Depp"
}
```

**Result**: Account balance increased, transaction created, audit logged.

---

## Card Fee

$5 deducted automatically when user issues any card.

**Example**:
- User balance: $5000
- User issues card
- Fee: -$5
- New balance: $4995

---

## Admin Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/admin/users` | List all users |
| `POST /api/admin/direct-deposit` | Deposit to user |
| `GET /api/admin/deposits/all` | View pending deposits |
| `POST /api/admin/deposits/:id/approve` | Approve deposit |
| `GET /api/admin/withdrawals/all` | View pending withdrawals |
| `POST /api/admin/withdrawals/:id/approve` | Approve withdrawal |
| `GET /api/admin/audit-logs` | View all actions |
| `POST /api/admin/kyc-verification` | Approve/reject KYC |
| `POST /api/admin/balance-adjustment` | Manual balance change |

---

## Test Flow

1. **Login**: `POST /api/auth/login` → bob / 1234
2. **Deposit**: `POST /api/admin/direct-deposit` → $30,000 from Johnny Depp
3. **Check**: `GET /api/accounts/{accountId}` → balance increased
4. **Audit**: `GET /api/admin/audit-logs` → see the deposit logged

---

That's it! 🎉
