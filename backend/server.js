const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// In-memory array database
let documentsDatabase = [];

// 1. GET ROUTE: Fetch history
app.get('/api/documents', (req, res) => {
  console.log("Fetching documents count:", documentsDatabase.length);
  res.status(200).json(documentsDatabase);
});

// 2. POST ROUTE: Save new document
app.post('/api/documents', (req, res) => {
  console.log("POST /api/documents received body:", req.body);
  
  const { preparedFor, signatory, date, companyName, projectScope, items, totalCost } = req.body;

  const newDocument = {
    _id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    preparedFor: preparedFor || 'N/A',
    signatory: signatory || 'N/A',
    date: date || new Date().toISOString().split('T')[0],
    companyName: companyName || 'N/A',
    projectScope: projectScope || '',
    items: items || [],
    totalCost: totalCost || 0,
    createdAt: new Date().toISOString()
  };

  documentsDatabase.push(newDocument);

  // Return standard success response
  return res.status(201).json({
    success: true,
    message: 'Document saved successfully!',
    document: newDocument
  });
});

// 3. DELETE ROUTE: Remove document by ID
app.delete('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = documentsDatabase.length;
  
  documentsDatabase = documentsDatabase.filter(doc => doc._id !== id && doc.id !== id);

  if (documentsDatabase.length === initialLength) {
    return res.status(404).json({
      success: false,
      message: 'Document not found.'
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Document deleted successfully!'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});   