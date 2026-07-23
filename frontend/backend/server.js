require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Import routes (Ensure path matches your actual project structure)
const documentRoutes = require('./src/routes/documentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Security & CORS Configuration
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));

// Static Files directory
app.use('/exports', express.static(path.join(__dirname, 'exports')));

// Mount Document Routes
app.use('/api/documents', documentRoutes);

// Base Health Check
app.get('/', (req, res) => {
  res.json({ message: 'Corporate Document Generator API is running.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error Stack:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});    