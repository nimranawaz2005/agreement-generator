const Document = require('../models/Document');

// Generate and Save Document Record
exports.createDocument = async (req, res) => {
  try {
    const { 
      title, 
      type, 
      preparedFor, 
      companyName, 
      projectScope, 
      signatory, 
      date, 
      items, 
      totalCost, 
      format 
    } = req.body;

    const document = new Document({
      title: title || `Agreement - ${preparedFor}`,
      type: type || 'Agreement',
      preparedFor,
      companyName,
      projectScope,
      signatory,
      date,
      items: items || [],
      totalCost: totalCost || 0,
      format: format || 'pdf',
      generatedBy: req.user ? req.user.id : null,
      companyId: req.user ? req.user.companyId : null,
    });

    await document.save();

    res.status(201).json({ 
      message: 'Document record saved successfully', 
      document 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error saving document record', 
      error: error.message 
    });
  }
};

// Get all documents for the user's company or guest sessions
exports.getDocuments = async (req, res) => {
  try {
    const filter = req.user && req.user.companyId ? { companyId: req.user.companyId } : {};
    const documents = await Document.find(filter).sort({ createdAt: -1 });
    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching documents', 
      error: error.message 
    });
  }
};

// Delete a document
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findByIdAndDelete(id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error deleting document', 
      error: error.message 
    });
  }
};  