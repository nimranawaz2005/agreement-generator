import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import SignatureCanvas from 'react-signature-canvas';
import { 
  FileText, Plus, Trash2, Download, Layers, 
  Settings2, UserCheck, Mail, Send, Loader2, Copy, X, 
  Upload, FolderOpen, RotateCcw
} from 'lucide-react';

export default function CreateDocument() {
  const [formData, setFormData] = useState({
    preparedFor: 'Acme Corp',
    clientEmail: 'client@acme.com',
    companyName: 'Your Agency Ltd',
    projectScope: 'Full-stack Web Application Development and Cloud Architecture Setup.',
    signatory: 'John Doe',
    date: new Date().toISOString().split('T')[0]
  });

  const [refId] = useState(() => Math.floor(100000 + Math.random() * 900000));
  const [brandColor, setBrandColor] = useState('#2563eb');
  const [watermark, setWatermark] = useState('CONFIDENTIAL');
  const [showWatermark, setShowWatermark] = useState(true);
  const [logoUrl, setLogoUrl] = useState(null); 

  const [items, setItems] = useState([
    { description: 'UI/UX Design Phase', cost: 1200 },
    { description: 'Backend API Development', cost: 2500 }
  ]);

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);

  const documentRef = useRef(null);
  const sigCanvasRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      } else {
        const saved = localStorage.getItem('document_history');
        if (saved) setHistory(JSON.parse(saved));
      }
    } catch (e) {
      const saved = localStorage.getItem('document_history');
      if (saved) setHistory(JSON.parse(saved));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      if (field === 'cost') {
        newItems[index][field] = value === '' ? 0 : Math.max(0, Number(value));
      } else {
        newItems[index][field] = value;
      }
      return newItems;
    });
  };

  const addItem = () => {
    setItems(prev => [...prev, { description: '', cost: 0 }]);
  };

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearLogo = () => setLogoUrl(null);

  const clearSignature = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
      setSignatureDataUrl(null);
    }
  };

  const saveSignature = () => {
    try {
      if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
        const canvas = sigCanvasRef.current.getCanvas();
        const dataUrl = canvas.toDataURL('image/png');
        setSignatureDataUrl(dataUrl);
        return dataUrl;
      }
    } catch (err) {
      console.error("Signature save error:", err);
    }
    return null;
  };

  const totalCost = items.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!documentRef.current) return;

    setLoading(true);

    try {
      let currentSig = signatureDataUrl;
      if (!currentSig && sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
        currentSig = saveSignature();
      }

      const element = documentRef.current;

      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      const cleanName = (formData.preparedFor || 'Document').trim().replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${cleanName}_Agreement.pdf`;

      pdf.save(fileName);

      const payload = {
        title: `Agreement - ${formData.preparedFor || 'Untitled'}`,
        type: 'Agreement',
        preparedFor: formData.preparedFor,
        clientEmail: formData.clientEmail,
        companyName: formData.companyName,
        projectScope: formData.projectScope,
        signatory: formData.signatory,
        date: formData.date,
        items: items,
        totalCost: totalCost,
        format: 'pdf'
      };

      try {
        const response = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) fetchHistory();
      } catch (netErr) {
        const localEntry = { ...payload, _id: Date.now().toString(), createdAt: new Date().toISOString() };
        setHistory(prev => {
          const updated = [localEntry, ...prev];
          localStorage.setItem('document_history', JSON.stringify(updated));
          return updated;
        });
      }

    } catch (error) {
      console.error("Export Error Detail:", error);
      alert(`PDF Generation Failed: ${error.message || 'Unknown Error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDocument = (doc) => {
    setFormData({
      preparedFor: doc.preparedFor || '',
      clientEmail: doc.clientEmail || 'client@acme.com',
      companyName: doc.companyName || '',
      projectScope: doc.projectScope || '',
      signatory: doc.signatory || '',
      date: doc.date ? doc.date.substring(0, 10) : new Date().toISOString().split('T')[0]
    });
    if (doc.items && Array.isArray(doc.items)) {
      setItems(doc.items);
    }
  };

  const handleDeleteDocument = async (id) => {
    try {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error("Delete Error:", error);
    } finally {
      setHistory(prev => {
        const updated = prev.filter(doc => (doc._id || doc.id) !== id);
        localStorage.setItem('document_history', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleSendEmailSubmit = (e) => {
    e.preventDefault();
    setSendingEmail(true);
    setTimeout(() => {
      setSendingEmail(false);
      setEmailSentSuccess(true);
      setTimeout(() => {
        setEmailSentSuccess(false);
        setIsEmailModalOpen(false);
      }, 2000);
    }, 1500);
  };

  const handleCopyShareLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 flex flex-col items-center font-sans">
      
      {/* HEADER BAR */}
      <div className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <FileText className="text-blue-500 w-8 h-8" /> Smart Agreement Generator
          </h1>
          <p className="text-slate-400 text-sm mt-1">Design, customize, sign, and export production-ready documents.</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsEmailModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <Mail className="w-4 h-4 text-blue-400" /> Share Document
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Generate & Download PDF
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Styling Options */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-blue-400" /> Styling & Logo Upload
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Brand Color</label>
                <input 
                  type="color" 
                  value={brandColor} 
                  onChange={(e) => setBrandColor(e.target.value)} 
                  className="w-full h-9 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer p-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Watermark Text</label>
                <input 
                  type="text" 
                  value={watermark} 
                  onChange={(e) => setWatermark(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg p-2 text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Brand Logo Image</label>
              {logoUrl ? (
                <div className="flex items-center justify-between bg-slate-950 p-2 border border-slate-800 rounded-lg">
                  <img src={logoUrl} alt="Uploaded Logo" className="h-8 object-contain" />
                  <button type="button" onClick={clearLogo} className="text-xs text-red-400 hover:text-red-300">
                    Remove Logo
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 w-full p-2.5 bg-slate-950 border border-dashed border-slate-800 hover:border-blue-500 rounded-lg cursor-pointer text-xs text-slate-400 transition-colors">
                  <Upload className="w-4 h-4 text-blue-400" />
                  <span>Upload Logo (PNG, JPG)</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="watermarkToggle" 
                checked={showWatermark} 
                onChange={(e) => setShowWatermark(e.target.checked)} 
                className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0"
              />
              <label htmlFor="watermarkToggle" className="text-xs text-slate-400 cursor-pointer">Show Watermark Overlay</label>
            </div>
          </div>

          {/* Form Fields */}
          <form onSubmit={(e) => e.preventDefault()} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" /> Document Details
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Prepared For</label>
                <input 
                  type="text" 
                  name="preparedFor" 
                  value={formData.preparedFor} 
                  onChange={handleInputChange} 
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Your Company Name</label>
                <input 
                  type="text" 
                  name="companyName" 
                  value={formData.companyName} 
                  onChange={handleInputChange} 
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Project Scope / Summary</label>
              <textarea 
                name="projectScope" 
                rows="3" 
                value={formData.projectScope} 
                onChange={handleInputChange} 
                className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Line Items */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-slate-400">Deliverables / Line Items</label>
                <button 
                  type="button" 
                  onClick={addItem} 
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                >
                  <Plus className="w-3 h-3" /> Add Row
                </button>
              </div>

              {items.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2 items-center">
                  <input 
                    type="text" 
                    placeholder="Description" 
                    value={item.description} 
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)} 
                    className="flex-1 bg-slate-950 border border-slate-800 text-xs rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  <input 
                    type="number" 
                    placeholder="Cost" 
                    value={item.cost === 0 ? '' : item.cost} 
                    onChange={(e) => handleItemChange(index, 'cost', e.target.value)} 
                    className="w-24 bg-slate-950 border border-slate-800 text-xs rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  <button 
                    type="button" 
                    onClick={() => removeItem(index)} 
                    className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Signatory Name</label>
                <input 
                  type="text" 
                  name="signatory" 
                  value={formData.signatory} 
                  onChange={handleInputChange} 
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Date</label>
                <input 
                  type="date" 
                  name="date" 
                  value={formData.date} 
                  onChange={handleInputChange} 
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Signature Canvas */}
            <div className="pt-2 border-t border-slate-800">
              <label className="text-xs text-slate-400 block mb-1">Electronic Signature Canvas</label>
              <div className="border border-slate-800 rounded-lg bg-white overflow-hidden h-28">
                <SignatureCanvas 
                  ref={sigCanvasRef}
                  penColor="#000000"
                  canvasProps={{ className: 'w-full h-full sigCanvas' }}
                  onEnd={saveSignature}
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button 
                  type="button" 
                  onClick={saveSignature} 
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5 text-green-400" /> Apply Signature
                </button>
                <button 
                  type="button" 
                  onClick={clearSignature} 
                  className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

          </form>

          {/* Document History Registry */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-blue-400" /> Saved Registry ({history.length})
            </h2>

            {history.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No saved documents yet.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {history.map((doc) => (
                  <div key={doc._id || doc.id || Math.random()} className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                    <div>
                      <p className="font-semibold text-slate-200">{doc.title || `Agreement - ${doc.preparedFor}`}</p>
                      <p className="text-slate-500 text-[10px]">${(doc.totalCost || 0).toLocaleString()} • {doc.preparedFor}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        type="button" 
                        onClick={() => handleLoadDocument(doc)} 
                        className="px-2 py-1 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded flex items-center gap-1 text-[11px] transition-colors"
                        title="Load into Form"
                      >
                        <RotateCcw className="w-3 h-3" /> Load
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleDeleteDocument(doc._id || doc.id)} 
                        className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: DOCUMENT PREVIEW */}
        <div className="lg:col-span-7 flex flex-col items-center w-full">
          <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">
            Live Print Preview (A4 Dimensions)
          </div>

          <div 
            ref={documentRef} 
            className="w-full rounded-lg shadow-2xl p-10 relative overflow-hidden flex flex-col justify-between"
            style={{ 
              minHeight: '842px', 
              maxWidth: '595px', 
              fontFamily: 'Inter, sans-serif',
              backgroundColor: '#ffffff',
              color: '#0f172a'
            }}
          >
            {/* Watermark Overlay */}
            {showWatermark && watermark && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-45deg)',
                fontSize: '52px',
                fontWeight: '900',
                color: 'rgba(0, 0, 0, 0.04)',
                userSelect: 'none',
                pointerEvents: 'none',
                whiteSpace: 'nowrap'
              }}>
                {watermark}
              </div>
            )}

            <div>
              {/* Header */}
              <div style={{ borderBottom: `3px solid ${brandColor}`, paddingBottom: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
                      SERVICES AGREEMENT
                    </h1>
                    <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      Ref ID: #{refId}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="Company Logo" style={{ maxHeight: '45px', maxWidth: '140px', objectFit: 'contain', marginBottom: '6px' }} />
                    ) : (
                      <p style={{ fontSize: '14px', fontWeight: 'bold', color: brandColor, margin: 0 }}>
                        {formData.companyName || 'Company Name'}
                      </p>
                    )}
                    <p style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                      Date: {formData.date}
                    </p>
                  </div>
                </div>
              </div>

              {/* Client Info */}
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', marginBottom: '24px', borderLeft: `4px solid ${brandColor}` }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold', display: 'block' }}>
                  PREPARED FOR
                </span>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', margin: '2px 0 0 0' }}>
                  {formData.preparedFor || 'Client Name'}
                </p>
              </div>

              {/* Project Scope */}
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: brandColor, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                  1.0 Project Scope & Deliverables
                </span>
                <p style={{ fontSize: '12px', color: '#334155', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-line' }}>
                  {formData.projectScope || 'No project scope specified.'}
                </p>
              </div>

              {/* Cost Table */}
              <div style={{ marginBottom: '32px' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: brandColor, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                  2.0 Financial Summary
                </span>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ padding: '8px', textAlign: 'left', color: '#475569' }}>Description</th>
                      <th style={{ padding: '8px', textAlign: 'right', color: '#475569', width: '100px' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px', color: '#334155' }}>{item.description || 'Deliverable description'}</td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#334155' }}>${Number(item.cost || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: `2px solid ${brandColor}`, fontWeight: 'bold' }}>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#0f172a' }}>Total Amount:</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: brandColor }}>${totalCost.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signature Block */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <div>
                <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Client Representative</p>
                <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', margin: '4px 0 0 0' }}>{formData.preparedFor || '__________________'}</p>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                {signatureDataUrl ? (
                  <img src={signatureDataUrl} alt="Signature" style={{ maxHeight: '45px', objectFit: 'contain', marginBottom: '4px' }} />
                ) : (
                  <div style={{ height: '45px' }} />
                )}
                <div style={{ borderTop: '1px solid #94a3b8', width: '160px', marginTop: '4px' }} />
                <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0 0' }}>Authorized Signatory: {formData.signatory || 'N/A'}</p>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* SHARE / EMAIL MODAL */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              type="button"
              onClick={() => setIsEmailModalOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold flex items-center gap-2 mb-2 text-slate-100">
              <Mail className="w-5 h-5 text-blue-400" /> Share Document
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Send this document directly to <span className="text-slate-200 font-semibold">{formData.clientEmail || 'the recipient'}</span>.
            </p>

            <form onSubmit={handleSendEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Recipient Email</label>
                <input 
                  type="email" 
                  required 
                  value={formData.clientEmail} 
                  onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500" 
                  placeholder="client@company.com" 
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedLink ? 'Link Copied!' : 'Copy Link'}
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-2.5 rounded-xl font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {sendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {emailSentSuccess ? 'Sent Successfully!' : 'Send Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}   