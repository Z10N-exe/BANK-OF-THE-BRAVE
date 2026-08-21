const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const Account = require('../models/Account');
const AuditLog = require('../models/AuditLog');
const Transaction = require('../models/Transaction');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Multer configuration for withdrawal screenshots
const withdrawalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/withdrawals');
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    } catch (err) {
      cb(new Error('File uploads not supported in serverless environment'), null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const uploadFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and PDF files are allowed'), false);
  }
};

const withdrawalUpload = multer({
  storage: withdrawalStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: uploadFilter,
});

// Helper to create audit log
async function createAuditLog(userId, action, details) {
  try {
    const log = new AuditLog({
      userId,
      action,
      details,
      timestamp: new Date(),
    });
    await log.save();
  } catch (error) {
    console.log('Audit log error:', error.message);
  }
}

// ============== INITIATE WITHDRAWAL ==============
router.post('/request', authenticateToken, withdrawalUpload.single('screenshot'), [
  body('accountId').isMongoId().withMessage('Valid account ID required'),
  body('amount').isNumeric().custom(v => v > 0).withMessage('Amount must be greater than 0'),
  body('withdrawalMethod').isIn(['cashapp', 'venmo', 'paypal', 'wire_transfer', 'bank_transfer', 'crypto']).withMessage('Valid withdrawal method required'),
  body('referenceId').optional().isString(),
  body('userNotes').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Screenshot is required' });
    }

    const { 
      accountId, 
      amount, 
      withdrawalMethod, 
      referenceId, 
      userNotes, 
      currency,
      destinationInfo 
    } = req.body;

    // Verify user owns account
    const account = await Account.findById(accountId);
    if (!account) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Account not found' });
    }

    if (account.userId.toString() !== req.user.id) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check sufficient balance
    if (account.balance < amount) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Insufficient account balance' });
    }

    // Parse destination info if provided
    let parsedDestination = {};
    if (destinationInfo) {
      try {
        parsedDestination = typeof destinationInfo === 'string' 
          ? JSON.parse(destinationInfo) 
          : destinationInfo;
      } catch (e) {
        parsedDestination = {};
      }
    }

    // Create withdrawal record
    const withdrawal = new Withdrawal({
      userId: req.user.id,
      accountId,
      amount: parseFloat(amount),
      currency: currency || 'USD',
      withdrawalMethod,
      referenceId: referenceId || null,
      screenshotUrl: `/uploads/withdrawals/${req.file.filename}`,
      userNotes,
      destinationInfo: parsedDestination,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'pending',
    });

    // Hold funds temporarily
    account.balance -= amount;
    account.save();

    await withdrawal.save();

    await createAuditLog(req.user.id, 'WITHDRAWAL_REQUESTED', {
      withdrawalId: withdrawal._id,
      amount,
      method: withdrawalMethod,
      accountId,
    });

    res.status(201).json({
      message: 'Withdrawal request submitted. Funds held pending approval.',
      withdrawal: {
        _id: withdrawal._id,
        amount: withdrawal.amount,
        currency: withdrawal.currency,
        withdrawalMethod: withdrawal.withdrawalMethod,
        status: withdrawal.status,
        referenceId: withdrawal.referenceId,
        createdAt: withdrawal.createdAt,
        estimatedTime: '1-2 hours (depends on admin availability)',
      },
      accountBalance: account.balance,
    });
  } catch (error) {
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    }
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== GET USER WITHDRAWALS ==============
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    const filters = { userId: req.user.id };

    if (status) {
      filters.status = status;
    }

    const withdrawals = await Withdrawal.find(filters)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      message: 'Withdrawals retrieved successfully',
      count: withdrawals.length,
      withdrawals,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== GET SINGLE WITHDRAWAL ==============
router.get('/:withdrawalId', authenticateToken, async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.withdrawalId)
      .populate('approvedBy', 'email firstName lastName')
      .populate('rejectedBy', 'email firstName lastName');

    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    if (withdrawal.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      message: 'Withdrawal retrieved successfully',
      withdrawal,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== ADMIN: GET ALL WITHDRAWALS ==============
router.get('/admin/all', authenticateToken, authorizeRoles(['admin', 'compliance']), async (req, res) => {
  try {
    const { status, userId, skip = 0, limit = 50 } = req.query;
    const filters = {};

    if (status) filters.status = status;
    if (userId) filters.userId = userId;

    const withdrawals = await Withdrawal.find(filters)
      .populate('userId', 'email firstName lastName phone')
      .populate('approvedBy', 'email firstName lastName')
      .populate('rejectedBy', 'email firstName lastName')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Withdrawal.countDocuments(filters);

    res.json({
      message: 'All withdrawals retrieved',
      total,
      count: withdrawals.length,
      page: Math.floor(skip / limit) + 1,
      withdrawals,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== ADMIN: APPROVE WITHDRAWAL ==============
router.post('/:withdrawalId/approve', authenticateToken, authorizeRoles(['admin', 'compliance']), [
  body('adminNotes').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { adminNotes } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.withdrawalId);

    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'pending') {
      // Refund held funds if not already processed
      if (withdrawal.status === 'rejected' || withdrawal.status === 'failed') {
        const account = await Account.findById(withdrawal.accountId);
        if (account) {
          account.balance += withdrawal.amount;
          await account.save();
        }
      }
      return res.status(400).json({ error: `Cannot approve withdrawal with status: ${withdrawal.status}` });
    }

    const account = await Account.findById(withdrawal.accountId);

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Update withdrawal
    withdrawal.status = 'approved';
    withdrawal.approvedBy = req.user.id;
    withdrawal.approvedAt = new Date();
    withdrawal.adminNotes = adminNotes || '';
    await withdrawal.save();

    // Funds already held, just mark as completed
    withdrawal.status = 'completed';
    withdrawal.completedAt = new Date();
    await withdrawal.save();

    // Create transaction record
    const transaction = new Transaction({
      fromAccountId: withdrawal.accountId,
      toAccountId: null, // System withdrawal
      amount: withdrawal.amount,
      currency: withdrawal.currency,
      transactionType: 'withdrawal',
      description: `${withdrawal.withdrawalMethod.toUpperCase()} Withdrawal`,
      status: 'completed',
      fee: 0,
      exchangeRate: 1,
      metadata: {
        withdrawalId: withdrawal._id,
        withdrawalMethod: withdrawal.withdrawalMethod,
        referenceId: withdrawal.referenceId,
      },
    });
    await transaction.save();

    await createAuditLog(req.user.id, 'WITHDRAWAL_APPROVED', {
      withdrawalId: withdrawal._id,
      amount: withdrawal.amount,
      userId: withdrawal.userId,
      method: withdrawal.withdrawalMethod,
    });

    res.json({
      message: 'Withdrawal approved and processed successfully.',
      withdrawal,
      accountBalance: account.balance,
    });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== ADMIN: REJECT WITHDRAWAL ==============
router.post('/:withdrawalId/reject', authenticateToken, authorizeRoles(['admin', 'compliance']), [
  body('rejectionReason').isString().notEmpty().withMessage('Rejection reason required'),
  body('adminNotes').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rejectionReason, adminNotes } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.withdrawalId);

    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ error: `Cannot reject withdrawal with status: ${withdrawal.status}` });
    }

    // Refund held funds back to account
    const account = await Account.findById(withdrawal.accountId);
    if (account) {
      account.balance += withdrawal.amount;
      await account.save();
    }

    withdrawal.status = 'rejected';
    withdrawal.rejectedBy = req.user.id;
    withdrawal.rejectedAt = new Date();
    withdrawal.rejectionReason = rejectionReason;
    withdrawal.adminNotes = adminNotes || '';
    withdrawal.refundedAmount = withdrawal.amount;
    withdrawal.refundedAt = new Date();
    await withdrawal.save();

    await createAuditLog(req.user.id, 'WITHDRAWAL_REJECTED', {
      withdrawalId: withdrawal._id,
      amount: withdrawal.amount,
      userId: withdrawal.userId,
      reason: rejectionReason,
    });

    res.json({
      message: 'Withdrawal rejected. Funds refunded to account.',
      withdrawal,
      accountBalance: account?.balance,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== ADMIN: GET WITHDRAWAL SCREENSHOT ==============
router.get('/:withdrawalId/screenshot', authenticateToken, async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.withdrawalId);

    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    // Check authorization
    if (withdrawal.userId.toString() !== req.user.id && !['admin', 'compliance'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const filePath = path.join(__dirname, '../uploads/withdrawals', path.basename(withdrawal.screenshotUrl));

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Screenshot not found' });
    }

    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

module.exports = router;
