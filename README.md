# Private Banking Platform - Bank of the Brave

> **🎉 NEW FEATURE (Aug 21, 2024)**: Complete deposit & withdrawal approval system with screenshot verification, admin controls, and fund management. [See Details →](./DEPOSIT_WITHDRAWAL_SYSTEM.md)

A dual-architecture private banking system built with Node.js, Express, and MongoDB. Features a comprehensive Admin Back-Office Console and Client Frontend Portal with support for KYC verification, loans, transfers, deposits, withdrawals, and more.

## Features

### Admin Back-Office Console
- **User Management**: View, approve, suspend, or terminate accounts
- **Balance Adjustment**: Credit/debit user accounts with audit logging
- **KYC/AML Verification**: Review uploaded documents and approve/reject identity verification
- **Transaction Management**: Real-time ledger view and approval queues for high-value transfers
- **Loan Approvals**: Review and approve loan applications
- **Fee Configuration**: Manage transfer fees and tariffs
- **Role-Based Access Control**: Super Admin, Compliance Officer, Support Agent, Auditor, Wealth Manager
- **Audit Logs**: Immutable event tracking of all actions
- **Multi-factor Approvals**: High-value transfers require multiple admin signatures

### Client Portal Features
- **Signup & KYC**: Realistic signup flow with immediate KYC (SSN, ID, Selfie)
- **Account Funding**: Deposit via Bank Transfer, CashApp, or Venmo (minimum $500)
- **Multi-Currency Accounts**: USD, EUR, GBP, BTC support
- **Transfers**: Internal, P2P, and wire transfers
- **Card Services**: Issue virtual or physical debit/credit cards
- **Card Controls**: Freeze/unfreeze cards, adjust daily limits, toggle online payments
- **Loan Applications**: Apply for personal, collateralized, or investment deposits with credit card linking
- **IRS Returns**: Upload IRS documents for income verification
- **Account Statements**: PDF statements and transaction history
- **Dashboard**: Real-time balance and transaction monitoring

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT with bcryptjs password hashing
- **File Upload**: Multer
- **Security**: Helmet, CORS, input validation (express-validator)

## Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas cloud database)
- npm or yarn

## Setup Instructions

### 1. Clone/Extract Project
```bash
cd "Bank of the Brave"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/banking-platform
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

**For MongoDB Atlas** (Cloud):
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/banking-platform?retryWrites=true&w=majority
```

### 4. Set Up MongoDB

**Option A: Local MongoDB**
```bash
# Make sure MongoDB is running
# Windows: mongod (if installed)
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

**Option B: MongoDB Atlas (Recommended)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a cluster
4. Get your connection string
5. Update MONGODB_URI in .env

### 5. Create Directory Structure
```bash
# Windows
mkdir uploads\kyc
mkdir uploads\irs
mkdir public

# macOS/Linux
mkdir -p uploads/kyc
mkdir -p uploads/irs
mkdir -p public
```

### 6. Start Server
```bash
npm start
```

Server runs on http://localhost:5000

### 7. Access the Platform

**Client Portal**: http://localhost:5000/index.html
- Create account
- Complete KYC
- Fund account ($500 minimum)
- Access dashboard

**Admin Console** (Mock - create admin user via backend):
- Access via `/api/admin` endpoints
- Create admin users with roles: admin, compliance, support, auditor, wealth_manager

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### User Management
- `GET /api/users/profile` - Get profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/change-password` - Change password
- `POST /api/users/mfa/enable` - Enable MFA

### KYC
- `POST /api/kyc/submit` - Submit KYC documents
- `GET /api/kyc/status` - Check KYC status

### Accounts
- `GET /api/accounts` - Get user accounts
- `GET /api/accounts/:accountId` - Get account details
- `POST /api/accounts` - Create new account
- `GET /api/accounts/:accountId/transactions` - Get transactions
- `POST /api/accounts/:accountId/issue-card` - Issue card
- `POST /api/accounts/:accountId/card-control` - Freeze/unfreeze card
- `POST /api/accounts/:accountId/spending-limits` - Update limits

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions/internal-transfer` - Internal transfer
- `POST /api/transactions/wire-transfer` - Wire transfer
- `POST /api/transactions/deposit` - Submit deposit

### Loans
- `GET /api/loans` - Get user loans
- `POST /api/loans/apply` - Apply for loan
- `GET /api/loans/:loanId` - Get loan details

### Admin Routes
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:userId` - Get user details
- `POST /api/admin/balance-adjustment` - Adjust balance
- `POST /api/admin/kyc-verification` - Verify/reject KYC
- `POST /api/admin/account-status` - Suspend/terminate account
- `GET /api/admin/transactions/pending` - Get pending transactions
- `POST /api/admin/transaction-approval` - Approve/reject transaction
- `POST /api/admin/loan-approval` - Approve/reject loan
- `GET /api/admin/audit-logs` - Get audit logs

## User Flows

### New User Registration
1. **Signup** → Email, password, phone
2. **Immediate KYC** → SSN, ID document, selfie, address
3. **Funding** → Minimum $500 deposit via CashApp/Venmo/Bank Transfer
4. **Account Active** → Full portal access

### Admin Approval Flow
1. **KYC Review**: Compliance officer verifies documents
2. **Account Activation**: Once verified, account switches to "active"
3. **Transaction Approvals**: Transactions over $100k require 2 admin signatures
4. **Audit Trail**: All actions logged immutably

## Security Features

- JWT-based authentication with 7-day expiration
- bcryptjs password hashing (10 rounds)
- End-to-end SSL/TLS ready (configure in production)
- Input validation with express-validator
- Role-based access control (RBAC)
- Immutable audit logging
- Secure file uploads with multer
- CORS configured
- Helmet security headers

## Database Models

- **User**: Core user with KYC and MFA
- **Account**: Multi-currency accounts with card management
- **Transaction**: Complete transaction history with approval workflow
- **Loan**: Loan applications with IRS verification
- **AuditLog**: Immutable event tracking

## Development Notes

- No OTP verification on signup (KYC done after account creation)
- Manual payment uploads via screenshot/receipt
- Admin cannot add internal notes to user accounts
- Card issuing can be toggled by admin per configuration
- Deposit methods (CashApp, Venmo) configurable by admin

## Production Deployment

1. **Change JWT_SECRET** to a strong random string
2. **Set NODE_ENV=production**
3. **Use environment-specific MONGODB_URI**
4. **Enable HTTPS**
5. **Configure CORS for your domain**
6. **Set up environment variables on server**
7. **Enable rate limiting**
8. **Configure payment gateway (Stripe, etc.)**
9. **Set up email notifications**
10. **Implement 2FA enforcement**

## Deployment Options

- **Heroku**: Deploy with `heroku create` and push
- **Vercel**: Use serverless functions for API
- **AWS**: EC2 with MongoDB Atlas
- **DigitalOcean**: App Platform
- **Railway/Render**: One-click deployment

## Troubleshooting

### MongoDB Connection Error
```
Check that MongoDB is running and connection string is correct in .env
```

### Port Already in Use
```
npm start -- --port 5001
Or kill process on port 5000
```

### CORS Issues
```
Make sure frontend URL is allowed in CORS configuration
```

### File Upload Issues
```
Ensure uploads/ directory exists and has write permissions
Check file size limits in multer configuration
```

## Future Enhancements

- Real payment gateway integration
- Email notifications
- SMS 2FA
- Biometric authentication
- Mobile app
- Advanced portfolio tracking
- Relationship manager assignment
- Credit scoring
- Advanced fraud detection
- API rate limiting
- Webhook notifications

## License

MIT

## Support

For issues or questions, please create an issue in the repository.

---

Built with ❤️ for secure, private banking solutions.
