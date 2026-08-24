const mongoose = require('mongoose');

const depositSettingsSchema = new mongoose.Schema({
  // Allowed deposit methods
  depositMethods: {
    cashapp: {
      enabled: { type: Boolean, default: true },
      paymentInstructions: { type: String, default: 'Please send to $AdminCashApp' },
      minAmount: { type: Number, default: 500 },
      maxAmount: { type: Number, default: 25000 },
    },
    venmo: {
      enabled: { type: Boolean, default: true },
      paymentInstructions: { type: String, default: 'Please send to @AdminVenmo' },
      minAmount: { type: Number, default: 500 },
      maxAmount: { type: Number, default: 25000 },
    },
    paypal: {
      enabled: { type: Boolean, default: true },
      paymentInstructions: { type: String, default: 'Please send to admin@paypal.com' },
      minAmount: { type: Number, default: 500 },
      maxAmount: { type: Number, default: 50000 },
    },
    wire_transfer: {
      enabled: { type: Boolean, default: true },
      paymentInstructions: { type: String, default: 'Wire details: Bank of America, Account 123456789' },
      minAmount: { type: Number, default: 1000 },
      maxAmount: { type: Number, default: 500000 },
    },
    bank_transfer: {
      enabled: { type: Boolean, default: true },
      paymentInstructions: { type: String, default: 'Transfer details: Chase Bank, Routing 987654321' },
      minAmount: { type: Number, default: 500 },
      maxAmount: { type: Number, default: 100000 },
    },
    zelle: {
      enabled: { type: Boolean, default: true },
      paymentInstructions: { type: String, default: 'Send via Zelle to admin@zelle.com' },
      minAmount: { type: Number, default: 500 },
      maxAmount: { type: Number, default: 100000 },
    },
    crypto: {
      enabled: { type: Boolean, default: false },
      paymentInstructions: { type: String, default: 'BTC Wallet: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' },
      minAmount: { type: Number, default: 500 },
      maxAmount: { type: Number, default: 250000 },
    },
  },
  // Withdrawal methods
  withdrawalMethods: {
    cashapp: {
      enabled: { type: Boolean, default: true },
      minAmount: { type: Number, default: 100 },
      maxAmount: { type: Number, default: 25000 },
    },
    venmo: {
      enabled: { type: Boolean, default: true },
      minAmount: { type: Number, default: 100 },
      maxAmount: { type: Number, default: 25000 },
    },
    paypal: {
      enabled: { type: Boolean, default: true },
      minAmount: { type: Number, default: 100 },
      maxAmount: { type: Number, default: 50000 },
    },
    wire_transfer: {
      enabled: { type: Boolean, default: true },
      minAmount: { type: Number, default: 500 },
      maxAmount: { type: Number, default: 500000 },
    },
    bank_transfer: {
      enabled: { type: Boolean, default: true },
      minAmount: { type: Number, default: 100 },
      maxAmount: { type: Number, default: 100000 },
    },
    crypto: {
      enabled: { type: Boolean, default: false },
      minAmount: { type: Number, default: 500 },
      maxAmount: { type: Number, default: 250000 },
    },
  },
  // Global settings
  autoApproveDepositsUnder: {
    type: Number,
    default: 0, // 0 = no auto-approval
  },
  requireAdminApprovalOver: {
    type: Number,
    default: 100000,
  },
  depositApprovalTimeout: {
    type: Number,
    default: 3600, // 1 hour in seconds
  },
  withdrawalApprovalTimeout: {
    type: Number,
    default: 1800, // 30 mins in seconds
  },
  dailyWithdrawalLimit: {
    type: Number,
    default: 500000,
  },
  minimumDepositAmount: {
    type: Number,
    default: 500,
  },
  maximumDepositAmount: {
    type: Number,
    default: 1000000,
  },
  
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

module.exports = mongoose.model('DepositSettings', depositSettingsSchema);
