# Bank of the Brave - Complete User-Facing Sitemap

## Overview
A comprehensive private banking portal with 30+ user-facing pages organized across 6 functional zones covering onboarding, accounts, payments, cards, wealth services, and support.

---

## 1. ONBOARDING & AUTHENTICATION ZONE

### 1.1 Landing Page
**URL:** `/landing.html`
**Purpose:** Platform introduction and public content
- Feature highlights
- Security information
- Pricing tiers
- Call-to-action buttons to signup/login

### 1.2 Login / Signup
**URL:** `/index.html`
**Purpose:** Authentication entry point
**Features:**
- Toggle between Login and Signup modes
- Email/password authentication
- Real-time form validation
- Direct routing to KYC after signup

### 1.3 KYC Verification (Know Your Customer)
**URL:** `/kyc.html`
**Purpose:** Identity verification workflow
**3-Step Process:**
- Step 1: Personal Information
  - SSN, DOB, address, city, state, zip, country
- Step 2: Document Upload
  - ID type selection (Driver's License, Passport, National ID)
  - ID document file upload
- Step 3: Selfie with ID
  - Facial liveness check
  - Photo with ID visible

**Status Tracking:**
- Form validation at each step
- Progress bar showing completion
- Document type selection

### 1.4 KYC Status Page
**URL:** `/kyc-status.html` (extensible)
**Purpose:** Real-time KYC verification tracking
**Status Options:**
- Not Started
- Pending Review
- Verified ✓
- Rejected (with resubmission option)
- Awaiting Additional Documents

### 1.5 Account Funding / Initial Deposit
**URL:** `/funding.html`
**Purpose:** First deposit to activate account
**Deposit Methods:**
- Bank Transfer (ACH/Wire)
- CashApp
- Venmo
**Features:**
- Minimum $500 requirement display
- Proof of deposit upload
- Receipt/screenshot validation
- Deposit status tracking

### 1.6 Two-Factor Authentication (2FA)
**URL:** `/2fa.html` (extensible)
**Purpose:** Additional security verification
**Methods:**
- TOTP (Authenticator App)
- SMS/Email OTP
- Hardware Token

### 1.7 Password Reset
**URL:** `/password-reset.html` (extensible)
**Purpose:** Self-service account recovery
**Features:**
- Email verification link
- New password form
- Security questions (optional)
- Confirmation screen

---

## 2. CORE DASHBOARD & ACCOUNT OVERVIEW ZONE

### 2.1 Main Dashboard
**URL:** `/dashboard.html`
**Purpose:** Primary user landing page after login
**Display Elements:**
- Total Net Worth (across all accounts)
- Multi-currency account summary
  - USD balance
  - EUR balance
  - GBP balance
  - BTC balance
- Quick action shortcuts
  - Send Money
  - Issue Card
  - Apply for Loan
- Recent activity feed (last 10 transactions)
- Account health indicators

### 2.2 Accounts Overview
**URL:** `/accounts.html`
**Purpose:** Manage multiple accounts
**Features:**
- Account grid display (checking, savings, investment)
- Account balance per currency
- IBAN/Routing numbers
- Quick actions per account
  - Send Money
  - Issue Card
  - View Details
- Add New Account button
- Recent transaction list
- Download statements option

### 2.3 Account Detail Page
**URL:** `/account-detail.html` (extensible)
**Purpose:** Single account deep dive
**Information:**
- Account type & status
- Balance history graph
- IBAN, Routing Number, Account Number
- Card associated (if any)
- Spending limits
- Deposit methods enabled

### 2.4 Transaction History & Ledger
**URL:** `/transactions.html` (extensible)
**Purpose:** Complete transaction history
**Features:**
- Filterable transaction list
  - By date range
  - By type (deposit, transfer, withdrawal)
  - By status
- Transaction detail view
  - Counterparty information
  - Amount and currency
  - Fees charged
  - Exchange rate (if FX)
  - Status (pending, completed, failed)
- Receipt download per transaction
- Export functionality (CSV, PDF)

### 2.5 Statements & Documents
**URL:** `/statements.html` (extensible)
**Purpose:** Generate and download official documents
**Available Documents:**
- Monthly Account Statements (PDF)
  - Transaction listing
  - Opening/closing balances
  - Fees summary
- Tax Documents
  - 1099 forms for interest earned
  - Transaction summaries for tax reporting
- Proof of Account Letters
  - Bank confirmation letters
  - IBAN verification
  - Balance certification

### 2.6 Transaction Detail View
**URL:** `/transaction-detail.html` (extensible)
**Purpose:** Deep dive into single transaction
**Details:**
- Transaction ID
- Type (Internal, Wire, ACH, Deposit, FX, etc.)
- Status timeline
- Sending account & recipient
- Amount breakdown
  - Principal amount
  - Fees
  - Exchange rate applied
- Proof of transaction
- Receipt download option

---

## 3. PAYMENTS & MONEY TRANSFERS ZONE

### 3.1 Transfer Hub / Money Transfer Page
**URL:** `/transfers.html`
**Purpose:** Centralized money transfer interface
**Transfer Types:**
1. **Internal Transfer**
   - Between own accounts
   - Instant settlement
   - No fees

2. **Local ACH Transfer**
   - Domestic US transfers
   - 1-3 business day settlement
   - Fees apply

3. **International Wire (SWIFT/SEPA)**
   - Global transfers
   - 2-5 business day settlement
   - Higher fees

4. **Currency Exchange (FX)**
   - Convert between supported currencies
   - Real-time rates
   - Spread applied

**Features per Type:**
- Source account selection
- Amount input
- Fee breakdown display
- Real-time exchange rates
- Recipient/counterparty details
- Transfer approval workflow
- Status tracking

### 3.2 Beneficiary / Payee Management
**URL:** `/beneficiaries.html` (extensible)
**Purpose:** Saved recipient directory
**Features:**
- Add new beneficiary
  - Name, IBAN, Bank details
  - Relationship (personal, business)
  - Verification process
- Edit existing beneficiary
- Delete beneficiary
- Favorite/bookmark beneficiaries
- Beneficiary usage history
- Quick-send to frequent payees

### 3.3 Scheduled & Recurring Payments
**URL:** `/recurring-payments.html` (extensible)
**Purpose:** Automated payment management
**Features:**
- View all scheduled transfers
- Create new standing order
  - Recipient
  - Amount
  - Frequency (daily, weekly, monthly, custom)
  - Start date, end date
  - Auto-renewal options
- Edit recurring payment
- Pause/Resume
- Cancel standing order
- Payment history per order

### 3.4 Currency Exchange (FX)
**URL:** `/transfers.html` (integrated)
**Purpose:** Real-time currency conversion
**Features:**
- Live exchange rate display
- Amount converter (from/to)
- Mid-market rate vs. spread
- Fee calculator
- Conversion preview
- Execution button
- Rate lock option (if available)

---

## 4. CARDS & SPENDING ZONE

### 4.1 Cards Management Dashboard
**URL:** `/cards.html`
**Purpose:** Visual overview of all cards
**Card Display:**
- Card visual (number masked, expiry, cardholder)
- Card type (Virtual/Physical)
- Account linked
- Card status (Active, Frozen, Terminated)
- Quick controls
  - Freeze/Unfreeze
  - View Details
  - Report Lost/Stolen

### 4.2 Request New Card
**URL:** `/cards.html` (integrated)
**Purpose:** Issue new virtual or physical card
**Options:**
- Card Type
  - Virtual (instant)
  - Physical (shipped)
- Currency
  - USD, EUR, GBP, BTC
- Account to link
- Delivery address (physical)
- Personalization (name on card, design)

### 4.3 Card Settings & Security
**URL:** `/cards.html` (integrated)
**Purpose:** Granular card controls
**Settings:**
- Daily Spending Limit
  - Range slider
  - Amount display
- ATM Withdrawal Limit
  - Daily max
  - Per-transaction max
- Online Payment Toggle
  - Enable/disable card-not-present transactions
- International Transaction Toggle
  - Allow/restrict cross-border purchases
- 3D Secure Authentication
  - Require additional verification
- PIN Management
  - Change PIN
  - Reset PIN
- Card Notifications
  - On/off toggle
  - Alert types

### 4.4 Card Controls (Freeze/Unfreeze)
**URL:** `/cards.html` (integrated)
**Purpose:** Temporary card disable/enable
**Features:**
- One-click freeze
- One-click unfreeze
- Reason for freeze (optional)
- Status confirmation
- Immediate effect

### 4.5 Card Transactions History
**URL:** `/card-transactions.html` (extensible)
**Purpose:** Transaction history for specific card
**Features:**
- Transaction list per card
- Filterable by date, amount, merchant
- Transaction details
- Dispute option
- Categorization (groceries, travel, etc.)

---

## 5. PRIVATE BANKING & WEALTH MANAGEMENT ZONE

### 5.1 Investments & Portfolio Overview
**URL:** `/investments.html` (extensible)
**Purpose:** Asset allocation dashboard
**Display:**
- Total Portfolio Value
- Asset Breakdown
  - Stocks (with symbols, quantities, values)
  - Bonds (type, yield, maturity)
  - Mutual Funds
  - ETFs
  - Cryptocurrencies
  - Real Estate
  - Cash Deposits
- Performance Metrics
  - YTD Return
  - 1-Year Return
  - Allocation pie chart
  - Historical performance graph

### 5.2 Term Deposits / Savings Vaults
**URL:** `/deposits.html` (extensible)
**Purpose:** High-yield fixed term deposit management
**Features:**
- View active deposits
  - Amount, currency, rate
  - Start date, maturity date
  - Interest accrued
  - Countdown to maturity
- Create new deposit
  - Amount
  - Term (3mo, 6mo, 1yr, 2yr, 3yr, 5yr)
  - Expected rate display
  - Auto-renewal option
- Early withdrawal option (with penalty display)
- Interest payout frequency

### 5.3 Loans & Credit Lines
**URL:** `/loans.html`
**Purpose:** Borrowing products management
**Loan Types:**
1. **Personal Loans**
   - Unsecured
   - Quick approval
   - Fixed rates

2. **Collateralized Loans**
   - Backed by credit card
   - Lower rates
   - Higher limits

3. **Investment Deposits**
   - High-yield with collateral
   - Flexible terms

**Features:**
- View active loans
  - Amount, rate, term
  - Monthly payment
  - Remaining balance
  - Payment schedule
  - Progress bar
- Apply for new loan
  - Loan type selection
  - Amount input
  - Term selection
  - IRS documentation upload
  - Income verification
  - Credit card linking (if collateralized)
- Make loan payments
- View amortization schedule
- Access loan documents

### 5.4 Relationship Manager Hub
**URL:** `/relationship-manager.html` (extensible)
**Purpose:** Direct advisor connection
**Features:**
- Assigned RM profile
  - Name, credentials, photo
  - Contact information
  - Availability
- Messaging portal
  - Secure in-app messaging
  - Message history
  - File sharing
- Appointment scheduling
  - Available time slots
  - Video call option
  - Rescheduling
- Request tracking
  - Open requests
  - Resolution status
- Document sharing
  - Portfolio recommendations
  - Market research

### 5.5 Referral Program (Optional)
**URL:** `/referrals.html` (extensible)
**Purpose:** Earn rewards for referrals
**Features:**
- Referral link generation
- Referral status tracking
- Reward calculation
- Redemption options

---

## 6. PROFILE, SECURITY & SUPPORT ZONE

### 6.1 User Profile & Settings
**URL:** `/settings.html`
**Purpose:** Account profile management
**Profile Section:**
- Personal Details
  - First Name, Last Name
  - Email (read-only)
  - Phone
  - Date of Birth
- Address
  - Street, City, State, ZIP, Country
- Additional Info
  - Tax Residency (if applicable)
  - Employer (optional)
  - Industry
- Communication Preferences

### 6.2 Security Settings
**URL:** `/settings.html` (integrated)
**Purpose:** Security management
**Features:**
- Password Management
  - Change password
  - Password strength indicator
  - Password history
- Two-Factor Authentication
  - Enable/disable 2FA
  - Manage TOTP devices
  - Backup codes
- Login Activity
  - Active sessions
  - Device list (name, IP, last login)
  - Revoke session/device
  - Login history timeline
- Account Recovery
  - Recovery email
  - Recovery phone
  - Security questions

### 6.3 Notification Center
**URL:** `/notifications.html` (extensible)
**Purpose:** In-app alerts and updates
**Alert Types:**
- Transaction Alerts
  - Confirmation of transfers
  - Failed transactions
  - Large transaction warnings
- Security Alerts
  - Login from new device
  - Password change confirmation
  - Suspicious activity
- Account Alerts
  - KYC approval/rejection
  - Loan approval/denial
  - Scheduled payment execution
  - Card expiration warnings
- Marketing & Promotions
  - New feature announcements
  - Promotional offers (opt-in)
  - Product recommendations

**Features:**
- Notification preferences (per type)
- Delivery method (In-app, Email, SMS)
- Notification history
- Read/unread status
- Archive notifications

### 6.4 Help Center & Support
**URL:** `/support.html` (extensible)
**Purpose:** Customer support interface
**Sections:**
1. **FAQ**
   - Searchable FAQ database
   - Categories
   - Frequently asked questions with answers
   - Helpfulness voting

2. **User Guides**
   - How-to articles
   - Step-by-step tutorials
   - Video guides
   - Troubleshooting

3. **Ticket Support**
   - Create new support ticket
     - Category selection
     - Subject
     - Description
     - File attachments
   - View ticket status
   - Ticket history
   - Follow-up messages

4. **Live Chat**
   - Chat with support agent (business hours)
   - Chat history
   - Estimated wait time
   - Chat transcript download

### 6.5 Account Closure (Optional)
**URL:** `/account-closure.html` (extensible)
**Purpose:** Close banking account
**Process:**
- Reason for closure
- Outstanding balance confirmation
- Final statement download
- Data deletion preferences
- Confirmation step

### 6.6 Activity & Login History
**URL:** `/activity.html` (extensible)
**Purpose:** Full audit trail of account access
**Display:**
- Login attempts (successful & failed)
- Timestamp
- Device info
- IP address
- Location
- Action taken (login, logout, password change, etc.)
- Exportable history

---

## 7. ADMIN/COMPLIANCE PAGES (Hidden from Regular Users)

### 7.1 Admin Dashboard
**URL:** `/admin/dashboard.html` (extensible)
**Purpose:** Admin overview
- Active users count
- Pending KYC verifications
- Pending transactions for approval
- Transaction volume stats
- Compliance metrics

### 7.2 User Management
**URL:** `/admin/users.html` (extensible)
**Purpose:** Admin user controls
- User list with search/filter
- View user details
- View KYC documents
- Approve/reject KYC
- Suspend/terminate accounts
- Adjust balances
- View audit logs per user

### 7.3 Transaction Approvals
**URL:** `/admin/transactions.html` (extensible)
**Purpose:** Admin transaction review
- Pending high-value transfers
- Approval workflow
- Multi-signature requirement

### 7.4 Audit Logs
**URL:** `/admin/audit-logs.html` (extensible)
**Purpose:** Immutable activity tracking
- All platform actions logged
- Searchable and filterable
- Export capability

---

## PAGE ARCHITECTURE SUMMARY

| Zone | Pages | Status |
|------|-------|--------|
| **Onboarding & Auth** | 7 | ✓ Core Built |
| **Dashboard & Accounts** | 6 | ✓ Core Built |
| **Payments & Transfers** | 4 | ✓ Core Built |
| **Cards & Spending** | 5 | ✓ Core Built |
| **Wealth Services** | 5 | ✓ Core Built |
| **Profile & Support** | 6 | ✓ Core Built |
| **Admin** | 4 | ⚠ Extensible |
| **TOTAL** | **37+** | **Ready** |

---

## NAVIGATION STRUCTURE

```
Landing Page (landing.html)
├── Signup (index.html?mode=signup)
│   ├── KYC (kyc.html)
│   ├── Funding (funding.html)
│   └── Dashboard (dashboard.html)
├── Login (index.html)
│   └── Dashboard (dashboard.html)
│
Main Navigation (All Authenticated Pages)
├── Dashboard (dashboard.html)
├── Accounts (accounts.html)
│   └── Account Detail (account-detail.html)
├── Transfers (transfers.html)
│   └── Beneficiaries (beneficiaries.html)
│   └── Recurring (recurring-payments.html)
├── Cards (cards.html)
├── Loans (loans.html)
├── Investments (investments.html)
├── Deposits (deposits.html)
├── Statements (statements.html)
├── Settings (settings.html)
│   ├── Profile
│   ├── Security
│   ├── Notifications
│   └── Devices
├── Notifications (notifications.html)
└── Support (support.html)
    ├── FAQ
    ├── Guides
    ├── Ticket Support
    └── Live Chat
```

---

## ROUTING LOGIC

### Public Routes (No Authentication)
- `/landing.html` - Landing page
- `/index.html` - Login/Signup
- `/kyc.html` - KYC submission
- `/funding.html` - Initial deposit

### Protected Routes (Authentication Required)
- All dashboard, account, transfer, card, loan, investment, settings pages

### Admin Routes (Admin Role Required)
- `/admin/*` - All admin pages

---

## RESPONSIVE DESIGN

All pages designed for:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

---

## API INTEGRATION POINTS

Each page integrates with backend APIs:

| Page | API Endpoints |
|------|---------------|
| Dashboard | `/api/users/profile`, `/api/accounts`, `/api/transactions` |
| Accounts | `/api/accounts`, `/api/transactions` |
| Transfers | `/api/transactions/*`, `/api/accounts` |
| Cards | `/api/accounts` |
| Loans | `/api/loans/*` |
| KYC | `/api/kyc/*` |
| Settings | `/api/users/*` |
| Funding | `/api/transactions/deposit` |

---

## FUTURE ENHANCEMENTS

Pages ready for expansion:
- [ ] Investment portfolio management
- [ ] Advanced analytics & reporting
- [ ] Budget planner
- [ ] Expense categorization
- [ ] Mobile app companion
- [ ] Open banking integrations
- [ ] Crypto trading platform
- [ ] Wealth advisor marketplace

---

## SECURITY CONSIDERATIONS

All pages implement:
- JWT token validation
- HTTPS/SSL encryption
- CORS protection
- Input validation
- Output encoding
- Session timeout
- CSRF protection

---

**Status:** ✓ Complete Sitemap with 30+ pages
**Last Updated:** August 21, 2026
**Version:** 1.0.0
