const express = require('express');
const router = express.Router();
const Withdrawal = require('../models/Withdrawal');
const Account = require('../models/Account');
const AuditLog = require('../models/AuditLog');
const Transaction = require('../models/Transaction');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

async function createAuditLog(userId, action, details) {
  try { await AuditLog.create({ userId, action, details, timestamp: new Date() }); } catch (e) {}
}

// REQUEST WITHDRAWAL
router.post('/request', authenticateToken, [
  body('accountId').isMongoId().withMessage('Valid account ID required'),
  body('amount').isNumeric().custom(v => v > 0).withMessage('Amount must be greater than 0'),
  body('withdrawalMethod').isIn(['cashapp','venmo','paypal','wire_transfer','bank_transfer','crypto','zelle']).withMessage('Valid withdrawal method required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { accountId, amount, withdrawalMethod, referenceId, destinationInfo, currency } = req.body;
    const account = await Account.findById(accountId);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    if (account.userId.toString() !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    if (account.balance < parseFloat(amount)) return res.status(400).json({ error: 'Insufficient account balance' });

    let parsedDestination = {};
    if (destinationInfo) {
      try { parsedDestination = typeof destinationInfo === 'string' ? JSON.parse(destinationInfo) : destinationInfo; } catch (e) {}
    }

    const withdrawal = new Withdrawal({
      userId: req.user.id, accountId,
      amount: parseFloat(amount),
      currency: currency || 'USD',
      withdrawalMethod, referenceId: referenceId || null,
      screenshotUrl: null,
      destinationInfo: parsedDestination,
      ipAddress: req.ip, status: 'pending',
    });

    // Hold funds
    account.balance -= parseFloat(amount);
    await account.save();
    await withdrawal.save();
    await createAuditLog(req.user.id, 'WITHDRAWAL_REQUESTED', { withdrawalId: withdrawal._id, amount, method: withdrawalMethod });
    res.status(201).json({ message: 'Withdrawal request submitted. Funds held pending approval.', withdrawal, accountBalance: account.balance });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// GET USER WITHDRAWALS
router.get('/', authenticateToken, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    res.json({ withdrawals });
  } catch (error) { res.status(500).json({ error: 'Server error: ' + error.message }); }
});

// ADMIN: GET ALL WITHDRAWALS
router.get('/admin/all', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { status } = req.query;
    const filters = {};
    if (status) filters.status = status;
    const withdrawals = await Withdrawal.find(filters).populate('userId','email firstName lastName').sort({ createdAt: -1 }).limit(100);
    const total = await Withdrawal.countDocuments(filters);
    res.json({ total, withdrawals });
  } catch (error) { res.status(500).json({ error: 'Server error: ' + error.message }); }
});

// ADMIN: APPROVE WITHDRAWAL
router.post('/:withdrawalId/approve', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.withdrawalId);
    if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found' });
    if (withdrawal.status !== 'pending') return res.status(400).json({ error: 'Withdrawal already processed' });

    withdrawal.status = 'completed'; withdrawal.approvedBy = req.user.id; withdrawal.approvedAt = new Date(); withdrawal.completedAt = new Date();
    if (req.body.adminNotes) withdrawal.adminNotes = req.body.adminNotes;
    await withdrawal.save();

    const account = await Account.findById(withdrawal.accountId);

    await Transaction.create({
      fromAccountId: withdrawal.accountId, toAccountId: null,
      amount: withdrawal.amount, currency: withdrawal.currency,
      transactionType: 'withdrawal', description: withdrawal.withdrawalMethod.toUpperCase() + ' Withdrawal',
      status: 'completed', fee: 0, exchangeRate: 1,
    });

    await createAuditLog(req.user.id, 'WITHDRAWAL_APPROVED', { withdrawalId: withdrawal._id, amount: withdrawal.amount });
    res.json({ message: 'Withdrawal approved and processed.', withdrawal, accountBalance: account?.balance });
  } catch (error) { res.status(500).json({ error: 'Server error: ' + error.message }); }
});

// ADMIN: REJECT WITHDRAWAL
router.post('/:withdrawalId/reject', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.withdrawalId);
    if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found' });
    if (withdrawal.status !== 'pending') return res.status(400).json({ error: 'Withdrawal already processed' });

    // Refund to account
    const account = await Account.findById(withdrawal.accountId);
    if (account) { account.balance += withdrawal.amount; await account.save(); }

    withdrawal.status = 'rejected'; withdrawal.rejectedBy = req.user.id; withdrawal.rejectedAt = new Date();
    withdrawal.rejectionReason = req.body.rejectionReason || 'Rejected by admin';
    withdrawal.refundedAmount = withdrawal.amount; withdrawal.refundedAt = new Date();
    await withdrawal.save();

    await createAuditLog(req.user.id, 'WITHDRAWAL_REJECTED', { withdrawalId: withdrawal._id, reason: withdrawal.rejectionReason });
    res.json({ message: 'Withdrawal rejected. Funds refunded.', withdrawal, accountBalance: account?.balance });
  } catch (error) { res.status(500).json({ error: 'Server error: ' + error.message }); }
});

module.exports = router;
