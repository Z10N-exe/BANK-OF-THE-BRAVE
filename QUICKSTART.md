# Quick Start Guide - Bank of the Brave

## 🚀 Get Running in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start MongoDB
Make sure MongoDB is running locally or update `.env` with your MongoDB Atlas connection string.

```bash
# Windows (if MongoDB installed)
mongod

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Step 3: Start the Server
```bash
npm start
```
Server will run on **http://localhost:5000**

### Step 4: Access the Platform

**Client Portal (Sign Up & Bank)**
- Go to http://localhost:5000/index.html
- Click "Sign Up"
- Create your account
- Complete KYC (SSN, ID, Selfie)
- Deposit $500+
- Access your dashboard

**Admin Console (Mock)**
- Use the `/api/admin` endpoints with Postman/curl
- Create admin users with role: `admin`
- Verify KYC documents
- Approve loans
- Adjust balances
- View audit logs

---

## 📋 Default Test Credentials

These won't exist yet - you'll create them:

```
Email: testuser@bankofthebrave.com
Password: Password123
Phone: +1234567890
```

---

## 🔑 Admin Routes (with JWT Token)

### 1. Get All Users
```bash
GET http://localhost:5000/api/admin/users
Headers: Authorization: Bearer <TOKEN>
```

### 2. Verify a User's KYC
```bash
POST http://localhost:5000/api/admin/kyc-verification
Headers: Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "userId": "user_id_here",
  "status": "verified",
  "notes": "Documents verified"
}
```

### 3. Adjust User Balance
```bash
POST http://localhost:5000/api/admin/balance-adjustment
Headers: Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "userId": "user_id_here",
  "accountId": "account_id_here",
  "amount": 1000,
  "type": "credit",
  "notes": "Welcome bonus"
}
```

### 4. Approve a Loan
```bash
POST http://localhost:5000/api/admin/loan-approval
Headers: Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "loanId": "loan_id_here",
  "action": "approve",
  "notes": "Approved by compliance"
}
```

---

## 📱 User Flow

1. **Sign Up** → Creates account in `pending_kyc` status
2. **Submit KYC** → Uploads SSN, ID, Selfie
3. **Admin Verifies** → Compliance officer approves/rejects
4. **Account Active** → Once verified, account status becomes `active`
5. **Fund Account** → User deposits $500+ to activate
6. **Use Banking Features** → Transfers, cards, loans, etc.

---

## 💳 Supported Features

### User Can Do:
- ✅ Create account (no OTP needed)
- ✅ Submit KYC documents
- ✅ Deposit money (Bank Transfer, CashApp, Venmo)
- ✅ Create multi-currency accounts
- ✅ Issue virtual/physical cards
- ✅ Make transfers
- ✅ Apply for loans
- ✅ Upload IRS documents
- ✅ View account statements
- ✅ Freeze/unfreeze cards

### Admin Can Do:
- ✅ View all users
- ✅ Verify/reject KYC
- ✅ Adjust account balances
- ✅ Suspend/terminate accounts
- ✅ Approve high-value transfers
- ✅ Approve/reject loans
- ✅ Configure deposit methods
- ✅ View immutable audit logs
- ✅ See transaction approvals
- ✅ Manage fees (placeholder)

---

## 🗄️ Database Schema

### User
- Email, password, firstName, lastName
- KYC status, documents
- Account references
- MFA settings
- Account status (active, suspended, pending_kyc, terminated)

### Account
- Balance, currency
- Card info
- Spending limits
- Deposit methods
- Account type

### Transaction
- Type (transfer, deposit, withdrawal, loan, etc.)
- Status (pending, approved, completed, rejected)
- Approvals (admin signatures for high-value)
- Amount, fees, FX rate

### Loan
- Amount, interest rate, term
- Collateral (credit card, deposit)
- Status (pending, approved, active)
- Monthly payment schedule
- IRS documentation

### AuditLog
- Admin action
- User affected
- What changed (before/after)
- IP address, timestamp
- Immutable record

---

## 🛠️ Environment Variables

```env
PORT=5000                          # Server port
MONGODB_URI=mongodb://...          # MongoDB connection
JWT_SECRET=your_secret_key         # JWT signing key
JWT_EXPIRE=7d                      # Token expiration
NODE_ENV=development               # Environment
```

---

## 🔒 Security Features

- **JWT Authentication** - Tokens expire in 7 days
- **Password Hashing** - bcryptjs with 10 rounds
- **Role-Based Access** - admin, compliance, support, auditor, wealth_manager
- **Audit Logging** - Every action logged immutably
- **Input Validation** - Express-validator on all routes
- **File Upload Security** - Multer with type/size limits
- **Helmet Security** - XSS, CSRF, clickjacking protection
- **CORS Configured** - Prevents cross-origin attacks

---

## 📊 File Structure

```
Bank of the Brave/
├── models/                 # MongoDB schemas
│   ├── User.js
│   ├── Account.js
│   ├── Transaction.js
│   ├── Loan.js
│   └── AuditLog.js
├── routes/                 # API endpoints
│   ├── auth.js
│   ├── users.js
│   ├── accounts.js
│   ├── transactions.js
│   ├── kyc.js
│   ├── loans.js
│   └── admin.js
├── middleware/
│   └── auth.js             # JWT & RBAC
├── public/                 # Frontend
│   ├── index.html
│   ├── kyc.html
│   ├── funding.html
│   ├── dashboard.html
│   └── (more pages)
├── uploads/                # File storage
│   ├── kyc/
│   └── irs/
├── server.js               # Entry point
├── package.json
├── .env                    # Config
└── README.md
```

---

## 🐛 Troubleshooting

### "Cannot connect to MongoDB"
- Check MongoDB is running
- Update MONGODB_URI in .env
- For Atlas: use connection string from dashboard

### "Port 5000 already in use"
- Kill process: `lsof -ti:5000 | xargs kill -9`
- Or use different port: `PORT=5001 npm start`

### "CORS error in browser"
- Frontend and backend must be on same origin or CORS configured
- Currently allows all origins in development

### "File upload fails"
- Check `uploads/kyc` and `uploads/irs` directories exist
- Ensure file size under 5MB for KYC, 10MB for IRS
- Check file type is jpg/png/pdf

---

## 📝 Next Steps

1. **Test signup flow** at http://localhost:5000/index.html
2. **Create test user** with full KYC
3. **Verify KYC as admin** using `/api/admin/kyc-verification`
4. **Submit deposit** for user activation
5. **Test transfers, loans, cards**
6. **View audit logs** to see immutable tracking

---

## 🚀 Production Checklist

- [ ] Change JWT_SECRET to strong random string
- [ ] Set NODE_ENV=production
- [ ] Use MongoDB Atlas (don't expose local DB)
- [ ] Enable HTTPS
- [ ] Configure CORS for your domain
- [ ] Set up rate limiting
- [ ] Enable 2FA enforcement
- [ ] Configure email notifications
- [ ] Integrate real payment gateway
- [ ] Set up CI/CD pipeline
- [ ] Deploy to cloud (Heroku, AWS, etc.)

---

## 📞 Support

For issues:
1. Check error logs: `npm start` output
2. Check MongoDB connection
3. Verify .env variables
4. Check file permissions in uploads/
5. Ensure port 5000 is available

---

Happy Banking! 🏦
