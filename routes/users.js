const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('accounts')
      .select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, phone } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Change password
router.post('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password changed successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Enable MFA (mock implementation)
router.post('/mfa/enable', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Mock MFA secret generation
    const mfaSecret = 'MOCK_SECRET_' + Math.random().toString(36).substring(7).toUpperCase();

    user.mfaSecret = mfaSecret;
    user.mfaEnabled = true;
    await user.save();

    res.json({
      message: 'MFA enabled. Save your secret key.',
      secret: mfaSecret,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(mfaSecret)}`,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Get account statements
router.get('/statements/:accountId', authenticateToken, async (req, res) => {
  try {
    const Account = require('../models/Account');
    const Transaction = require('../models/Transaction');

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
      .limit(100);

    // Calculate statement totals
    const deposits = transactions
      .filter(t => t.type === 'deposit' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const withdrawals = transactions
      .filter(t => (t.type === 'withdrawal' || t.type === 'wire_transfer') && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      account,
      transactions,
      statement: {
        period: {
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          to: new Date(),
        },
        openingBalance: account.balance + withdrawals - deposits,
        deposits,
        withdrawals,
        closingBalance: account.balance,
        transactionCount: transactions.length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

module.exports = router;
