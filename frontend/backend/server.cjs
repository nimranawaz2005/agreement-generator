const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// Load environment variables relative to server.js
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();

// Global crash protection for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception Caught:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsers with high payload limits for large PDF base64 attachments
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Mongo Model setup with fallback inline schema
let Document;
try {
  Document = require('./models/Document');
} catch (e) {
  const documentSchema = new mongoose.Schema({
    id: String,
    title: String,
    preparedFor: String,
    signatory: String,
    companyName: String,
    projectScope: String,
    clientEmail: String,
    totalCost: Number,
    currency: { type: String, default: 'USD ($)' },
    items: Array,
    status: { type: String, default: 'Draft' },
    createdAt: { type: Date, default: Date.now }
  });
  Document = mongoose.models.Document || mongoose.model('Document', documentSchema);
}

// Connect to MongoDB with graceful fallback logging
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/corporate_doc_gen';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.log('⚠️ Operating without database (Fallback Mode):', err.message));

// Inline HTML Template for Email Notifications
const getInlineEmailHTML = (documentTitle, preparedFor, totalCost) => `
  <div style="font-family: Arial, sans-serif; padding: 24px; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
    <h2 style="color: #2563eb; margin-top: 0;">Your Document is Ready</h2>
    <p>Hello,</p>
    <p>Please find attached the document prepared for <strong>${preparedFor || 'you'}</strong>.</p>
    
    <div style="background-color: #f8fafc; padding: 16px; border-left: 4px solid #2563eb; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px;"><strong>Document:</strong> ${documentTitle || 'Agreement'}</p>
      <p style="margin: 8px 0 0 0; font-size: 14px;"><strong>Total Amount:</strong> $${(totalCost || 0).toLocaleString()}</p>
    </div>

    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
    <p style="font-size: 12px; color: #94a3b8; margin: 0;">Sent via Smart Document Generator.</p>
  </div>
`;

// Health check endpoint
app.get('/', (req, res) => {
  res.send('🚀 Backend server is online and operational!');
});

// GET /api/documents — Fetch document history
app.get('/api/documents', async (req, res) => {
  try {
    const docs = await Document.find().sort({ createdAt: -1 });
    return res.status(200).json(docs);
  } catch (err) {
    console.error('⚠️ Database fetch failed, returning empty array:', err.message);
    return res.status(200).json([]);
  }
});

// POST /api/documents — Save new document payload
app.post('/api/documents', async (req, res) => {
  try {
    const newDoc = await Document.create(req.body);
    return res.status(201).json(newDoc);
  } catch (err) {
    console.error('❌ Error creating document:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/documents/:id — Delete document by ID or Mongo _id
app.delete('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conditions = [{ id: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      conditions.push({ _id: id });
    }

    const deletedDoc = await Document.findOneAndDelete({ $or: conditions });

    if (!deletedDoc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    return res.status(200).json({ message: 'Deleted successfully', id });
  } catch (err) {
    console.error('❌ Error deleting document:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/documents/:id/status — Update Document Status (Draft, Sent, Signed, Paid)
app.put('/api/documents/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const conditions = [{ id: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      conditions.push({ _id: id });
    }

    const updatedDoc = await Document.findOneAndUpdate(
      { $or: conditions },
      { status: status },
      { new: true }
    );

    if (!updatedDoc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    return res.status(200).json(updatedDoc);
  } catch (err) {
    console.error('❌ Error updating status:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/documents/send-email — Handle PDF delivery via SMTP/Gmail
app.post('/api/documents/send-email', async (req, res) => {
  console.log('📩 Incoming request to send email to:', req.body?.recipientEmail);

  try {
    const { recipientEmail, documentTitle, preparedFor, totalCost, pdfBase64, documentId } = req.body || {};

    if (!recipientEmail) {
      return res.status(400).json({ error: 'Recipient email is required.' });
    }

    // SMTP Credential loading from environment variables
    const senderEmail = process.env.EMAIL_USER;
    const senderPass = process.env.EMAIL_PASS;

    if (!senderEmail || !senderPass) {
      return res.status(500).json({ error: 'Email service unconfigured. Missing EMAIL_USER or EMAIL_PASS in .env file.' });
    }

    // Direct SMTP configuration for Google Gmail
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL
      auth: {
        user: senderEmail,
        pass: senderPass,
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000
    });

    let attachments = [];
    if (pdfBase64) {
      const cleanBase64 = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;
      attachments.push({
        filename: `${(documentTitle || 'Agreement').replace(/\s+/g, '_')}.pdf`,
        content: cleanBase64,
        encoding: 'base64',
      });
    }

    const mailOptions = {
      from: `"Smart Document Generator" <${senderEmail}>`,
      to: recipientEmail,
      subject: `Document: ${documentTitle || 'Agreement'}`,
      html: getInlineEmailHTML(documentTitle, preparedFor, totalCost),
      attachments: attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully! ID: ${info.messageId}`);

    // Optionally update document status to 'Sent' if documentId was passed
    if (documentId) {
      const conditions = [{ id: documentId }];
      if (mongoose.Types.ObjectId.isValid(documentId)) {
        conditions.push({ _id: documentId });
      }
      await Document.findOneAndUpdate({ $or: conditions }, { status: 'Sent' });
    }

    return res.status(200).json({ message: 'Email sent successfully!', messageId: info.messageId });

  } catch (error) {
    console.error('❌ Nodemailer Send Error:', error.message);
    return res.status(500).json({ error: `Email Error: ${error.message}` });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`=================================`);
});  