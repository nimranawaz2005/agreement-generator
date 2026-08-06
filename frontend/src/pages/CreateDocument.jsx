import React, { useState, useRef, useEffect, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import SignatureCanvas from 'react-signature-canvas';
import { 
  FileText, Plus, Trash2, Download, Layers, 
  Settings2, UserCheck, Mail, Send, Loader2, Copy, X, 
  Upload, FolderOpen, RotateCcw, LayoutTemplate, BookmarkPlus
} from 'lucide-react';

// Preset Templates Library Definition
const PRESET_TEMPLATES = [
  {
    id: 'web_dev',
    name: 'Full-Stack Web Development Agreement',
    scope: 'Full-stack web application development including architecture design, REST API implementation, frontend React integration, and cloud deployment on AWS/Vercel.',
    items: [
      { description: 'Phase 1: Architecture & UI/UX Wireframing', cost: 1500 },
      { description: 'Phase 2: Frontend & Backend Development', cost: 3500 },
      { description: 'Phase 3: Testing, QA & Cloud Deployment', cost: 1000 }
    ]
  },
  {
    id: 'design_retainer',
    name: 'Monthly UI/UX Design Retainer',
    scope: 'Ongoing monthly product design services, user research, wireframing, component design system maintenance, and interactive Figma prototyping.',
    items: [
      { description: 'Monthly Design Retainer Fee (40 Hours/mo)', cost: 2400 },
      { description: 'Design System Documentation & Asset Handoff', cost: 600 }
    ]
  },
  {
    id: 'seo_marketing',
    name: 'Digital Marketing & SEO Proposal',
    scope: 'Comprehensive technical SEO audit, keyword strategy development, content optimization, on-page SEO tweaks, and monthly performance report analytics.',
    items: [
      { description: 'Technical Site Audit & Keyword Strategy', cost: 800 },
      { description: 'Monthly Content Optimization & Link Building', cost: 1200 }
    ]
  },
  {
    id: 'blank',
    name: 'Blank Document',
    scope: '',
    items: [{ description: '', cost: 0 }]
  }
];

export default function CreateDocument() {
  const [formData, setFormData] = useState({
    preparedFor: 'Acme Corp',
    clientEmail: 'client@acme.com',
    companyName: 'Your Agency Ltd',
    projectScope: 'Full-stack Web Application Development and Cloud Architecture Setup.',
    signatory: 'John Doe',
    date: new Date().toISOString().split('T')[0],
    currency: 'USD ($)',
    taxRate: 0,
    discount: 0
  });

  const [refId] = useState(() => Math.floor(100000 + Math.random() * 900000));
  const [brandColor, setBrandColor] = useState('#2563eb');
  const [watermark, setWatermark] = useState('CONFIDENTIAL');
  const [showWatermark, setShowWatermark] = useState(true);
  const [logoUrl, setLogoUrl] = useState(null); 

  // Template Library State
  const [templates, setTemplates] = useState(PRESET_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState('web_dev');

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
    const savedSettings = localStorage.getItem('app_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setFormData((prev) => ({
          ...prev,
          companyName: parsed.companyName || prev.companyName,
          signatory: parsed.signatoryName || prev.signatory,
          currency: parsed.currency || prev.currency,
        }));
        if (parsed.defaultBrandColor) setBrandColor(parsed.defaultBrandColor);
        if (parsed.defaultWatermark) setWatermark(parsed.defaultWatermark);
      } catch (error) {
        console.error("Error reading saved settings:", error);
      }
    }

    const savedCustomTemplates = localStorage.getItem('custom_templates');
    if (savedCustomTemplates) {
      try {
        const parsedTemplates = JSON.parse(savedCustomTemplates);
        if (Array.isArray(parsedTemplates)) {
          setTemplates([...PRESET_TEMPLATES, ...parsedTemplates]);
        }
      } catch (e) {
        console.error("Error loading custom templates:", e);
      }
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/documents');
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
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSelectTemplate = (templateId) => {
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setFormData((prev) => ({
        ...prev,
        projectScope: template.scope
      }));
      setItems(template.items.map(item => ({ ...item })));
    }
  };

  const handleSaveAsTemplate = () => {
    const templateName = prompt('Enter a name for this new template:');
    if (!templateName) return;

    const newTemplate = {
      id: `custom_${Date.now()}`,
      name: templateName,
      scope: formData.projectScope,
      items: items.map(i => ({ ...i }))
    };

    let existingCustom = [];
    try {
      existingCustom = JSON.parse(localStorage.getItem('custom_templates') || '[]');
      if (!Array.isArray(existingCustom)) existingCustom = [];
    } catch (e) {
      existingCustom = [];
    }

    const updatedCustom = [...existingCustom, newTemplate];
    
    localStorage.setItem('custom_templates', JSON.stringify(updatedCustom));
    setTemplates([...PRESET_TEMPLATES, ...updatedCustom]);
    setSelectedTemplateId(newTemplate.id);
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? (value === '' ? 0 : Math.max(0, Number(value))) : value 
    }));
  };

  const handleItemChange = (index, field, value) => {
    setItems(prevItems => 
      prevItems.map((item, idx) => {
        if (idx === index) {
          return {
            ...item,
            [field]: field === 'cost' ? (value === '' ? 0 : Math.max(0, Number(value))) : value
          };
        }
        return item;
      })
    );
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
    if (sigCanvasRef.current && typeof sigCanvasRef.current.clear === 'function') {
      sigCanvasRef.current.clear();
      setSignatureDataUrl(null);
    }
  };

  const saveSignature = () => {
    try {
      if (
        sigCanvasRef.current && 
        typeof sigCanvasRef.current.isEmpty === 'function' && 
        !sigCanvasRef.current.isEmpty()
      ) {
        const canvas = sigCanvasRef.current.getCanvas();
        if (canvas) {
          const dataUrl = canvas.toDataURL('image/png');
          setSignatureDataUrl(dataUrl);
          return dataUrl;
        }
      }
    } catch (err) {
      console.error("Signature save error:", err);
    }
    return null;
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  const discountAmount = Number(formData.discount) || 0;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * (Number(formData.taxRate) || 0)) / 100;
  const totalCost = taxableAmount + taxAmount;

  const generatePdfInstance = async () => {
    if (!documentRef.current) return null;

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
    const pdfPageHeight = pdf.internal.pageSize.getHeight();
    const renderedImgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = renderedImgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, renderedImgHeight);
    heightLeft -= pdfPageHeight;

    while (heightLeft > 0) {
      position = heightLeft - renderedImgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, renderedImgHeight);
      heightLeft -= pdfPageHeight;
    }

    return pdf;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!documentRef.current) return;

    setLoading(true);

    try {
      if (!signatureDataUrl) {
        saveSignature();
      }

      const pdf = await generatePdfInstance();
      if (!pdf) return;

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
        subtotal: subtotal,
        discount: discountAmount,
        taxRate: formData.taxRate,
        taxAmount: taxAmount,
        totalCost: totalCost,
        format: 'pdf'
      };

      try {
        const response = await fetch('http://localhost:5000/api/documents', {
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
      date: doc.date ? doc.date.substring(0, 10) : new Date().toISOString().split('T')[0],
      currency: doc.currency || 'USD ($)',
      taxRate: doc.taxRate || 0,
      discount: doc.discount || 0
    });
    if (doc.items && Array.isArray(doc.items)) {
      setItems(doc.items);
    }
  };  

  const handleDeleteDocument = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/documents/${id}`, { method: 'DELETE' });
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

          {/* TEMPLATE LIBRARY */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4 text-blue-400" /> Template Library
              </h2>
              <button
                type="button"
                onClick={handleSaveAsTemplate}
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
                title="Save current form layout as template"
              >
                <BookmarkPlus className="w-3.5 h-3.5" /> Save Current as Template
              </button>
            </div>

            <select
              value={selectedTemplateId}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {templates.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.name}
                </option>
              ))}
            </select>
          </div>
          
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
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
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

            {/* Financial Calculations (Tax & Discount) */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Discount ($)</label>
                <input 
                  type="number" 
                  name="discount" 
                  value={formData.discount === 0 ? '' : formData.discount} 
                  onChange={handleInputChange} 
                  placeholder="0"
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Tax Rate (%)</label>
                <input 
                  type="number" 
                  name="taxRate" 
                  value={formData.taxRate === 0 ? '' : formData.taxRate} 
                  onChange={handleInputChange} 
                  placeholder="0"
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
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
                  canvasProps={{ width: 400, height: 112, className: 'sigCanvas' }}
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

              {/* Document Body Details */}
              <div style={{ marginBottom: '24px', fontSize: '12px' }}>
                <p><strong>Prepared For:</strong> {formData.preparedFor}</p>
                <p style={{ marginTop: '8px' }}><strong>Scope of Work:</strong></p>
                <p style={{ color: '#475569', marginTop: '4px' }}>{formData.projectScope}</p>
              </div>

              {/* Line Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '24px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '8px 0' }}>Description</th>
                    <th style={{ padding: '8px 0', textAlign: 'right' }}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 0' }}>{item.description}</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>${(Number(item.cost) || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Financial Totals */}
              <div style={{ textAlign: 'right', fontSize: '12px', marginBottom: '24px' }}>
                <p>Subtotal: ${subtotal.toLocaleString()}</p>
                {discountAmount > 0 && <p>Discount: -${discountAmount.toLocaleString()}</p>}
                {taxAmount > 0 && <p>Tax ({formData.taxRate}%): ${taxAmount.toLocaleString()}</p>}
                <p style={{ fontWeight: 'bold', fontSize: '14px', color: brandColor, marginTop: '4px' }}>
                  Total: ${totalCost.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Signature Area */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: 'bold' }}>Signatory: {formData.signatory}</p>
              {signatureDataUrl && (
                <img src={signatureDataUrl} alt="Signature" style={{ height: '40px', marginTop: '8px' }} />
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}