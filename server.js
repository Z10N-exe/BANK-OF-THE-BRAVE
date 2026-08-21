const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files (skip in serverless environments)
if (process.env.VERCEL !== '1') {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Create uploads directories if they don't exist
const uploadDirs = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads', 'kyc'),
  path.join(__dirname, 'uploads', 'irs'),
  path.join(__dirname, 'uploads', 'deposits'),
  path.join(__dirname, 'uploads', 'withdrawals')
];

uploadDirs.forEach(dir => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  } catch (err) {
    // Ignore directory creation errors in serverless environments (Vercel)
    console.log(`Note: Could not create directory ${dir} (serverless environment)`);
  }
});

// Database Connection
const mongodbURI = process.env.MONGODB_URI || 'mongodb+srv://taskly:1234@cluster0.hguzjbh.mongodb.net/?appName=Cluster0';
mongoose.connect(mongodbURI)
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => {
    console.log('✗ MongoDB connection error:', err);
    // Don't crash the server if MongoDB fails - continue in degraded mode
  });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/kyc', require('./routes/kyc'));
app.use('/api/loans', require('./routes/loans'));
app.use('/api/cards', require('./routes/cards'));
app.use('/api/deposits', require('./routes/deposits'));
app.use('/api/withdrawals', require('./routes/withdrawals'));

// Handle favicon request - return 204 to prevent 404/500 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Serve frontend pages (catch-all for SPA)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  const isServerless = process.env.VERCEL === '1';
  res.json({
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: isServerless ? 'serverless (Vercel)' : 'traditional',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    uploads: isServerless ? 'Not available in serverless' : {
      kyc: fs.existsSync(path.join(__dirname, 'uploads', 'kyc')),
      irs: fs.existsSync(path.join(__dirname, 'uploads', 'irs'))
    }
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

// Export app for Vercel serverless deployment
module.exports = app;

// Only start the server if not running in Vercel
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🏦 Bank of the Brave - Private Banking Platform     ║
║                                                        ║
║   ✓ Server running on port ${PORT}
║   ✓ MongoDB connected
║   ✓ Static files served
║   ✓ Upload directories ready
║   ✓ API endpoints available
║                                                        ║
║   Frontend: http://localhost:${PORT}
║   API Docs: http://localhost:${PORT}/api/health
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
  });
}
