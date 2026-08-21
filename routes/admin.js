const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');
const AuditLog = require('../models/AuditLog');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
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

module.exports = router;
