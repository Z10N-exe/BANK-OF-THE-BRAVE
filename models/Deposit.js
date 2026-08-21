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
    enum: ['cashapp', 'venmo', 'paypal', 'wire_transfer', 'bank_transfer', 'crypto'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'failed'],
    default: 'pending',
  },
  // Proof of payment
  screenshotUrl: {
    type: String,
    required: true, // Screenshot is mandatory
  },
  referenceId: {
    type: String, // Optional reference (transaction ID, order ID, etc.)
  },
  // Admin approval tracking
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Admin user who approved
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
  // Metadata
  userNotes: String, // User can add notes about the deposit
  adminNotes: String, // Admin can add internal notes
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
depositSchema.index({ userId: 1, status: 1 });
depositSchema.index({ accountId: 1, status: 1 });
depositSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Deposit', depositSchema);
