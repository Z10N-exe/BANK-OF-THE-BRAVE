const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Account = require('../models/Account');
const jwt = require('jsonwebtoken');
const { validationResult, body } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');

// Signup - Realistic flow, no OTP verification
router.post('/signup', [
  body('firstName').notEmpty().withMessage('First name required'),
  body('lastName').notEmpty().withMessage('Last name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('phone').notEmpty().withMessage('Phone required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, phone, password } = req.body;
    console.log('Signup attempt:', { firstName, lastName, email, phone });

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user in pending_kyc status
    user = new User({
      firstName,
      lastName,
      email,
      phone,
      password,
      accountStatus: 'pending_kyc',
      kycStatus: 'not_started',
    });

    await user.save();
    console.log('User saved successfully');

    // Create default checking account
    const account = new Account({
      userId: user._id,
      accountType: 'checking',
      currency: 'USD',
      balance: 0,
    });

    await account.save();

    // Link account to user
    user.accounts.push(account._id);
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      message: 'Account created successfully. Please complete KYC verification.',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        accountStatus: user.accountStatus,
        kycStatus: user.kycStatus,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // HARDCODED ADMIN CREDENTIALS
    if (email === 'bob' && password === '1234') {
      // Create admin token with hardcoded admin role
      const adminToken = jwt.sign(
        { 
          id: 'admin_hardcoded', 
          email: 'bob', 
          role: 'admin',
          isHardcodedAdmin: true 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      return res.json({
        message: 'Admin login successful',
        token: adminToken,
        user: {
          id: 'admin_hardcoded',
          firstName: 'Admin',
          lastName: 'Account',
          email: 'bob',
          role: 'admin',
          accountStatus: 'active',
          isHardcodedAdmin: true,
        },
      });
    }

    // Find regular user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check account status
    if (user.accountStatus === 'suspended' || user.accountStatus === 'terminated') {
      return res.status(403).json({ error: 'Account is ' + user.accountStatus });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        kycStatus: user.kycStatus,
        hasInitialFunding: user.hasInitialFunding,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // If hardcoded admin
    if (req.user.isHardcodedAdmin) {
      return res.json({ 
        user: {
          id: req.user.id,
          firstName: 'Admin',
          lastName: 'Account',
          email: req.user.email,
          role: 'admin',
          accountStatus: 'active',
          isHardcodedAdmin: true,
        }
      });
    }

    const user = await User.findById(req.user.id).populate('accounts');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

module.exports = router;
