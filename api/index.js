// Vercel Serverless Function - Bank of the Brave API
// This file enables Express app to run on Vercel

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Create uploads directories if they don't exist
const uploadDirs = [
  path.join(__dirname, '../uploads'),
  path.join(__dirname, '../uploads', 'kyc'),
  path.join(__dirname, '../uploads', 'irs'),
  path.join(__dirname, '../uploads', 'deposits'),
  path.join(__dirname, '../uploads', 'withdrawals')
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Database Connection
if (!mongoose.connection.readyState) {
  const mongodbURI = process.env.MONGODB_URI || 'mongodb+srv://taskly:1234@cluster0.hguzjbh.mongodb.net/?appName=Cluster0';
  mongoose.connect(mongodbURI)
    .then(() => console.log('✓ MongoDB connected'))
    .catch(err => console.log('✗ MongoDB connection error:', err.message));
}

// Routes
app.use('/api/auth', require('../routes/auth'));
app.use('/api/users', require('../routes/users'));
app.use('/api/accounts', require('../routes/accounts'));
app.use('/api/transactions', require('../routes/transactions'));
app.use('/api/admin', require('../routes/admin'));
app.use('/api/kyc', require('../routes/kyc'));
app.use('/api/loans', require('../routes/loans'));
app.use('/api/cards', require('../routes/cards'));
app.use('/api/deposits', require('../routes/deposits'));
app.use('/api/withdrawals', require('../routes/withdrawals'));

// Serve frontend pages (catch-all for SPA)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Server error',
    status: err.status || 500
  });
});

// Export for Vercel
module.exports = app;
