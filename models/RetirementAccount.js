const mongoose = require('mongoose');

const retirementAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  planType: {
    type: String,
    enum: ['401k', 'traditional_ira', 'roth_ira', 'long_term_savings'],
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'closed'],
    default: 'active',
  },
  balance: {
    type: Number,
    default: 0,
    min: 0,
  },
  interestRate: {
    type: Number,
    default: 4.5,
    min: 0,
  },
  annualContributionLimit: {
    type: Number,
    default: 23500,
    min: 0,
  },
  employerMatchPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  linkedAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
  },
  currentYearContributions: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastContributionYear: Number,
  contributions: [{
    amount: Number,
    source: { type: String, enum: ['user', 'employer_match'], default: 'user' },
    year: Number,
    createdAt: { type: Date, default: Date.now },
  }],
  withdrawalRequests: [{
    amount: Number,
    reason: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy: mongoose.Schema.Types.ObjectId,
    reviewedAt: Date,
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

retirementAccountSchema.index({ userId: 1, planType: 1 }, { unique: true });

module.exports = mongoose.model('RetirementAccount', retirementAccountSchema);
