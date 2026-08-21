const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  fromAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  toAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
  },
  toExternalBeneficiary: {
    name: String,
    iban: String,
    bankName: String,
    bankCountry: String,
  },
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['internal_transfer', 'wire_transfer', 'ach', 'card_transaction', 'deposit', 'withdrawal', 'fx_conversion', 'loan_disbursement'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'processing', 'completed', 'failed', 'rejected'],
    default: 'pending',
  },
  currency: String,
  description: String,
  fee: {
    type: Number,
    default: 0,
  },
  fxRate: Number,
  requiresApproval: {
    type: Boolean,
    default: false,
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved_by_one', 'approved', 'rejected'],
    default: 'pending',
  },
  approvals: [
    {
      adminId: mongoose.Schema.Types.ObjectId,
      timestamp: Date,
      notes: String,
    },
  ],
  ipAddress: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
