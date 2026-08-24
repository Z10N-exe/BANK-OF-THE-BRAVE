const express = require('express');
const router = express.Router();
const multer = require('multer');
const Deposit = require('../models/Deposit');
const Account = require('../models/Account');
const AuditLog = require('../models/AuditLog');
const Transaction = require('../models/Transaction');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Use memory storage — base64 saved directly into MongoDB (works on Render/serverless)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, or PDF screenshots are allowed'), false);
    }
  },
});

async function createAuditLog(userId, action, details) {
  try { await AuditLog.create({ userId, action, details, timestamp: new Date() }); } catch (e) {}
}

// ============== INITIATE DEPOSIT (screenshot required) ==============
router.post('/initiate', authenticateToken, upload.single('screenshot'), [
  body('accountId').isMongoId().withMessage('Valid account ID required'),
  body('amount').isNumeric().custom(v => v > 0).withMessage('Amount must be greater than 0'),
  body('depositMethod').isIn(['cashapp', 'venmo', 'paypal', 'wire_transfer', 'bank_transfer', 'crypto', 'zelle']).withMessage('Valid deposit method required'),
  body('referenceId').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // Screenshot is mandatory
    if (!req.file) {
      return res.status(400).json({ error: 'Payment screenshot is required for deposits' });
    }

    const { accountId, amount, depositMethod, referenceId, currency, userNotes } = req.body;

    const account = await Account.findById(accountId);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    if (account.userId.toString() !== req.user.id) return res.status(403).json({ error: 'Access denied' });

    // Convert file buffer to base64 for MongoDB storage
    const screenshotBase64 = req.file.buffer.toString('base64');

    const deposit = new Deposit({
      userId: req.user.id,
      accountId,
      amount: parseFloat(amount),
      currency: currency || 'USD',
      depositMethod,
      referenceId: referenceId || null,
      screenshotData: screenshotBase64,
      screenshotMimeType: req.file.mimetype,
      userNotes: userNotes || null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'pending',
    });

    await deposit.save();

    await createAuditLog(req.user.id, 'DEPOSIT_INITIATED', {
      depositId: deposit._id, amount, method: depositMethod, accountId,
    });

    // Return deposit without the large base64 data blob
    const depositResponse = deposit.toObject();
    delete depositResponse.screenshotData;
    depositResponse.hasScreenshot = true;

    res.status(201).json({
      message: 'Deposit initiated successfully. Awaiting admin approval.',
      deposit: depositResponse,
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== GET USER DEPOSITS ==============
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Exclude screenshotData from list (large field) — use projection
    const deposits = await Deposit.find({ userId: req.user.id })
      .select('-screenshotData')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ deposits });
  } catch (error) { res.status(500).json({ error: 'Server error: ' + error.message }); }
});

// ============== GET SCREENSHOT (for admin panel) ==============
router.get('/:depositId/screenshot', authenticateToken, async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.depositId).select('screenshotData screenshotMimeType userId');
    if (!deposit) return res.status(404).json({ error: 'Deposit not found' });

    // Allow owner or admin
    if (deposit.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!deposit.screenshotData) {
      return res.status(404).json({ error: 'No screenshot available' });
    }

    const imgBuffer = Buffer.from(deposit.screenshotData, 'base64');
    res.set('Content-Type', deposit.screenshotMimeType || 'image/jpeg');
    res.set('Content-Disposition', 'inline');
    res.send(imgBuffer);
  } catch (error) { res.status(500).json({ error: 'Server error: ' + error.message }); }
});

// ============== ADMIN: GET ALL DEPOSITS ==============
router.get('/admin/all', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { status } = req.query;
    const filters = {};
    if (status) filters.status = status;
    const deposits = await Deposit.find(filters)
      .select('-screenshotData') // exclude large field from list
      .populate('userId', 'email firstName lastName')
      .sort({ createdAt: -1 })
      .limit(100);
    const total = await Deposit.countDocuments(filters);
    res.json({ total, deposits });
  } catch (error) { res.status(500).json({ error: 'Server error: ' + error.message }); }
});

// ============== ADMIN: APPROVE DEPOSIT ==============
router.post('/:depositId/approve', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.depositId);
    if (!deposit) return res.status(404).json({ error: 'Deposit not found' });
    if (deposit.status !== 'pending') return res.status(400).json({ error: 'Deposit already processed' });

    const account = await Account.findById(deposit.accountId);
    if (!account) return res.status(404).json({ error: 'Account not found' });

    deposit.status = 'approved';
    deposit.approvedBy = req.user.id;
    deposit.approvedAt = new Date();
    if (req.body.adminNotes) deposit.adminNotes = req.body.adminNotes;
    await deposit.save();

    account.balance += deposit.amount;
    await account.save();

    await Transaction.create({
      fromAccountId: null,
      toAccountId: deposit.accountId,
      amount: deposit.amount,
      currency: deposit.currency,
      transactionType: 'deposit',
      description: deposit.depositMethod.replace('_', ' ').toUpperCase() + ' Deposit',
      status: 'completed',
      fee: 0,
      exchangeRate: 1,
    });

    await createAuditLog(req.user.id, 'DEPOSIT_APPROVED', { depositId: deposit._id, amount: deposit.amount });

    const depositResponse = deposit.toObject();
    delete depositResponse.screenshotData;

    res.json({ message: 'Deposit approved. Account credited.', deposit: depositResponse, accountBalance: account.balance });
  } catch (error) { res.status(500).json({ error: 'Server error: ' + error.message }); }
});

// ============== ADMIN: REJECT DEPOSIT ==============
router.post('/:depositId/reject', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.depositId);
    if (!deposit) return res.status(404).json({ error: 'Deposit not found' });
    if (deposit.status !== 'pending') return res.status(400).json({ error: 'Deposit already processed' });

    deposit.status = 'rejected';
    deposit.rejectedBy = req.user.id;
    deposit.rejectedAt = new Date();
    deposit.rejectionReason = req.body.rejectionReason || 'Rejected by admin';
    if (req.body.adminNotes) deposit.adminNotes = req.body.adminNotes;
    await deposit.save();

    await createAuditLog(req.user.id, 'DEPOSIT_REJECTED', { depositId: deposit._id, reason: deposit.rejectionReason });

    const depositResponse = deposit.toObject();
    delete depositResponse.screenshotData;

    res.json({ message: 'Deposit rejected.', deposit: depositResponse });
  } catch (error) { res.status(500).json({ error: 'Server error: ' + error.message }); }
});

// ============== GET DEPOSIT SETTINGS ==============
router.get('/settings', async (req, res) => {
  try {
    const DepositSettings = require('../models/DepositSettings');
    let settings = await DepositSettings.findOne();
    if (!settings) settings = new DepositSettings();
    res.json({ depositMethods: settings.depositMethods });
  } catch (error) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
