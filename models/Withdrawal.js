const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
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
  withdrawalMethod: {
    type: String,
    enum: ['cashapp', 'venmo', 'paypal', 'wire_transfer', 'bank_transfer', 'crypto'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'failed'],
    default: 'pending',
  },
  // Proof of withdrawal request
  screenshotUrl: {
    type: String,
    required: true, // Screenshot mandatory
  },
  referenceId: {
    type: String, // Optional (confirmation number, etc.)
  },
  // Destination details
  destinationInfo: {
    accountNumber: String, // For bank transfers
    routingNumber: String,
    accountHolder: String,
    phoneOrEmail: String, // For Venmo, CashApp, PayPal
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
  // Completion
  completedAt: Date,
  // Refund tracking (if failed)
  refundedAmount: Number,
  refundedAt: Date,
  // Metadata
  userNotes: String,
  adminNotes: String,
  ipAddress: String,
  userAgent: String,
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Index for faster queries
withdrawalSchema.index({ userId: 1, status: 1 });
withdrawalSchema.index({ accountId: 1, status: 1 });
withdrawalSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
