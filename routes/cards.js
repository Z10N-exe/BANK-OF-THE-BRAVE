const express = require('express');
const router = express.Router();
const Card = require('../models/Card');
const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');
const AuditLog = require('../models/AuditLog');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');

// Helper function to generate card number (mock)
function generateCardNumber(brand = 'VISA') {
  const prefixes = {
    VISA: '4',
    MASTERCARD: '5',
    AMEX: '3',
    DISCOVER: '6'
  };
  
  const prefix = prefixes[brand];
  let cardNum = prefix;
  
  for (let i = 0; i < 15; i++) {
    cardNum += Math.floor(Math.random() * 10);
  }
  
  return cardNum;
}

// Helper function to generate CVV (mock)
function generateCVV() {
  return Math.floor(100 + Math.random() * 900).toString();
}

// Helper function to generate expiry date (valid for 5 years)
function generateExpiryDate() {
  const now = new Date();
  const expiryDate = new Date(now.getFullYear() + 5, now.getMonth());
  return `${String(expiryDate.getMonth() + 1).padStart(2, '0')}/${String(expiryDate.getFullYear()).slice(-2)}`;
}

// Helper function to hash sensitive data
function hashSensitiveData(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Helper function to create audit log
async function createAuditLog(userId, action, details, ipAddress = null) {
  try {
    const log = new AuditLog({
      userId,
      action,
      details,
      ipAddress,
      timestamp: new Date()
    });
    await log.save();
  } catch (error) {
    console.log('Audit log creation error:', error.message);
  }
}

// ============== LIST ALL USER CARDS ==============
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const cards = await Card.find({ userId: req.user.id })
      .select('-cardNumber -cvv -pinHash')
      .sort({ isPrimary: -1, createdAt: -1 });

    res.json({ 
      message: 'Cards retrieved successfully',
      count: cards.length,
      cards 
    });
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== GET SINGLE CARD ==============
router.get('/:cardId', authenticateToken, async (req, res) => {
  try {
    const card = await Card.findById(req.params.cardId)
      .select('-cardNumber -cvv -pinHash');

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Check authorization
    if (card.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ message: 'Card retrieved successfully', card });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== ISSUE NEW CARD ==============
router.post('/issue', authenticateToken, [
  body('accountId').isMongoId().withMessage('Valid account ID required'),
  body('cardType').isIn(['debit', 'credit']).withMessage('Card type must be debit or credit'),
  body('cardFormat').isIn(['virtual', 'physical']).withMessage('Card format must be virtual or physical'),
  body('cardBrand').isIn(['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER']).withMessage('Valid card brand required'),
  body('paymentReference').isString().trim().notEmpty().withMessage('Cash App payment reference required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { accountId, cardType, cardFormat, cardBrand, paymentReference } = req.body;

    // Verify user owns account
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (account.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if user already has a primary card of this type
    if (cardType === 'debit') {
      const existingPrimary = await Card.findOne({
        userId: req.user.id,
        cardType: 'debit',
        isPrimary: true,
        status: { $ne: 'cancelled' }
      });

      if (existingPrimary) {
        return res.status(400).json({ error: 'You already have a primary debit card. Cancel existing or set as non-primary.' });
      }
    }

    // Generate card details
    const cardNumber = generateCardNumber(cardBrand);
    const last4 = cardNumber.slice(-4);
    const cvv = generateCVV();
    const expiryDate = generateExpiryDate();

    // Get user details for cardholder name
    const user = await User.findById(req.user.id);
    const cardholderName = `${user.firstName} ${user.lastName}`.toUpperCase();

    // Create card after confirming the activation fee can be paid.
    const card = new Card({
      userId: req.user.id,
      accountId,
      cardType,
      cardFormat,
      cardBrand,
      cardNumber: hashSensitiveData(cardNumber), // Hash for storage
      cvv: hashSensitiveData(cvv),
      expiryDate,
      cardholderName,
      last4Digits: last4,
      activationPaymentMethod: 'cashapp',
      activationPaymentReference: paymentReference,
      isPrimary: cardType === 'debit', // First debit card is primary
      isDefault: true,
      status: 'active',
      spendingResetDate: new Date()
    });

    await card.save();

    // Add to account
    if (!account.cards) {
      account.cards = [];
    }
    account.cards.push(card._id);
    await account.save();

    // Create audit log
    await createAuditLog(
      req.user.id,
      'CARD_ISSUED',
      {
        cardId: card._id,
        cardType,
        cardFormat,
        cardBrand,
        last4: last4,
        paymentMethod: 'cashapp',
        paymentReference
      }
    );

    // Return card without sensitive data
    const cardResponse = await Card.findById(card._id).select('-cardNumber -cvv -pinHash');

    res.status(201).json({
      message: `${cardFormat} ${cardType} card issued successfully`,
      card: cardResponse,
      fee: {
        amount: 300,
        description: 'Card Activation Fee',
        paymentMethod: 'Cash App',
        paymentReference,
        instructions: 'Send $300 via Cash App and keep your payment reference.'
      },
      cardDetails: {
        cardNumber,
        cvv,
        expiryDate,
        note: 'Please save these details securely. They will not be shown again.'
      }
    });
  } catch (error) {
    console.error('Card issuance error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== FREEZE CARD ==============
router.post('/:cardId/freeze', authenticateToken, async (req, res) => {
  try {
    const card = await Card.findById(req.params.cardId);

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    if (card.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (card.status === 'frozen') {
      return res.status(400).json({ error: 'Card is already frozen' });
    }

    if (card.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot freeze cancelled card' });
    }

    card.status = 'frozen';
    await card.save();

    await createAuditLog(
      req.user.id,
      'CARD_FROZEN',
      { cardId: card._id, last4: card.last4Digits }
    );

    const cardResponse = await Card.findById(card._id).select('-cardNumber -cvv -pinHash');

    res.json({
      message: 'Card frozen successfully',
      card: cardResponse
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== UNFREEZE CARD ==============
router.post('/:cardId/unfreeze', authenticateToken, async (req, res) => {
  try {
    const card = await Card.findById(req.params.cardId);

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    if (card.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (card.status !== 'frozen') {
      return res.status(400).json({ error: 'Card is not frozen' });
    }

    card.status = 'active';
    await card.save();

    await createAuditLog(
      req.user.id,
      'CARD_UNFROZEN',
      { cardId: card._id, last4: card.last4Digits }
    );

    const cardResponse = await Card.findById(card._id).select('-cardNumber -cvv -pinHash');

    res.json({
      message: 'Card unfrozen successfully',
      card: cardResponse
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== UPDATE CARD SETTINGS ==============
router.post('/:cardId/settings', authenticateToken, [
  body('dailySpendLimit').optional().isNumeric().withMessage('Valid amount required'),
  body('atmDailyLimit').optional().isNumeric().withMessage('Valid amount required'),
  body('onlinePaymentsEnabled').optional().isBoolean().withMessage('Boolean value required'),
  body('internationalTransactionsEnabled').optional().isBoolean().withMessage('Boolean value required'),
  body('contactlessEnabled').optional().isBoolean().withMessage('Boolean value required'),
  body('threeDSecureEnabled').optional().isBoolean().withMessage('Boolean value required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const card = await Card.findById(req.params.cardId);

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    if (card.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates = {};
    const allowedFields = [
      'dailySpendLimit', 'atmDailyLimit', 'onlinePaymentsEnabled',
      'internationalTransactionsEnabled', 'contactlessEnabled', 'threeDSecureEnabled'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    Object.assign(card, updates);
    await card.save();

    await createAuditLog(
      req.user.id,
      'CARD_SETTINGS_UPDATED',
      { cardId: card._id, last4: card.last4Digits, changes: updates }
    );

    const cardResponse = await Card.findById(card._id).select('-cardNumber -cvv -pinHash');

    res.json({
      message: 'Card settings updated successfully',
      card: cardResponse
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== SET CARD PIN ==============
router.post('/:cardId/pin', authenticateToken, [
  body('pin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('PIN must be 4 digits'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { pin } = req.body;
    const card = await Card.findById(req.params.cardId);

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    if (card.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    card.pinHash = hashSensitiveData(pin);
    card.hasPin = true;
    await card.save();

    await createAuditLog(
      req.user.id,
      'CARD_PIN_SET',
      { cardId: card._id, last4: card.last4Digits }
    );

    const cardResponse = await Card.findById(card._id).select('-cardNumber -cvv -pinHash');

    res.json({
      message: 'PIN set successfully',
      card: cardResponse
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== LINK CARD TO LOAN ==============
router.post('/:cardId/link-loan', authenticateToken, [
  body('loanId').isMongoId().withMessage('Valid loan ID required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { loanId } = req.body;
    const card = await Card.findById(req.params.cardId);

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    if (card.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (card.cardType !== 'credit') {
      return res.status(400).json({ error: 'Only credit cards can be linked to loans' });
    }

    // Verify loan exists and belongs to user
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    if (loan.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Loan access denied' });
    }

    // Add loan to card's linked loans if not already linked
    if (!card.linkedLoans.includes(loanId)) {
      card.linkedLoans.push(loanId);
      await card.save();
    }

    // Update loan to link card
    if (!loan.linkedCard || loan.linkedCard.toString() !== card._id.toString()) {
      loan.linkedCard = card._id;
      await loan.save();
    }

    await createAuditLog(
      req.user.id,
      'LOAN_LINKED_TO_CARD',
      { cardId: card._id, loanId, last4: card.last4Digits }
    );

    const cardResponse = await Card.findById(card._id).select('-cardNumber -cvv -pinHash');

    res.json({
      message: 'Loan linked to card successfully',
      card: cardResponse
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== REPLACE CARD ==============
router.post('/:cardId/replace', authenticateToken, [
  body('reason').isIn(['lost', 'stolen', 'damaged']).withMessage('Valid reason required'),
  body('cardFormat').optional().isIn(['virtual', 'physical']).withMessage('Valid card format'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reason, cardFormat } = req.body;
    const oldCard = await Card.findById(req.params.cardId);

    if (!oldCard) {
      return res.status(404).json({ error: 'Card not found' });
    }

    if (oldCard.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create new card with same properties
    const newCardNumber = generateCardNumber(oldCard.cardBrand);
    const newLast4 = newCardNumber.slice(-4);
    const newCVV = generateCVV();
    const newExpiryDate = generateExpiryDate();

    const newCard = new Card({
      userId: req.user.id,
      accountId: oldCard.accountId,
      cardType: oldCard.cardType,
      cardFormat: cardFormat || oldCard.cardFormat,
      cardBrand: oldCard.cardBrand,
      cardNumber: hashSensitiveData(newCardNumber),
      cvv: hashSensitiveData(newCVV),
      expiryDate: newExpiryDate,
      cardholderName: oldCard.cardholderName,
      last4Digits: newLast4,
      isPrimary: oldCard.isPrimary,
      isDefault: oldCard.isDefault,
      status: 'active',
      dailySpendLimit: oldCard.dailySpendLimit,
      atmDailyLimit: oldCard.atmDailyLimit,
      replacementOf: oldCard._id,
      spendingResetDate: new Date()
    });

    await newCard.save();

    // Mark old card as replaced
    oldCard.replacedBy = newCard._id;
    oldCard.status = 'cancelled';
    await oldCard.save();

    // Update account
    const account = await Account.findById(oldCard.accountId);
    if (account && account.cards) {
      const index = account.cards.indexOf(oldCard._id);
      if (index > -1) {
        account.cards[index] = newCard._id;
        await account.save();
      }
    }

    await createAuditLog(
      req.user.id,
      'CARD_REPLACED',
      { 
        oldCardId: oldCard._id, 
        newCardId: newCard._id, 
        reason,
        last4: oldCard.last4Digits
      }
    );

    const cardResponse = await Card.findById(newCard._id).select('-cardNumber -cvv -pinHash');

    res.status(201).json({
      message: `Replacement ${cardFormat || oldCard.cardFormat} card created successfully`,
      card: cardResponse,
      cardDetails: {
        cardNumber: newCardNumber,
        cvv: newCVV,
        expiryDate: newExpiryDate,
        note: 'Please save these details securely.'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== GET CARD TRANSACTIONS ==============
router.get('/:cardId/transactions', authenticateToken, async (req, res) => {
  try {
    const card = await Card.findById(req.params.cardId);

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    if (card.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get transactions from account
    const account = await Account.findById(card.accountId);
    if (!account) {
      return res.status(404).json({ error: 'Associated account not found' });
    }

    const transactions = await Transaction.find({
      $or: [
        { fromAccountId: account._id },
        { toAccountId: account._id }
      ],
      transactionType: 'card_purchase' // Or other card-specific transaction types
    })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      message: 'Card transactions retrieved successfully',
      count: transactions.length,
      transactions
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== CANCEL CARD ==============
router.post('/:cardId/cancel', authenticateToken, async (req, res) => {
  try {
    const card = await Card.findById(req.params.cardId);

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    if (card.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (card.status === 'cancelled') {
      return res.status(400).json({ error: 'Card is already cancelled' });
    }

    // If this is a primary card, make another active card primary
    if (card.isPrimary) {
      const otherCard = await Card.findOne({
        userId: req.user.id,
        cardType: card.cardType,
        _id: { $ne: card._id },
        status: 'active'
      });

      if (otherCard) {
        otherCard.isPrimary = true;
        await otherCard.save();
      }
    }

    card.status = 'cancelled';
    await card.save();

    await createAuditLog(
      req.user.id,
      'CARD_CANCELLED',
      { cardId: card._id, last4: card.last4Digits }
    );

    const cardResponse = await Card.findById(card._id).select('-cardNumber -cvv -pinHash');

    res.json({
      message: 'Card cancelled successfully',
      card: cardResponse
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============== ADMIN: GET ALL CARDS (ADMIN ONLY) ==============
router.get('/admin/all-cards', authenticateToken, authorizeRoles(['admin', 'compliance']), async (req, res) => {
  try {
    const { userId, status, cardType } = req.query;
    const filters = {};

    if (userId) filters.userId = userId;
    if (status) filters.status = status;
    if (cardType) filters.cardType = cardType;

    const cards = await Card.find(filters)
      .select('-cardNumber -cvv -pinHash')
      .populate('userId', 'email firstName lastName')
      .populate('accountId', 'accountType currency balance')
      .sort({ createdAt: -1 })
      .limit(500);

    res.json({
      message: 'All cards retrieved',
      count: cards.length,
      cards
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

module.exports = router;
