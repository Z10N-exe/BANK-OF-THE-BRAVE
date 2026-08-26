const mongoose = require('mongoose');

async function generateAccountNumber(Account) {
  let accountNumber;
  do {
    accountNumber = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');
  } while (await Account.exists({ accountNumber }));
  return accountNumber;
}

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  accountType: {
    type: String,
    enum: ['checking', 'savings', 'investment', 'loan', 'credit'],
    default: 'checking',
  },
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP', 'BTC'],
    default: 'USD',
  },
  balance: {
    type: Number,
    default: 0,
  },
  creditLimit: {
    type: Number,
    default: 0,
  },
  iban: String,
  accountNumber: String,
  routingNumber: String,
  cardIssued: {
    type: Boolean,
    default: false,
  },
  cardType: {
    type: String,
    enum: ['virtual', 'physical', 'none'],
    default: 'none',
  },
  cardStatus: {
    type: String,
    enum: ['active', 'frozen', 'terminated'],
    default: 'active',
  },
  accountStatus: {
    type: String,
    enum: ['active', 'frozen', 'terminated'],
    default: 'active',
  },
  dailySpendLimit: {
    type: Number,
    default: 5000,
  },
  atmLimit: {
    type: Number,
    default: 1000,
  },
  onlinePaymentsEnabled: {
    type: Boolean,
    default: true,
  },
  subAccounts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
  ],
  cards: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card',
    },
  ],
  depositMethods: {
    cashApp: Boolean,
    venmo: Boolean,
    bankTransfer: Boolean,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

accountSchema.pre('validate', async function (next) {
  if (!this.accountNumber) {
    this.accountNumber = await generateAccountNumber(this.constructor);
  }
  next();
});

module.exports = mongoose.model('Account', accountSchema);
