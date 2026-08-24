const express = require('express');
const router = express.Router();
const Loan = require('../models/Loan');
const Account = require('../models/Account');
const User = require('../models/User');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get user loans
router.get('/', authenticateToken, async (req, res) => {
  try {
    const loans = await Loan.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ loans });
  } catch (error) { res.status(500).json({ error: 'Server error: ' + error.message }); }
});

// Apply for loan
router.post('/apply', authenticateToken, [
  body('loanType').isIn(['personal','collateralized','investment_deposit','irs_advance']).withMessage('Valid loan type required'),
  body('amount').isNumeric().withMessage('Valid amount required'),
  body('term').optional().isNumeric(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { loanType, amount, term, linkedCreditCardId, disbursementAccountId } = req.body;

    if (linkedCreditCardId) {
      const cc = await Account.findById(linkedCreditCardId);
      if (!cc || cc.userId.toString() !== req.user.id) return res.status(404).json({ error: 'Credit card account not found' });
    }
    if (disbursementAccountId) {
      const da = await Account.findById(disbursementAccountId);
      if (!da || da.userId.toString() !== req.user.id) return res.status(404).json({ error: 'Disbursement account not found' });
    }

    const interestRate = loanType === 'collateralized' ? 8.5 : loanType === 'irs_advance' ? 0 : 12.5;
    const loanTerm = parseInt(term) || 12;
    const monthlyRate = interestRate / 100 / 12;
    const monthlyPayment = interestRate > 0
      ? (parseFloat(amount) * monthlyRate * Math.pow(1 + monthlyRate, loanTerm)) / (Math.pow(1 + monthlyRate, loanTerm) - 1)
      : parseFloat(amount) / loanTerm;

    const loan = new Loan({
      userId: req.user.id, loanType,
      amount: parseFloat(amount), currency: 'USD',
      interestRate, term: loanTerm, status: 'pending',
      collateral: linkedCreditCardId ? 'credit_card' : undefined,
      linkedCreditCard: linkedCreditCardId || undefined,
      disbursementAccount: disbursementAccountId || undefined,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      remainingBalance: parseFloat(amount),
      nextPaymentDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    await loan.save();
    res.status(201).json({ message: 'Loan application submitted. Awaiting approval.', loan });
  } catch (error) {
    console.error('Loan application error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Admin: get all loans
router.get('/admin/all', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { status } = req.query;
    const filters = {};
    if (status) filters.status = status;
    const loans = await Loan.find(filters).populate('userId','email firstName lastName').sort({ createdAt: -1 });
    res.json({ total: loans.length, loans });
  } catch (error) { res.status(500).json({ error: 'Server error: ' + error.message }); }
});

// Get single loan
router.get('/:loanId', authenticateToken, async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.loanId);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    if (loan.userId.toString() !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
    res.json({ loan });
  } catch (error) { res.status(500).json({ error: 'Server error: ' + error.message }); }
});

// Admin approve/reject loan
router.post('/:loanId/approve', authenticateToken, authorizeRoles(['admin']), [
  body('status').isIn(['approved','rejected']).withMessage('Valid status required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { status, notes } = req.body;
    const loan = await Loan.findById(req.params.loanId);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });

    loan.status = status;
    if (status === 'approved') {
      loan.approvedAt = new Date();
      // If approved, disburse to account
      if (loan.disbursementAccount) {
        const account = await Account.findById(loan.disbursementAccount);
        if (account) { account.balance += loan.amount; await account.save(); }
      }
    }
    if (notes) loan.notes = notes;
    await loan.save();
    res.json({ message: 'Loan ' + status, loan });
  } catch (error) { res.status(500).json({ error: 'Server error: ' + error.message }); }
});

module.exports = router;
