const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
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
  cardType: {
    type: String,
    enum: ['debit', 'credit'],
    required: true,
  },
  cardFormat: {
    type: String,
    enum: ['virtual', 'physical'],
    default: 'virtual',
  },
  cardBrand: {
    type: String,
    enum: ['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER'],
    default: 'VISA',
  },
  status: {
    type: String,
    enum: ['active', 'frozen', 'expired', 'cancelled'],
    default: 'active',
  },
  // Card Details (masked in responses)
  cardNumber: {
    type: String,
    required: true,
    select: false, // Don't return by default
  },
  cvv: {
    type: String,
    required: true,
    select: false,
  },
  expiryDate: {
    type: String, // MM/YY format
    required: true,
    select: false,
  },
  cardholderName: {
    type: String,
    required: true,
  },
  
  // Display Info
  last4Digits: {
    type: String,
    required: true,
  },
  activationPaymentMethod: {
    type: String,
    default: 'cashapp',
  },
  activationPaymentReference: String,
  
  // Card Settings
  dailySpendLimit: {
    type: Number,
    default: 5000,
  },
  atmDailyLimit: {
    type: Number,
    default: 1000,
  },
  onlinePaymentsEnabled: {
    type: Boolean,
    default: true,
  },
  internationalTransactionsEnabled: {
    type: Boolean,
    default: false,
  },
  contactlessEnabled: {
    type: Boolean,
    default: true,
  },
  threeDSecureEnabled: {
    type: Boolean,
    default: true,
  },
  
  // Spending Tracking
  currentDaySpending: {
    type: Number,
    default: 0,
  },
  currentDayATMWithdrawal: {
    type: Number,
    default: 0,
  },
  spendingResetDate: Date,
  
  // Card Features
  isPrimary: {
    type: Boolean,
    default: false,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  hasPin: {
    type: Boolean,
    default: false,
  },
  pinHash: String,
  
  // For Linked Cards (Credit Card linking)
  linkedFromAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card', // For linking credit card to loan
  },
  linkedLoans: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
    },
  ],
  
  // Delivery Info (Physical Cards)
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'returned'],
  },
  trackingNumber: String,
  deliveryDate: Date,
  
  // Notifications & Security
  notificationsEnabled: {
    type: Boolean,
    default: true,
  },
  fraudAlertEnabled: {
    type: Boolean,
    default: true,
  },
  lowBalanceAlert: {
    type: Number,
    default: 100,
  },
  
  // Metadata
  issueDate: {
    type: Date,
    default: Date.now,
  },
  replacementOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
  },
  replacedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
  },
  lastUsedDate: Date,
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Index for fast queries
cardSchema.index({ userId: 1, status: 1 });
cardSchema.index({ cardNumber: 1 });
cardSchema.index({ accountId: 1 });

// Virtual for masked card number
cardSchema.virtual('maskedCardNumber').get(function() {
  return `****-****-****-${this.last4Digits}`;
});

module.exports = mongoose.model('Card', cardSchema);
