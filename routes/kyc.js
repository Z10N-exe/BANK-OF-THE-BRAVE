const express = require('express');
const router = express.Router();
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Ensure upload directories exist
const uploadDirs = [
  path.join(__dirname, '../uploads/kyc'),
  path.join(__dirname, '../uploads/irs')
];

uploadDirs.forEach(dir => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    // Ignore directory creation errors in serverless environments
    console.log(`Note: Could not create directory ${dir} (serverless environment)`);
  }
});

// Multer setup for KYC file uploads
const kycDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/kyc');
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    } catch (err) {
      // If we can't create the directory (e.g., in Vercel), fallback to OS temp dir
      const os = require('os');
      cb(null, os.tmpdir());
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const kycUpload = multer({
  storage: process.env.VERCEL === '1' ? multer.memoryStorage() : kycDiskStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF allowed.'));
    }
  }
});

// Submit KYC
router.post('/submit', authenticateToken, kycUpload.fields([
  { name: 'idDocument', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]), [
  body('ssn').notEmpty().withMessage('SSN required'),
  body('idType').isIn(['drivers_license', 'passport', 'national_id']).withMessage('Valid ID type required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth required'),
  body('address').notEmpty().withMessage('Address required'),
  body('city').notEmpty().withMessage('City required'),
  body('state').notEmpty().withMessage('State required'),
  body('zipCode').notEmpty().withMessage('Zip code required'),
  body('country').notEmpty().withMessage('Country required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.files || !req.files.idDocument || !req.files.selfie) {
      return res.status(400).json({ error: 'ID document and selfie required' });
    }

    const { ssn, idType, dateOfBirth, address, city, state, zipCode, country } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const idDocumentFile = req.files.idDocument[0];
    const selfieFile = req.files.selfie[0];
    const idDocPath = process.env.VERCEL === '1'
      ? `data:${idDocumentFile.mimetype};base64,${idDocumentFile.buffer.toString('base64')}`
      : `/uploads/kyc/${path.basename(idDocumentFile.filename)}`;
    const selfiePath = process.env.VERCEL === '1'
      ? `data:${selfieFile.mimetype};base64,${selfieFile.buffer.toString('base64')}`
      : `/uploads/kyc/${path.basename(selfieFile.filename)}`;

    // Update KYC data
    user.kyc = {
      ssn,
      idDocument: idDocPath,
      idDocumentData: null,
      idType,
      selfieUrl: selfiePath,
      selfieData: null,
      dateOfBirth: new Date(dateOfBirth),
      address,
      city,
      state,
      zipCode,
      country,
    };

    user.kycStatus = 'pending';
    await user.save();

    console.log(`✓ KYC submitted for user ${req.user.id}`);
    console.log(`  - ID Document: ${idDocPath}`);
    console.log(`  - Selfie: ${selfiePath}`);

    res.json({
      message: 'KYC submitted for verification',
      kycStatus: user.kycStatus,
      files: {
        idDocument: idDocPath,
        selfie: selfiePath
      }
    });
  } catch (error) {
    console.error('KYC submission error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Get KYC Status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      kycStatus: user.kycStatus,
      accountStatus: user.accountStatus,
      identityVerified: user.identityVerified,
      kyc: user.kyc ? {
        ssn: user.kyc.ssn ? '***-**-' + user.kyc.ssn.slice(-4) : null,
        idType: user.kyc.idType,
        idDocument: user.kyc.idDocument,
        selfie: user.kyc.selfieUrl,
        verificationDate: user.kyc.verificationDate,
        address: user.kyc.address,
        city: user.kyc.city,
        state: user.kyc.state
      } : null
    });
  } catch (error) {
    console.error('KYC status error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Admin view KYC documents
router.get('/admin/documents/:userId', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const isHardcodedAdmin = req.user.isHardcodedAdmin === true;
    const adminUser = isHardcodedAdmin ? null : await User.findById(req.user.id);
    if (!isHardcodedAdmin && (!adminUser || !['admin', 'compliance'].includes(adminUser.role))) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const user = await User.findById(req.params.userId);
    if (!user || !user.kyc) {
      return res.status(404).json({ error: 'KYC documents not found' });
    }

    res.json({
      userId: user._id,
      userName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      kycStatus: user.kycStatus,
      kyc: {
        ssn: user.kyc.ssn,
        idType: user.kyc.idType,
        idDocument: user.kyc.idDocument,
        selfie: user.kyc.selfieUrl,
        address: user.kyc.address,
        city: user.kyc.city,
        state: user.kyc.state,
        zipCode: user.kyc.zipCode,
        country: user.kyc.country,
        dateOfBirth: user.kyc.dateOfBirth,
        verificationDate: user.kyc.verificationDate
      }
    });
  } catch (error) {
    console.error('KYC documents error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

module.exports = router;
