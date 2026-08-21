const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Deposit = require('../models/Deposit');
const User = require('../models/User');
const Account = require('../models/Account');
const AuditLog = require('../models/AuditLog');
const Transaction = require('../models/Transaction');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Multer configuration for deposit screenshots
const depositStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // In serverless environments, use memory storage
    if (process.env.VERCEL === '1') {
      cb(new Error('File uploads not supported in serverless environment'), null);
      return;
    }
    const dir = path.join(__dirname, '../uploads/deposits');
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

const depositUpload = multer({
  storage: depositStorage,
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

// ============== INITIATE DEPOSIT ==============
router.post('/initiate', authenticateToken, depositUpload.single('screenshot'), [
  body('accountId').isMongoId().withMessage('Valid account ID required'),
  body('amount').isNumeric().custom(v => v > 0).withMessage('Amount must be greater than 0'),
  body('depositMethod').isIn(['cashapp', 'venmo', 'paypal', 'wire_transfer', 'bank_transfer', 'crypto']).withMessage('Valid deposit method required'),
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

    const { accountId, amount, depositMethod, referenceId, userNotes, currency } = req.body;

    // Verify user owns account
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (account.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check minimum deposit
    if (amount < 500) {
      fs.unlinkSync(req.file.path); // Delete uploaded file
      return res.status(400).json({ error: 'Minimum deposit is $500' });
    }

    // Create deposit record
    const deposit = new Deposit({
      userId: req.user.id,
      accountId,
      amount: parseFloat(amount),
      currency: currency || 'USD',
      depositMethod,
      referenceId: referenceId || null,
      screenshotUrl: `/uploads/deposits/${req.file.filename}`,
      userNotes,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'pending',
    });

    await deposit.save();

    await createAuditLog(req.user.id, 'DEPOSIT_INITIATED', {
      depositId: deposit._id,
      amount,
      method: depositMethod,
      accountId,
    });

    res.status(201).json({
      message: 'Deposit initiated successfully. Awaiting admin approval.',
      deposit: {
        _id: deposit._id,
        amount: deposit.amount,
        currency: deposit.currency,
        depositMethod: deposit.depositMethod,
        status: deposit.status,
        referenceId: deposit.referenceId,
        createdAt: deposit.createdAt,
        estimatedTime: '1-2 hours (depends on admin availability)',
      },
    });
  } catch (error) {
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    }
    console.error('Deposit error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== GET USER DEPOSITS ==============
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    const filters = { userId: req.user.id };

    if (status) {
      filters.status = status;
    }

    const deposits = await Deposit.find(filters)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      message: 'Deposits retrieved successfully',
      count: deposits.length,
      deposits,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== GET SINGLE DEPOSIT ==============
router.get('/:depositId', authenticateToken, async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.depositId)
      .populate('approvedBy', 'email firstName lastName')
      .populate('rejectedBy', 'email firstName lastName');

    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    if (deposit.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      message: 'Deposit retrieved successfully',
      deposit,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== ADMIN: GET ALL DEPOSITS ==============
router.get('/admin/all', authenticateToken, authorizeRoles(['admin', 'compliance']), async (req, res) => {
  try {
    const { status, userId, skip = 0, limit = 50 } = req.query;
    const filters = {};

    if (status) filters.status = status;
    if (userId) filters.userId = userId;

    const deposits = await Deposit.find(filters)
      .populate('userId', 'email firstName lastName phone')
      .populate('approvedBy', 'email firstName lastName')
      .populate('rejectedBy', 'email firstName lastName')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Deposit.countDocuments(filters);

    res.json({
      message: 'All deposits retrieved',
      total,
      count: deposits.length,
      page: Math.floor(skip / limit) + 1,
      deposits,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== ADMIN: APPROVE DEPOSIT ==============
router.post('/:depositId/approve', authenticateToken, authorizeRoles(['admin', 'compliance']), [
  body('adminNotes').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { adminNotes } = req.body;
    const deposit = await Deposit.findById(req.params.depositId);

    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    if (deposit.status !== 'pending') {
      return res.status(400).json({ error: `Cannot approve deposit with status: ${deposit.status}` });
    }

    // Get user and account
    const user = await User.findById(deposit.userId);
    const account = await Account.findById(deposit.accountId);

    if (!user || !account) {
      return res.status(404).json({ error: 'User or account not found' });
    }

    // Update deposit
    deposit.status = 'approved';
    deposit.approvedBy = req.user.id;
    deposit.approvedAt = new Date();
    deposit.adminNotes = adminNotes || '';
    await deposit.save();

    // Credit account
    account.balance += deposit.amount;
    await account.save();

    // Create transaction record
    const transaction = new Transaction({
      fromAccountId: null, // System deposit
      toAccountId: deposit.accountId,
      amount: deposit.amount,
      currency: deposit.currency,
      transactionType: 'deposit',
      description: `${deposit.depositMethod.toUpperCase()} Deposit`,
      status: 'completed',
      fee: 0,
      exchangeRate: 1,
      metadata: {
        depositId: deposit._id,
        depositMethod: deposit.depositMethod,
        referenceId: deposit.referenceId,
      },
    });
    await transaction.save();

    // Audit log
    await createAuditLog(req.user.id, 'DEPOSIT_APPROVED', {
      depositId: deposit._id,
      amount: deposit.amount,
      userId: deposit.userId,
      method: deposit.depositMethod,
    });

    res.json({
      message: 'Deposit approved successfully. Account credited.',
      deposit,
      accountBalance: account.balance,
    });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== ADMIN: REJECT DEPOSIT ==============
router.post('/:depositId/reject', authenticateToken, authorizeRoles(['admin', 'compliance']), [
  body('rejectionReason').isString().notEmpty().withMessage('Rejection reason required'),
  body('adminNotes').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rejectionReason, adminNotes } = req.body;
    const deposit = await Deposit.findById(req.params.depositId);

    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    if (deposit.status !== 'pending') {
      return res.status(400).json({ error: `Cannot reject deposit with status: ${deposit.status}` });
    }

    deposit.status = 'rejected';
    deposit.rejectedBy = req.user.id;
    deposit.rejectedAt = new Date();
    deposit.rejectionReason = rejectionReason;
    deposit.adminNotes = adminNotes || '';
    await deposit.save();

    await createAuditLog(req.user.id, 'DEPOSIT_REJECTED', {
      depositId: deposit._id,
      amount: deposit.amount,
      userId: deposit.userId,
      reason: rejectionReason,
    });

    res.json({
      message: 'Deposit rejected successfully.',
      deposit,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== ADMIN: GET DEPOSIT SCREENSHOT ==============
router.get('/:depositId/screenshot', authenticateToken, async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.depositId);

    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    // Check authorization
    if (deposit.userId.toString() !== req.user.id && !['admin', 'compliance'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Skip file serving in serverless environments
    if (process.env.VERCEL === '1') {
      return res.status(503).json({ error: 'File downloads not available in serverless environment' });
    }

    const filePath = path.join(__dirname, '../uploads/deposits', path.basename(deposit.screenshotUrl));

    try {
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Screenshot not found' });
      }
      res.sendFile(filePath);
    } catch (err) {
      return res.status(500).json({ error: 'Error serving file' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

module.exports = router;
