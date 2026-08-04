const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// Guarantee .env is loaded relative to server.cjs
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
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type']
}));

// Body Parsers with high payload limits for PDF attachments
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Mongo Model setup
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
    items: Array,
    status: { type: String, default: 'Draft' },
    createdAt: { type: Date, default: Date.now }
  });
  Document = mongoose.models.Document || mongoose.model('Document', documentSchema);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/corporate_doc_gen')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.log('⚠️ Operating without MongoDB database:', err.message));

// Inline HTML Template for Email
const getInlineEmailHTML = (documentTitle, preparedFor, totalCost) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    <h2 style="color: #2563eb;">Your Agreement is Ready</h2>
    <p>Hello,</p>
    <p>Please find attached the document prepared for <strong>${preparedFor || 'you'}</strong>.</p>
    <p><strong>Total Amount:</strong> $${(totalCost || 0).toLocaleString()}</p>
    <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;" />
    <p style="font-size: 12px; color: #777;">Sent via Smart Document Generator.</p>
  </div>
`;

// Health check endpoint
app.get('/', (req, res) => {
  res.send('🚀 Backend server is online and running!');
});

// GET All Documents
app.get('/api/documents', async (req, res) => {
  try {
    const docs = await Document.find().sort({ createdAt: -1 });
    return res.json(docs);
  } catch (err) {
    return res.json([]);
  }
});

// POST Save Document
app.post('/api/documents', async (req, res) => {
  try {
    const newDoc = await Document.create(req.body);
    return res.status(201).json(newDoc);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE Document by ID or _id
app.delete('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { id: id }] }
      : { id: id };

    const deletedDoc = await Document.findOneAndDelete(query);

    if (!deletedDoc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    return res.json({ message: 'Deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// UPDATE Document Status (Draft, Sent, Signed, Paid)
app.put('/api/documents/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { id: id }] }
      : { id: id };

    const updatedDoc = await Document.findOneAndUpdate(
      query,
      { status: status },
      { new: true }
    );

    if (!updatedDoc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    return res.json(updatedDoc);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// SEND EMAIL ENDPOINT
app.post('/api/documents/send-email', async (req, res) => {
  console.log('📩 Incoming request to send email to:', req.body?.recipientEmail);

  try {
    const { recipientEmail, documentTitle, preparedFor, totalCost, pdfBase64 } = req.body || {};

    if (!recipientEmail) {
      return res.status(400).json({ error: 'Recipient email is required.' });
    }

    // Set fallback credentials here if env isn't loading properly
    const senderEmail = process.env.EMAIL_USER || 'nimranawaz2005@gmail.com';
    const senderPass = process.env.EMAIL_PASS || 'gfhoeaqdqudwoexq';

    // Direct SMTP configuration for enhanced network stability
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
      from: `"Document Generator" <${senderEmail}>`,
      to: recipientEmail,
      subject: `Document: ${documentTitle || 'Agreement'}`,
      html: getInlineEmailHTML(documentTitle, preparedFor, totalCost),
      attachments: attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully! ID: ${info.messageId}`);
    return res.status(200).json({ message: 'Email sent successfully!' });

  } catch (error) {
    console.error('❌ Nodemailer Send Error:', error.message);
    return res.status(500).json({ error: `Gmail Error: ${error.message}` });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`=================================`);
});   