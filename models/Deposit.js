const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  depositMethod: {
    type: String,
    enum: ['cashapp', 'venmo', 'paypal', 'wire_transfer', 'bank_transfer', 'crypto', 'zelle'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'failed'],
    default: 'pending',
  },
  // Proof of payment — stored as base64 in MongoDB (Render-compatible, no disk storage)
  screenshotData: {
    type: String, // base64 encoded image/pdf data
    required: true,
  },
  screenshotMimeType: {
    type: String, // e.g. 'image/jpeg', 'image/png', 'application/pdf'
    default: 'image/jpeg',
  },
  screenshotUrl: {
    type: String, // legacy field, optional
  },
  referenceId: {
    type: String,
  },
  purpose: {
    type: String,
    enum: ['account_funding', 'card_activation', 'premium_upgrade'],
    default: 'account_funding',
  },
  // Admin approval tracking
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: Date,
  rejectionReason: String,
  rejectedAt: Date,
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  completedAt: Date,
  userNotes: String,
  adminNotes: String,
  ipAddress: String,
  userAgent: String,
}, { timestamps: true });

depositSchema.index({ userId: 1, status: 1 });
depositSchema.index({ accountId: 1, status: 1 });
depositSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Deposit', depositSchema);

