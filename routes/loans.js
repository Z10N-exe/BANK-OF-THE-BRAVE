const express = require('express');
const router = express.Router();
const Loan = require('../models/Loan');
const Account = require('../models/Account');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Ensure upload directory exists
const irsUploadDir = path.join(__dirname, '../uploads/irs');
try {
  if (!fs.existsSync(irsUploadDir)) {
    fs.mkdirSync(irsUploadDir, { recursive: true });
  }
} catch (err) {
  console.log(`Note: Could not create directory ${irsUploadDir} (serverless environment)`);
}

// Multer setup for IRS document uploads
const irsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/irs');
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
    const uniqueName = `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const irsUpload = multer({
  storage: irsStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpeg|jpg|png/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and images allowed.'));
    }
  }
});

// Get user loans
router.get('/', authenticateToken, async (req, res) => {
  try {
    const loans = await Loan.find({ userId: req.user.id })
      .populate('linkedCreditCard')
      .populate('disbursementAccount')
      .sort({ createdAt: -1 });

    res.json({ loans });
  } catch (error) {
    console.error('Get loans error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Apply for loan
router.post('/apply', authenticateToken, irsUpload.single('irsDocument'), [
  body('loanType').isIn(['personal', 'collateralized', 'investment_deposit']).withMessage('Valid loan type required'),
  body('amount').isNumeric().withMessage('Valid amount required'),
  body('term').isNumeric().withMessage('Valid term required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { loanType, amount, term, linkedCreditCardId, irsReturnType, irsFilingYear, irsIncome, disbursementAccountId } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify accounts exist if provided
    if (linkedCreditCardId) {
      const creditCard = await Account.findById(linkedCreditCardId);
      if (!creditCard || creditCard.userId.toString() !== req.user.id) {
        return res.status(404).json({ error: 'Credit card account not found' });
      }
    }

    if (disbursementAccountId) {
      const disbursementAccount = await Account.findById(disbursementAccountId);
      if (!disbursementAccount || disbursementAccount.userId.toString() !== req.user.id) {
        return res.status(404).json({ error: 'Disbursement account not found' });
      }
    }

    // Calculate interest rate and monthly payment (mock calculation)
    const interestRate = loanType === 'collateralized' ? 8.5 : 12.5;
    const monthlyRate = interestRate / 100 / 12;
    const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, term)) /
      (Math.pow(1 + monthlyRate, term) - 1);

    const loan = new Loan({
      userId: req.user.id,
      loanType,
      amount: parseFloat(amount),
      currency: 'USD',
      interestRate,
      term: parseInt(term),
      status: 'pending',
      collateral: linkedCreditCardId ? 'credit_card' : undefined,
      linkedCreditCard: linkedCreditCardId,
      disbursementAccount: disbursementAccountId,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      remainingBalance: parseFloat(amount),
      nextPaymentDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });

    // Add IRS data if provided
    if (irsReturnType && irsFilingYear && irsIncome && req.file) {
      const irsPath = `/uploads/irs/${path.basename(req.file.filename)}`;
      loan.irs = {
        returnType: irsReturnType,
        filingYear: parseInt(irsFilingYear),
        incomeAmount: parseFloat(irsIncome),
        verificationUrl: irsPath
      };
      
      console.log(`✓ IRS document uploaded: ${irsPath}`);
    }

    await loan.save();

    console.log(`✓ Loan application created for user ${req.user.id}`);
    console.log(`  - Amount: $${amount}`);
    console.log(`  - Type: ${loanType}`);

    res.status(201).json({
      message: 'Loan application submitted. Awaiting approval.',
      loan,
      files: req.file ? {
        irsDocument: `/uploads/irs/${path.basename(req.file.filename)}`
      } : null
    });
  } catch (error) {
    console.error('Loan application error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Get loan details
router.get('/:loanId', authenticateToken, async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.loanId)
      .populate('linkedCreditCard')
      .populate('disbursementAccount');

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    if (loan.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ loan });
  } catch (error) {
    console.error('Get loan error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Admin approve/reject loan
router.post('/:loanId/approve', authenticateToken, [
  body('status').isIn(['approved', 'rejected']).withMessage('Valid status required'),
  body('notes').optional()
], async (req, res) => {
  try {
    // Verify user is admin
    const adminUser = await User.findById(req.user.id);
    if (!['admin', 'wealth_manager'].includes(adminUser.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status, notes } = req.body;
    const loan = await Loan.findById(req.params.loanId);

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    if (status === 'approved') {
      loan.status = 'approved';
      loan.approvedAt = new Date();
    } else {
      loan.status = 'rejected';
    }

    await loan.save();

    console.log(`✓ Loan ${status}: ${req.params.loanId}`);

    res.json({
      message: `Loan ${status}`,
      loan
    });
  } catch (error) {
    console.error('Loan approval error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

module.exports = router;
