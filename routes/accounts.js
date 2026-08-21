const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get user accounts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const accounts = await Account.find({ _id: { $in: user.accounts } });
    res.json({ accounts });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Get single account
router.get('/:accountId', authenticateToken, async (req, res) => {
  try {
    const account = await Account.findById(req.params.accountId);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Check if user owns this account
    if (account.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ account });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Create additional account
router.post('/', authenticateToken, [
  body('accountType').isIn(['checking', 'savings', 'investment']).withMessage('Valid account type required'),
  body('currency').isIn(['USD', 'EUR', 'GBP', 'BTC']).withMessage('Valid currency required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { accountType, currency } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const account = new Account({
      userId: req.user.id,
      accountType,
      currency,
      balance: 0,
    });

    await account.save();
    user.accounts.push(account._id);
    await user.save();

    res.status(201).json({
      message: 'Account created successfully',
      account,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Get account transactions
router.get('/:accountId/transactions', authenticateToken, async (req, res) => {
  try {
    const account = await Account.findById(req.params.accountId);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (account.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const transactions = await Transaction.find({
      $or: [
        { fromAccountId: account._id },
        { toAccountId: account._id },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Issue card
router.post('/:accountId/issue-card', authenticateToken, [
  body('cardType').isIn(['virtual', 'physical']).withMessage('Valid card type required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { cardType } = req.body;
    const account = await Account.findById(req.params.accountId);

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (account.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    account.cardIssued = true;
    account.cardType = cardType;
    account.cardStatus = 'active';
    await account.save();

    res.json({
      message: `${cardType} card issued successfully`,
      account,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Control card security
router.post('/:accountId/card-control', authenticateToken, [
  body('action').isIn(['freeze', 'unfreeze']).withMessage('Valid action required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { action } = req.body;
    const account = await Account.findById(req.params.accountId);

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (account.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!account.cardIssued) {
      return res.status(400).json({ error: 'No card issued for this account' });
    }

    if (action === 'freeze') {
      account.cardStatus = 'frozen';
    } else {
      account.cardStatus = 'active';
    }

    await account.save();

    res.json({
      message: `Card ${action}d successfully`,
      account,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Update spending limits
router.post('/:accountId/spending-limits', authenticateToken, [
  body('dailySpendLimit').isNumeric().withMessage('Valid amount required'),
  body('atmLimit').isNumeric().withMessage('Valid amount required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { dailySpendLimit, atmLimit } = req.body;
    const account = await Account.findById(req.params.accountId);

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (account.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    account.dailySpendLimit = dailySpendLimit;
    account.atmLimit = atmLimit;
    await account.save();

    res.json({
      message: 'Spending limits updated',
      account,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

module.exports = router;
