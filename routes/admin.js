const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const Withdrawal = require('../models/Withdrawal');
const { authenticateToken, authorizeRole, authorizeRoles } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all users (Compliance/Super Admin only)
router.get('/users', authenticateToken, authorizeRole('admin', 'compliance'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Get user details
router.get('/users/:userId', authenticateToken, authorizeRole('admin', 'compliance', 'support'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('accounts')
      .select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log access
    await AuditLog.create({
      adminId: req.user.id,
      userId: req.params.userId,
      action: `Viewed user details`,
      actionType: 'data_access',
      resourceId: user._id,
      resourceType: 'user',
      ipAddress: req.ip,
      status: 'success',
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Adjust user balance (Super Admin only)
router.post('/balance-adjustment', authenticateToken, authorizeRole('admin'), [
  body('userId').notEmpty().withMessage('User ID required'),
  body('accountId').notEmpty().withMessage('Account ID required'),
  body('amount').isNumeric().withMessage('Valid amount required'),
  body('type').isIn(['credit', 'debit']).withMessage('Type must be credit or debit'),
  body('notes').optional(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, accountId, amount, type, notes } = req.body;

    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (account.userId.toString() !== userId) {
      return res.status(400).json({ error: 'Account does not belong to this user' });
    }

    const previousBalance = account.balance;

    if (type === 'credit') {
      account.balance += amount;
    } else {
      if (account.balance < amount) {
        return res.status(400).json({ error: 'Insufficient funds for debit' });
      }
      account.balance -= amount;
    }

    await account.save();

    // Log audit
    await AuditLog.create({
      adminId: req.user.id,
      userId: userId,
      action: `Balance ${type === 'credit' ? 'credited' : 'debited'} $${amount}`,
      actionType: 'balance_adjustment',
      resourceId: accountId,
      resourceType: 'account',
      changes: {
        before: { balance: previousBalance },
        after: { balance: account.balance },
      },
      ipAddress: req.ip,
      status: 'success',
      details: notes,
    });

    res.json({
      message: `Balance ${type}ed successfully`,
      account,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Verify/Reject KYC
router.post('/kyc-verification', authenticateToken, authorizeRole('admin', 'compliance'), [
  body('userId').notEmpty().withMessage('User ID required'),
  body('status').isIn(['verified', 'rejected']).withMessage('Status must be verified or rejected'),
  body('notes').optional(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, status, notes } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const previousKycStatus = user.kycStatus;
    user.kycStatus = status;

    if (status === 'verified') {
      user.accountStatus = 'active';
      user.identityVerified = true;
      user.kyc.verificationDate = new Date();
    } else if (status === 'rejected') {
      user.accountStatus = 'pending_kyc';
      user.identityVerified = false;
    }

    await user.save();

    // Log audit
    await AuditLog.create({
      adminId: req.user.id,
      userId: userId,
      action: `KYC ${status}`,
      actionType: 'kyc_verification',
      resourceId: user._id,
      resourceType: 'user',
      changes: {
        before: { kycStatus: previousKycStatus },
        after: { kycStatus: status },
      },
      ipAddress: req.ip,
      status: 'success',
      details: notes,
    });

    res.json({
      message: `KYC ${status} successfully`,
      user: {
        id: user._id,
        email: user.email,
        kycStatus: user.kycStatus,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Suspend/Terminate account
router.post('/account-status', authenticateToken, authorizeRole('admin', 'compliance'), [
  body('userId').notEmpty().withMessage('User ID required'),
  body('status').isIn(['active', 'suspended', 'terminated']).withMessage('Valid status required'),
  body('reason').notEmpty().withMessage('Reason required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, status, reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const previousStatus = user.accountStatus;
    user.accountStatus = status;
    await user.save();

    // Log audit
    await AuditLog.create({
      adminId: req.user.id,
      userId: userId,
      action: `Account status changed to ${status}`,
      actionType: 'account_suspension',
      resourceId: user._id,
      resourceType: 'user',
      changes: {
        before: { status: previousStatus },
        after: { status: status },
      },
      ipAddress: req.ip,
      status: 'success',
      details: reason,
    });

    res.json({
      message: `Account ${status} successfully`,
      user,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Get pending transactions for approval
router.get('/transactions/pending', authenticateToken, authorizeRole('admin', 'compliance'), async (req, res) => {
  try {
    const transactions = await Transaction.find({
      status: 'pending',
      requiresApproval: true,
    })
      .populate('fromAccountId')
      .sort({ createdAt: -1 });

    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Approve/Reject transaction
router.post('/transaction-approval', authenticateToken, authorizeRole('admin', 'compliance'), [
  body('transactionId').notEmpty().withMessage('Transaction ID required'),
  body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
  body('notes').optional(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { transactionId, action, notes } = req.body;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (action === 'approve') {
      // Add approval signature
      transaction.approvals.push({
        adminId: req.user.id,
        timestamp: new Date(),
        notes: notes,
      });

      // Check if requires second approval
      if (transaction.requiresApproval && transaction.approvals.length >= 2) {
        transaction.status = 'approved';
        transaction.approvalStatus = 'approved';
      } else {
        transaction.approvalStatus = 'approved_by_one';
      }
    } else {
      transaction.status = 'rejected';
      transaction.approvalStatus = 'rejected';
    }

    await transaction.save();

    // Log audit
    await AuditLog.create({
      adminId: req.user.id,
      action: `Transaction ${action}`,
      actionType: 'transaction_approval',
      resourceId: transactionId,
      resourceType: 'transaction',
      ipAddress: req.ip,
      status: 'success',
      details: notes,
    });

    res.json({
      message: `Transaction ${action}ed successfully`,
      transaction,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Approve loan
router.post('/loan-approval', authenticateToken, authorizeRole('admin', 'wealth_manager'), [
  body('loanId').notEmpty().withMessage('Loan ID required'),
  body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
  body('notes').optional(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { loanId, action, notes } = req.body;

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    if (action === 'approve') {
      loan.status = 'approved';
      loan.approvedAt = new Date();
    } else {
      loan.status = 'rejected';
    }

    await loan.save();

    // Log audit
    await AuditLog.create({
      adminId: req.user.id,
      userId: loan.userId,
      action: `Loan ${action}`,
      actionType: 'transaction_approval',
      resourceId: loanId,
      resourceType: 'loan',
      ipAddress: req.ip,
      status: 'success',
      details: notes,
    });

    res.json({
      message: `Loan ${action}ed successfully`,
      loan,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Get audit logs
router.get('/audit-logs', authenticateToken, authorizeRole('admin', 'auditor'), async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;

    const logs = await AuditLog.find()
      .populate('adminId', 'firstName lastName email')
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await AuditLog.countDocuments();

    res.json({
      logs,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== DEPOSIT/WITHDRAWAL SETTINGS ==============

// Get current deposit/withdrawal settings
router.get('/deposit-settings', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const DepositSettings = require('../models/DepositSettings');
    let settings = await DepositSettings.findOne();
    
    if (!settings) {
      settings = new DepositSettings();
      await settings.save();
    }

    res.json({
      message: 'Deposit/withdrawal settings retrieved',
      settings,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Update deposit/withdrawal settings
router.post('/deposit-settings', authenticateToken, authorizeRole('admin'), [
  body('depositMethods').optional().isObject(),
  body('withdrawalMethods').optional().isObject(),
  body('autoApproveDepositsUnder').optional().isNumeric(),
  body('requireAdminApprovalOver').optional().isNumeric(),
  body('dailyWithdrawalLimit').optional().isNumeric(),
  body('minimumDepositAmount').optional().isNumeric(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const DepositSettings = require('../models/DepositSettings');
    let settings = await DepositSettings.findOne();
    
    if (!settings) {
      settings = new DepositSettings();
    }

    // Update fields if provided
    if (req.body.depositMethods) {
      Object.assign(settings.depositMethods, req.body.depositMethods);
    }
    if (req.body.withdrawalMethods) {
      Object.assign(settings.withdrawalMethods, req.body.withdrawalMethods);
    }
    if (req.body.autoApproveDepositsUnder !== undefined) {
      settings.autoApproveDepositsUnder = req.body.autoApproveDepositsUnder;
    }
    if (req.body.requireAdminApprovalOver !== undefined) {
      settings.requireAdminApprovalOver = req.body.requireAdminApprovalOver;
    }
    if (req.body.dailyWithdrawalLimit !== undefined) {
      settings.dailyWithdrawalLimit = req.body.dailyWithdrawalLimit;
    }
    if (req.body.minimumDepositAmount !== undefined) {
      settings.minimumDepositAmount = req.body.minimumDepositAmount;
    }
    if (req.body.maximumDepositAmount !== undefined) {
      settings.maximumDepositAmount = req.body.maximumDepositAmount;
    }

    settings.updatedBy = req.user.id;
    settings.updatedAt = new Date();
    await settings.save();

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'Updated deposit/withdrawal settings',
      actionType: 'settings_update',
      details: { changes: req.body },
      ipAddress: req.ip,
      status: 'success',
    });

    res.json({
      message: 'Deposit/withdrawal settings updated successfully',
      settings,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Enable/Disable specific deposit method
router.post('/deposit-method/:method', authenticateToken, authorizeRole('admin'), [
  body('enabled').isBoolean().withMessage('Enabled must be boolean'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const validMethods = ['cashapp', 'venmo', 'paypal', 'wire_transfer', 'bank_transfer', 'crypto'];
    if (!validMethods.includes(req.params.method)) {
      return res.status(400).json({ error: 'Invalid deposit method' });
    }

    const DepositSettings = require('../models/DepositSettings');
    let settings = await DepositSettings.findOne();
    
    if (!settings) {
      settings = new DepositSettings();
    }

    settings.depositMethods[req.params.method].enabled = req.body.enabled;
    settings.updatedBy = req.user.id;
    await settings.save();

    await AuditLog.create({
      userId: req.user.id,
      action: `${req.body.enabled ? 'Enabled' : 'Disabled'} deposit method: ${req.params.method}`,
      actionType: 'settings_update',
      ipAddress: req.ip,
      status: 'success',
    });

    res.json({
      message: `Deposit method ${req.params.method} ${req.body.enabled ? 'enabled' : 'disabled'}`,
      settings,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== ADMIN: DIRECT DEPOSIT TO USER ==============
router.post('/direct-deposit', authenticateToken, authorizeRole('admin'), [
  body('userId').isMongoId().withMessage('Valid user ID required'),
  body('accountId').isMongoId().withMessage('Valid account ID required'),
  body('amount').isNumeric().custom(v => v > 0).withMessage('Amount must be greater than 0'),
  body('fromName').isString().notEmpty().withMessage('Source name required'),
  body('adminNotes').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, accountId, amount, fromName, adminNotes } = req.body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify account exists and belongs to user
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (account.userId.toString() !== userId) {
      return res.status(400).json({ error: 'Account does not belong to this user' });
    }

    const depositAmount = parseFloat(amount);
    const previousBalance = account.balance;

    // Credit account
    account.balance += depositAmount;
    await account.save();

    // Create transaction record
    const transaction = new Transaction({
      fromAccountId: null, // Admin initiated
      toAccountId: accountId,
      amount: depositAmount,
      currency: 'USD',
      transactionType: 'admin_deposit',
      description: `Direct deposit from ${fromName}`,
      status: 'completed',
      fee: 0,
      exchangeRate: 1,
      metadata: {
        source: fromName,
        adminId: req.user.id,
        adminNotes: adminNotes,
      },
    });
    await transaction.save();

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      action: `Admin direct deposit of $${depositAmount} to user account from ${fromName}`,
      actionType: 'admin_deposit',
      resourceId: accountId,
      resourceType: 'account',
      changes: {
        before: { balance: previousBalance },
        after: { balance: account.balance },
      },
      ipAddress: req.ip,
      status: 'success',
      details: {
        userId,
        amount: depositAmount,
        source: fromName,
        adminNotes,
      },
    });

    // Send notification to user
    await Notification.create({
      userId,
      type: 'success',
      title: 'Balance Added',
      message: `$${depositAmount} has been added to your account from ${fromName}. ${adminNotes ? 'Note: ' + adminNotes : ''}`,
      priority: 'high',
      actionUrl: '/accounts',
      actionLabel: 'View Accounts',
      createdBy: req.user.id,
    });

    res.json({
      message: `Direct deposit of $${depositAmount} from ${fromName} completed successfully`,
      transaction: {
        _id: transaction._id,
        amount: depositAmount,
        source: fromName,
        createdAt: transaction.createdAt,
      },
      account: {
        _id: account._id,
        balance: account.balance,
        previousBalance: previousBalance,
      },
    });
  } catch (error) {
    console.error('Direct deposit error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== ADMIN: CREATE CREDIT ACCOUNT ==============
router.post('/create-credit-account', authenticateToken, authorizeRole('admin'), [
  body('userId').isMongoId().withMessage('Valid user ID required'),
  body('creditLimit').isNumeric().custom(v => v > 0).withMessage('Credit limit must be greater than 0'),
  body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'BTC']).withMessage('Valid currency required'),
  body('notes').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, creditLimit, currency, notes } = req.body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create credit account
    const creditAccount = new Account({
      userId,
      accountType: 'credit',
      currency: currency || 'USD',
      balance: 0,
      creditLimit: parseFloat(creditLimit),
      accountStatus: 'active',
      cardIssued: false,
      cardType: 'none',
      cardStatus: 'active',
      dailySpendLimit: 5000,
      atmLimit: 1000,
      onlinePaymentsEnabled: true,
    });

    await creditAccount.save();

    // Add to user's accounts
    user.accounts.push(creditAccount._id);
    await user.save();

    // Audit log
    await AuditLog.create({
      adminId: req.user.id,
      userId: userId,
      action: `Created credit account with limit $${creditLimit}`,
      actionType: 'account_creation',
      resourceId: creditAccount._id,
      resourceType: 'account',
      ipAddress: req.ip,
      status: 'success',
      details: notes,
    });

    // Send notification to user
    await Notification.create({
      userId,
      type: 'success',
      title: 'Credit Account Created',
      message: `Your credit account has been created with a limit of $${creditLimit}. You can now access credit facilities.`,
      priority: 'high',
      actionUrl: '/accounts',
      actionLabel: 'View Accounts',
      createdBy: req.user.id,
    });

    res.json({
      message: 'Credit account created successfully',
      account: creditAccount,
    });
  } catch (error) {
    console.error('Create credit account error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== ADMIN: UPGRADE USER TO PREMIUM ==============
router.post('/upgrade-premium', authenticateToken, authorizeRole('admin'), [
  body('userId').isMongoId().withMessage('Valid user ID required'),
  body('isPremium').isBoolean().withMessage('Premium status must be boolean'),
  body('notes').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, isPremium, notes } = req.body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const previousStatus = user.isPremium;
    user.isPremium = isPremium;
    
    if (isPremium && !user.premiumSince) {
      user.premiumSince = new Date();
    } else if (!isPremium) {
      user.premiumSince = null;
    }

    await user.save();

    // Audit log
    await AuditLog.create({
      adminId: req.user.id,
      userId: userId,
      action: `User premium status changed to ${isPremium}`,
      actionType: 'user_upgrade',
      resourceId: user._id,
      resourceType: 'user',
      changes: {
        before: { isPremium: previousStatus },
        after: { isPremium: user.isPremium },
      },
      ipAddress: req.ip,
      status: 'success',
      details: notes,
    });

    // Send notification to user
    await Notification.create({
      userId,
      type: isPremium ? 'success' : 'info',
      title: isPremium ? 'Premium Upgrade Activated' : 'Premium Status Removed',
      message: isPremium 
        ? 'Congratulations! Your account has been upgraded to Premium status. Enjoy exclusive benefits and features.'
        : 'Your Premium status has been removed. Standard features and limits now apply.',
      priority: 'high',
      actionUrl: '/settings',
      actionLabel: 'View Benefits',
      createdBy: req.user.id,
    });

    res.json({
      message: `User premium status ${isPremium ? 'upgraded' : 'downgraded'} successfully`,
      user: {
        id: user._id,
        email: user.email,
        isPremium: user.isPremium,
        premiumSince: user.premiumSince,
      },
    });
  } catch (error) {
    console.error('Premium upgrade error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== ADMIN: MANAGE USER PAYMENT METHODS ==============
router.post('/manage-payment-methods', authenticateToken, authorizeRole('admin'), [
  body('userId').isMongoId().withMessage('Valid user ID required'),
  body('accountId').isMongoId().withMessage('Valid account ID required'),
  body('cashApp').optional().isBoolean(),
  body('venmo').optional().isBoolean(),
  body('bankTransfer').optional().isBoolean(),
  body('notes').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, accountId, cashApp, venmo, bankTransfer, notes } = req.body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify account exists and belongs to user
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (account.userId.toString() !== userId) {
      return res.status(400).json({ error: 'Account does not belong to this user' });
    }

    const previousMethods = account.depositMethods || {};

    // Update payment methods
    if (cashApp !== undefined) account.depositMethods.cashApp = cashApp;
    if (venmo !== undefined) account.depositMethods.venmo = venmo;
    if (bankTransfer !== undefined) account.depositMethods.bankTransfer = bankTransfer;

    await account.save();

    // Audit log
    await AuditLog.create({
      adminId: req.user.id,
      userId: userId,
      action: 'Updated payment methods',
      actionType: 'payment_method_update',
      resourceId: accountId,
      resourceType: 'account',
      changes: {
        before: { depositMethods: previousMethods },
        after: { depositMethods: account.depositMethods },
      },
      ipAddress: req.ip,
      status: 'success',
      details: notes,
    });

    // Send notification to user
    const enabledMethods = [];
    if (account.depositMethods.cashApp) enabledMethods.push('CashApp');
    if (account.depositMethods.venmo) enabledMethods.push('Venmo');
    if (account.depositMethods.bankTransfer) enabledMethods.push('Bank Transfer');

    await Notification.create({
      userId,
      type: 'info',
      title: 'Payment Methods Updated',
      message: `Your payment methods have been updated. Available methods: ${enabledMethods.join(', ') || 'None'}`,
      priority: 'medium',
      actionUrl: '/funding',
      actionLabel: 'Manage Funding',
      createdBy: req.user.id,
    });

    res.json({
      message: 'Payment methods updated successfully',
      account: {
        id: account._id,
        depositMethods: account.depositMethods,
      },
    });
  } catch (error) {
    console.error('Payment methods error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== ADMIN: SEND NOTIFICATION TO USER ==============
router.post('/send-notification', authenticateToken, authorizeRole('admin'), [
  body('userId').isMongoId().withMessage('Valid user ID required'),
  body('type').isIn(['info', 'success', 'warning', 'error', 'system', 'account', 'transaction', 'kyc', 'security']).withMessage('Valid notification type required'),
  body('title').isString().notEmpty().withMessage('Title required'),
  body('message').isString().notEmpty().withMessage('Message required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Valid priority required'),
  body('actionUrl').optional().isString(),
  body('actionLabel').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, type, title, message, priority, actionUrl, actionLabel } = req.body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create notification
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      priority: priority || 'medium',
      actionUrl,
      actionLabel,
      createdBy: req.user.id,
    });

    await notification.save();

    // Audit log
    await AuditLog.create({
      adminId: req.user.id,
      userId: userId,
      action: `Sent notification: ${title}`,
      actionType: 'notification_sent',
      resourceId: notification._id,
      resourceType: 'notification',
      ipAddress: req.ip,
      status: 'success',
      details: { type, title, message },
    });

    res.json({
      message: 'Notification sent successfully',
      notification,
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== ADMIN: GET ALL ACCOUNTS WITH BALANCES ==============
router.get('/accounts/all', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { status, accountType, limit = 100, skip = 0 } = req.query;

    const filters = {};
    if (status) filters.accountStatus = status;
    if (accountType) filters.accountType = accountType;

    const accounts = await Account.find(filters)
      .populate('userId', 'email firstName lastName role accountStatus')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Account.countDocuments(filters);

    res.json({
      total,
      accounts,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== ADMIN: FREEZE ACCOUNT ==============
router.post('/freeze-account', authenticateToken, authorizeRole('admin'), [
  body('userId').isMongoId().withMessage('Valid user ID required'),
  body('accountId').optional().isMongoId().withMessage('Valid account ID required'),
  body('freeze').isBoolean().withMessage('Freeze status must be boolean'),
  body('reason').isString().notEmpty().withMessage('Reason required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, accountId, freeze, reason } = req.body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const previousUserStatus = user.accountStatus;
    
    // Freeze/unfreeze user account
    if (freeze) {
      user.accountStatus = 'frozen';
    } else {
      if (user.accountStatus === 'frozen') {
        user.accountStatus = 'active';
      }
    }
    await user.save();

    // If specific account provided, freeze/unfreeze it too
    let account = null;
    if (accountId) {
      account = await Account.findById(accountId);
      if (account && account.userId.toString() === userId) {
        const previousAccountStatus = account.accountStatus;
        account.accountStatus = freeze ? 'frozen' : 'active';
        await account.save();

        // Audit log for account
        await AuditLog.create({
          adminId: req.user.id,
          userId: userId,
          action: `Account ${freeze ? 'frozen' : 'unfrozen'}`,
          actionType: 'account_freeze',
          resourceId: accountId,
          resourceType: 'account',
          changes: {
            before: { accountStatus: previousAccountStatus },
            after: { accountStatus: account.accountStatus },
          },
          ipAddress: req.ip,
          status: 'success',
          details: reason,
        });
      }
    }

    // Audit log for user
    await AuditLog.create({
      adminId: req.user.id,
      userId: userId,
      action: `User account ${freeze ? 'frozen' : 'unfrozen'}`,
      actionType: 'account_freeze',
      resourceId: user._id,
      resourceType: 'user',
      changes: {
        before: { accountStatus: previousUserStatus },
        after: { accountStatus: user.accountStatus },
      },
      ipAddress: req.ip,
      status: 'success',
      details: reason,
    });

    // Send notification to user
    await Notification.create({
      userId,
      type: freeze ? 'error' : 'success',
      title: freeze ? 'Account Frozen' : 'Account Unfrozen',
      message: freeze 
        ? `Your account has been frozen. Reason: ${reason}. Please contact support for assistance.`
        : 'Your account has been unfrozen. You can now access all services.',
      priority: 'urgent',
      actionUrl: '/dashboard',
      actionLabel: 'View Dashboard',
      createdBy: req.user.id,
    });

    res.json({
      message: `User account ${freeze ? 'frozen' : 'unfrozen'} successfully`,
      user: {
        id: user._id,
        email: user.email,
        accountStatus: user.accountStatus,
      },
      account: account ? {
        id: account._id,
        accountStatus: account.accountStatus,
      } : null,
    });
  } catch (error) {
    console.error('Freeze account error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== ADMIN: APPROVE WITHDRAWAL ==============
router.post('/approve-withdrawal', authenticateToken, authorizeRole('admin'), [
  body('withdrawalId').isMongoId().withMessage('Valid withdrawal ID required'),
  body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
  body('adminNotes').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { withdrawalId, action, adminNotes } = req.body;

    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ error: 'Withdrawal already processed' });
    }

    const account = await Account.findById(withdrawal.accountId);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (action === 'approve') {
      withdrawal.status = 'completed';
      withdrawal.approvedBy = req.user.id;
      withdrawal.approvedAt = new Date();
      withdrawal.completedAt = new Date();
      if (adminNotes) withdrawal.adminNotes = adminNotes;

      // Create transaction record
      await Transaction.create({
        fromAccountId: withdrawal.accountId,
        toAccountId: null,
        amount: withdrawal.amount,
        currency: withdrawal.currency,
        transactionType: 'withdrawal',
        description: `${withdrawal.withdrawalMethod.toUpperCase()} Withdrawal`,
        status: 'completed',
        fee: 0,
        exchangeRate: 1,
      });

      // Send notification to user
      await Notification.create({
        userId: withdrawal.userId,
        type: 'success',
        title: 'Withdrawal Approved',
        message: `Your withdrawal of $${withdrawal.amount} via ${withdrawal.withdrawalMethod} has been approved and processed.`,
        priority: 'high',
        actionUrl: '/transactions',
        actionLabel: 'View Transactions',
        createdBy: req.user.id,
      });
    } else {
      // Reject - refund to account
      withdrawal.status = 'rejected';
      withdrawal.rejectedBy = req.user.id;
      withdrawal.rejectedAt = new Date();
      withdrawal.rejectionReason = adminNotes || 'Rejected by admin';
      withdrawal.refundedAmount = withdrawal.amount;
      withdrawal.refundedAt = new Date();

      // Refund to account
      account.balance += withdrawal.amount;
      await account.save();

      // Send notification to user
      await Notification.create({
        userId: withdrawal.userId,
        type: 'error',
        title: 'Withdrawal Rejected',
        message: `Your withdrawal of $${withdrawal.amount} has been rejected. Reason: ${withdrawal.rejectionReason}. Funds have been refunded to your account.`,
        priority: 'high',
        actionUrl: '/transactions',
        actionLabel: 'View Transactions',
        createdBy: req.user.id,
      });
    }

    await withdrawal.save();

    // Audit log
    await AuditLog.create({
      adminId: req.user.id,
      userId: withdrawal.userId,
      action: `Withdrawal ${action}ed`,
      actionType: 'withdrawal_approval',
      resourceId: withdrawalId,
      resourceType: 'withdrawal',
      ipAddress: req.ip,
      status: 'success',
      details: adminNotes,
    });

    res.json({
      message: `Withdrawal ${action}ed successfully`,
      withdrawal,
      accountBalance: account.balance,
    });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== ADMIN: UPDATE DEPOSIT SETTINGS (INSTRUCTIONS) ==============
router.put('/deposit-settings', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const DepositSettings = require('../models/DepositSettings');
    let settings = await DepositSettings.findOne();
    if (!settings) {
      settings = new DepositSettings();
    }
    
    const { depositMethods } = req.body;
    if (depositMethods) {
      settings.depositMethods = depositMethods;
    }
    
    settings.updatedBy = req.user.id;
    settings.updatedAt = new Date();
    await settings.save();
    
    res.json({ message: 'Deposit settings updated successfully', settings });
  } catch (error) {
    console.error('Update deposit settings error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

module.exports = router;
