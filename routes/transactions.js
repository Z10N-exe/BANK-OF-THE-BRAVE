const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get user transactions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('accounts');
    const accountIds = user.accounts.map(acc => acc._id);

    const transactions = await Transaction.find({
      $or: [
        { fromAccountId: { $in: accountIds } },
        { toAccountId: { $in: accountIds } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Internal transfer
router.post('/internal-transfer', authenticateToken, [
  body('fromAccountId').notEmpty().withMessage('From account required'),
  body('toAccountId').notEmpty().withMessage('To account required'),
  body('amount').isNumeric().withMessage('Valid amount required'),
  body('description').optional(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fromAccountId, toAccountId, amount, description } = req.body;

    // Verify accounts exist and user owns fromAccount
    const fromAccount = await Account.findById(fromAccountId);
    const toAccount = await Account.findById(toAccountId);

    if (!fromAccount || !toAccount) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (fromAccount.userId.toString() !== req.user.id && fromAccount.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (fromAccount.balance < amount) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    // Deduct from source
    fromAccount.balance -= amount;
    await fromAccount.save();

    // Add to destination
    toAccount.balance += amount;
    await toAccount.save();

    // Create transaction record
    const transaction = new Transaction({
      fromAccountId,
      toAccountId,
      amount,
      type: 'internal_transfer',
      status: 'completed',
      currency: fromAccount.currency,
      description: description || 'Internal transfer',
      ipAddress: req.ip,
    });

    await transaction.save();

    res.status(201).json({
      message: 'Transfer completed successfully',
      transaction,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Wire transfer (external)
router.post('/wire-transfer', authenticateToken, [
  body('fromAccountId').notEmpty().withMessage('From account required'),
  body('amount').isNumeric().withMessage('Valid amount required'),
  body('beneficiary').notEmpty().withMessage('Beneficiary info required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fromAccountId, amount, beneficiary } = req.body;

    const fromAccount = await Account.findById(fromAccountId);
    if (!fromAccount) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (fromAccount.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (fromAccount.balance < amount) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    // Determine if requires approval
    const requiresApproval = amount > 100000;

    // Create transaction
    const transaction = new Transaction({
      fromAccountId,
      toExternalBeneficiary: beneficiary,
      amount,
      type: 'wire_transfer',
      status: requiresApproval ? 'pending' : 'processing',
      requiresApproval,
      currency: fromAccount.currency,
      ipAddress: req.ip,
    });

    await transaction.save();

    res.json({
      message: requiresApproval ? 'Wire transfer submitted for approval' : 'Wire transfer processing',
      transaction,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Deposit (manual upload)
router.post('/deposit', authenticateToken, [
  body('accountId').notEmpty().withMessage('Account required'),
  body('amount').isNumeric().withMessage('Valid amount required'),
  body('depositMethod').isIn(['bank_transfer', 'cashapp', 'venmo']).withMessage('Valid deposit method required'),
  body('proofUrl').notEmpty().withMessage('Proof of deposit required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { accountId, amount, depositMethod, proofUrl } = req.body;

    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (account.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create deposit transaction
    const transaction = new Transaction({
      fromAccountId: accountId,
      toAccountId: accountId,
      amount,
      type: 'deposit',
      status: 'pending',
      currency: account.currency,
      description: `Deposit via ${depositMethod}`,
      ipAddress: req.ip,
    });

    await transaction.save();

    res.status(201).json({
      message: 'Deposit submitted for verification',
      transaction,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

module.exports = router;
