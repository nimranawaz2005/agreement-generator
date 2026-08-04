// models/Document.js
const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  preparedFor: { type: String, required: true },
  clientEmail: { type: String, required: true },
  companyName: { type: String, default: '' },
  projectScope: { type: String, default: '' },
  items: [
    {
      description: String,
      cost: Number,
    }
  ],
  totalCost: { type: Number, required: true },
  signatory: { type: String, default: '' },
  status: { type: String, enum: ['Draft', 'Sent', 'Signed'], default: 'Draft' },
  sentAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema); 