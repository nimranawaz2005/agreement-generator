const express = require('express');
const router = express.Router();
const Document = require('../models/Document'); // Ensure correct model path

// GET ALL DOCUMENTS
router.get('/', async (req, res, next) => {
  try {
    const docs = await Document.find().sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

// CREATE DOCUMENT
router.post('/', async (req, res, next) => {
  try {
    const newDoc = new Document(req.body);
    const savedDoc = await newDoc.save();
    res.status(201).json(savedDoc);
  } catch (err) {
    next(err);
  }
});

// DELETE DOCUMENT
router.delete('/:id', async (req, res, next) => {
  try {
    await Document.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Document deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router; 