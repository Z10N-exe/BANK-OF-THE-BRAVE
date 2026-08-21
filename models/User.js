const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'compliance', 'support', 'auditor', 'wealth_manager'],
    default: 'user',
  },
  accountStatus: {
    type: String,
    enum: ['pending_kyc', 'active', 'suspended', 'terminated'],
    default: 'pending_kyc',
  },
  kycStatus: {
    type: String,
    enum: ['not_started', 'pending', 'verified', 'rejected'],
    default: 'not_started',
  },
  kyc: {
    ssn: String,
    idDocument: String, // URL or file path
    idType: String, // driver's license, passport, etc.
    selfieUrl: String,
    dateOfBirth: Date,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    verificationDate: Date,
  },
  mfaEnabled: {
    type: Boolean,
    default: false,
  },
  mfaSecret: String,
  accounts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
  ],
  identityVerified: {
    type: Boolean,
    default: false,
  },
  fundingDate: Date,
  minimumFundingAmount: {
    type: Number,
    default: 500,
  },
  hasInitialFunding: {
    type: Boolean,
    default: false,
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

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
