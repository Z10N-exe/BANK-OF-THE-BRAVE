const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const RetirementAccount = require('../models/RetirementAccount');
const Account = require('../models/Account');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const PLAN_DEFAULTS = {
  '401k': { interestRate: 5, annualContributionLimit: 23500, employerMatchPercent: 4 },
  traditional_ira: { interestRate: 4.5, annualContributionLimit: 7000, employerMatchPercent: 0 },
  roth_ira: { interestRate: 4.5, annualContributionLimit: 7000, employerMatchPercent: 0 },
  long_term_savings: { interestRate: 3.5, annualContributionLimit: 100000, employerMatchPercent: 0 },
};

function validObjectId(value) {
  return mongoose.isValidObjectId(value);
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    const accounts = await RetirementAccount.find({ userId: req.user.id }).populate('linkedAccountId', 'accountNumber accountType currency balance');
    res.json({ accounts });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { planType, linkedAccountId } = req.body;
    if (!PLAN_DEFAULTS[planType]) return res.status(400).json({ error: 'Valid retirement plan required' });
    if (linkedAccountId && !validObjectId(linkedAccountId)) return res.status(400).json({ error: 'Valid linked account required' });

    if (linkedAccountId) {
      const linkedAccount = await Account.findOne({ _id: linkedAccountId, userId: req.user.id });
      if (!linkedAccount) return res.status(404).json({ error: 'Linked account not found' });
    }

    const account = await RetirementAccount.create({
      userId: req.user.id,
      planType,
      linkedAccountId: linkedAccountId || undefined,
      ...PLAN_DEFAULTS[planType],
    });
    res.status(201).json({ message: 'Savings plan opened successfully', account });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ error: 'You already have this savings plan' });
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

router.post('/:accountId/contribute', authenticateToken, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'Contribution must be greater than zero' });

    const retirementAccount = await RetirementAccount.findOne({ _id: req.params.accountId, userId: req.user.id });
    if (!retirementAccount) return res.status(404).json({ error: 'Savings plan not found' });
    if (retirementAccount.status !== 'active') return res.status(400).json({ error: 'This savings plan is not active' });

    const year = new Date().getFullYear();
    if (retirementAccount.lastContributionYear !== year) retirementAccount.currentYearContributions = 0;
    if (retirementAccount.currentYearContributions + amount > retirementAccount.annualContributionLimit) {
      return res.status(400).json({ error: `Annual contribution limit is $${retirementAccount.annualContributionLimit.toLocaleString()}` });
    }

    const linkedAccount = await Account.findOne({ _id: retirementAccount.linkedAccountId, userId: req.user.id });
    if (!linkedAccount) return res.status(400).json({ error: 'Link a bank account before contributing' });
    if (linkedAccount.balance < amount) return res.status(400).json({ error: 'Insufficient balance in linked account' });

    const user = await User.findById(req.user.id).select('isPremium');
    const premiumMatch = retirementAccount.planType === '401k' && user?.isPremium ? Math.round(amount * 0.3 * 100) / 100 : 0;
    linkedAccount.balance -= amount;
    retirementAccount.balance += amount + premiumMatch;
    retirementAccount.currentYearContributions += amount;
    retirementAccount.lastContributionYear = year;
    retirementAccount.contributions.push({ amount, source: 'user', year });
    if (premiumMatch > 0) retirementAccount.contributions.push({ amount: premiumMatch, source: 'employer_match', year });
    await linkedAccount.save();
    await retirementAccount.save();

    await Transaction.create({
      fromAccountId: linkedAccount._id,
      toAccountId: linkedAccount._id,
      amount,
      currency: linkedAccount.currency,
      type: 'retirement_contribution',
      description: `Contribution to ${retirementAccount.planType}`,
      status: 'completed',
    });
    res.json({ message: premiumMatch ? `Contribution added with a ${premiumMatch.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} Premium match` : 'Contribution added successfully', account: retirementAccount, contribution: amount, premiumMatch, linkedAccountBalance: linkedAccount.balance });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

router.post('/:accountId/withdraw', authenticateToken, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const reason = String(req.body.reason || '').trim();
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'Withdrawal must be greater than zero' });
    if (!reason) return res.status(400).json({ error: 'Withdrawal reason required' });

    const account = await RetirementAccount.findOne({ _id: req.params.accountId, userId: req.user.id });
    if (!account) return res.status(404).json({ error: 'Savings plan not found' });
    if (amount > account.balance) return res.status(400).json({ error: 'Withdrawal exceeds savings balance' });

    account.withdrawalRequests.push({ amount, reason });
    await account.save();
    res.status(201).json({ message: 'Withdrawal request submitted for admin review', account });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

router.get('/admin/all', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const accounts = await RetirementAccount.find().populate('userId', 'firstName lastName email').sort({ updatedAt: -1 });
    res.json({ accounts });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

router.patch('/admin/:accountId', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const account = await RetirementAccount.findById(req.params.accountId);
    if (!account) return res.status(404).json({ error: 'Savings plan not found' });
    const allowed = ['status', 'interestRate', 'annualContributionLimit', 'employerMatchPercent'];
    allowed.forEach(field => { if (req.body[field] !== undefined) account[field] = req.body[field]; });
    await account.save();
    res.json({ message: 'Savings plan settings updated', account });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

router.post('/admin/:accountId/withdrawal/:requestId', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const account = await RetirementAccount.findById(req.params.accountId);
    if (!account) return res.status(404).json({ error: 'Savings plan not found' });
    const request = account.withdrawalRequests.id(req.params.requestId);
    if (!request) return res.status(404).json({ error: 'Withdrawal request not found' });
    if (request.status !== 'pending') return res.status(400).json({ error: 'Withdrawal already reviewed' });

    const action = req.body.action;
    if (!['approved', 'rejected'].includes(action)) return res.status(400).json({ error: 'Action must be approved or rejected' });
    if (action === 'approved') {
      if (request.amount > account.balance) return res.status(400).json({ error: 'Insufficient savings balance' });
      account.balance -= request.amount;
      const linkedAccount = await Account.findOne({ _id: account.linkedAccountId, userId: account.userId });
      if (!linkedAccount) return res.status(400).json({ error: 'Linked bank account not found' });
      linkedAccount.balance += request.amount;
      await linkedAccount.save();
      await Transaction.create({
        fromAccountId: linkedAccount._id,
        toAccountId: linkedAccount._id,
        amount: request.amount,
        currency: linkedAccount.currency,
        type: 'retirement_contribution',
        description: `Withdrawal from ${account.planType}`,
        status: 'completed',
      });
    }
    request.status = action;
    request.reviewedBy = validObjectId(req.user.id) ? req.user.id : undefined;
    request.reviewedAt = new Date();
    await account.save();
    res.json({ message: `Withdrawal ${action}`, account });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

module.exports = router;
