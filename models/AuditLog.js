const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  action: {
    type: String,
    required: true,
  },
  actionType: {
    type: String,
    enum: ['balance_adjustment', 'account_suspension', 'account_creation', 'account_freeze', 'kyc_verification', 'transaction_approval', 'fee_configuration', 'settings_update', 'admin_deposit', 'notification_sent', 'withdrawal_approval', 'user_upgrade', 'payment_method_update', 'login', 'logout', 'data_access'],
    required: true,
  },
  resourceId: mongoose.Schema.Types.ObjectId,
  resourceType: {
    type: String,
    enum: ['user', 'account', 'transaction', 'loan', 'notification', 'withdrawal'],
  },
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
  },
  ipAddress: String,
  userAgent: String,
  status: {
    type: String,
    enum: ['success', 'failure'],
    default: 'success',
  },
  details: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Index for fast queries
auditLogSchema.index({ adminId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ actionType: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
