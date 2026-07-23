const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['Offer Letter', 'NOC', 'Experience Letter', 'Custom', 'Agreement'], 
    required: true 
  },
  preparedFor: { 
    type: String, 
    required: true 
  },
  companyName: { 
    type: String, 
    required: true 
  },
  projectScope: { 
    type: String 
  },
  signatory: { 
    type: String 
  },
  date: { 
    type: String 
  },
  items: [
    {
      description: { type: String },
      cost: { type: Number, default: 0 }
    }
  ],
  totalCost: { 
    type: Number, 
    default: 0 
  },
  format: { 
    type: String, 
    enum: ['pdf', 'docx'], 
    default: 'pdf' 
  },
  status: { 
    type: String, 
    enum: ['Draft', 'Sent', 'Signed'], 
    default: 'Draft' 
  },
  generatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: false 
  },
  companyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Company', 
    required: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Document', documentSchema);  