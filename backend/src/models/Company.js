const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  logoUrl: { 
    type: String,
    default: '' 
  },       
  letterheadUrl: { 
    type: String,
    default: '' 
  }, 
  address: { 
    type: String,
    default: '' 
  },
  contactEmail: { 
    type: String,
    default: '' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);