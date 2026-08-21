const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  loanType: {
    type: String,
    enum: ['personal', 'collateralized', 'investment_deposit'],
    default: 'personal',
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  interestRate: {
    type: Number,
    required: true,
  },
  term: {
    type: Number, // in months
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'completed', 'default'],
    default: 'pending',
  },
  collateral: {
    type: String,
    enum: ['credit_card', 'deposit', 'investment'],
  },
  collateralDetails: {
    cardId: String,
    creditLimit: Number,
    depositAmount: Number,
  },
  linkedCreditCard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
  },
  linkedCard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
  },
  irs: {
    returnType: String, // 1040, 1120, etc.
    filingYear: Number,
    incomeAmount: Number,
    verificationUrl: String,
  },
  disbursementAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
  },
  monthlyPayment: Number,
  remainingBalance: Number,
  nextPaymentDue: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  approvedAt: Date,
  disbursedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('Loan', loanSchema);
