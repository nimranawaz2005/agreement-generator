import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  FileText, Search, RotateCcw, Trash2, Calendar, 
  DollarSign, User, Loader2, RefreshCw, Download,
  TrendingUp, CheckCircle2, Clock, Send, Copy, FileSpreadsheet,
  CheckSquare, Square
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function DocumentHistory({ onLoadDocument }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // 📅 SORTING & DATE FILTER STATES
  const [sortBy, setSortBy] = useState('newest'); 
  const [dateRange, setDateRange] = useState('all'); 

  const [updatingId, setUpdatingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [duplicatingId, setDuplicatingId] = useState(null);
  const [pdfRenderDoc, setPdfRenderDoc] = useState(null);

  // Batch Selection State
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchActionLoading, setBatchActionLoading] = useState(false);

  const renderRef = useRef(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/documents');
      if (!response.ok) throw new Error('Failed to fetch from server');
      const data = await response.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('⚠️ Server fetch failed, loading local fallback:', err.message);
      const localData = localStorage.getItem('document_history');
      if (localData) {
        try { setDocuments(JSON.parse(localData)); } catch (e) { setDocuments([]); }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // 📊 ANALYTICS
  const analytics = useMemo(() => {
    const totalDocs = documents.length;
    const totalRevenue = documents.reduce((sum, doc) => sum + (Number(doc.totalCost) || 0), 0);
    const avgDeal = totalDocs > 0 ? totalRevenue / totalDocs : 0;

    const counts = {
      Draft: documents.filter(d => (d.status || 'Draft').toLowerCase() === 'draft').length,
      Sent: documents.filter(d => (d.status || '').toLowerCase() === 'sent').length,
      Signed: documents.filter(d => (d.status || '').toLowerCase() === 'signed').length,
      Paid: documents.filter(d => (d.status || '').toLowerCase() === 'paid').length,
    };

    return { totalRevenue, avgDeal, totalDocs, counts };
  }, [documents]);

  // 🔍 FILTERING & SORTING
  const filteredAndSortedDocuments = useMemo(() => {
    return documents
      .filter((doc) => {
        const title = (doc.title || '').toLowerCase();
        const client = (doc.preparedFor || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        const matchesSearch = title.includes(query) || client.includes(query);

        const docStatus = (doc.status || 'Draft').toLowerCase();
        const matchesStatus = statusFilter === 'All' || docStatus === statusFilter.toLowerCase();

        let matchesDate = true;
        if (dateRange !== 'all') {
          const docDateRaw = doc.createdAt || doc.date;
          if (docDateRaw) {
            const docDate = new Date(docDateRaw);
            const now = new Date();

            if (dateRange === 'today') {
              matchesDate = docDate.toDateString() === now.toDateString();
            } else if (dateRange === '7days') {
              const diffDays = (now - docDate) / (1000 * 60 * 60 * 24);
              matchesDate = diffDays <= 7 && diffDays >= 0;
            } else if (dateRange === '30days') {
              const diffDays = (now - docDate) / (1000 * 60 * 60 * 24);
              matchesDate = diffDays <= 30 && diffDays >= 0;
            }
          }
        }

        return matchesSearch && matchesStatus && matchesDate;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date || 0);
        const dateB = new Date(b.createdAt || b.date || 0);

        if (sortBy === 'newest') return dateB - dateA;
        if (sortBy === 'oldest') return dateA - dateB;
        if (sortBy === 'amount-high') return (Number(b.totalCost) || 0) - (Number(a.totalCost) || 0);
        if (sortBy === 'amount-low') return (Number(a.totalCost) || 0) - (Number(b.totalCost) || 0);
        return 0;
      });
  }, [documents, searchQuery, statusFilter, dateRange, sortBy]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAndSortedDocuments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAndSortedDocuments.map(d => d._id || d.id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected documents?`)) return;
    setBatchActionLoading(true);
    setDocuments(prev => prev.filter(d => !selectedIds.includes(d._id || d.id)));
    try {
      await Promise.all(
        selectedIds.map(id => fetch(`http://localhost:5000/api/documents/${id}`, { method: 'DELETE' }))
      );
    } catch (err) {
      console.warn('Backend batch delete warning:', err);
    } finally {
      setSelectedIds([]);
      setBatchActionLoading(false);
    }
  };

  const handleBatchStatusChange = async (newStatus) => {
    setBatchActionLoading(true);
    setDocuments(prev => 
      prev.map(d => selectedIds.includes(d._id || d.id) ? { ...d, status: newStatus } : d)
    );

    try {
      await Promise.all(
        selectedIds.map(id => 
          fetch(`http://localhost:5000/api/documents/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
          })
        )
      );
    } catch (err) {
      console.error('Batch status update failed:', err);
    } finally {
      setSelectedIds([]);
      setBatchActionLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (documents.length === 0) {
      alert('No documents available to export.');
      return;
    }

    const headers = ['Document Title', 'Client Name', 'Company', 'Status', 'Total Amount ($)', 'Created Date'];
    const rows = documents.map(doc => [
      `"${(doc.title || 'Agreement').replace(/"/g, '""')}"`,
      `"${(doc.preparedFor || 'N/A').replace(/"/g, '""')}"`,
      `"${(doc.companyName || 'N/A').replace(/"/g, '""')}"`,
      `"${doc.status || 'Draft'}"`,
      doc.totalCost || 0,
      `"${doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'N/A'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Document_History_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDuplicate = async (doc) => {
    const docId = doc._id || doc.id;
    setDuplicatingId(docId);

    const duplicatedData = {
      ...doc,
      _id: undefined,
      id: undefined,
      title: doc.title ? `Copy of ${doc.title}` : `Copy of Agreement - ${doc.preparedFor}`,
      status: 'Draft',
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetch('http://localhost:5000/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicatedData),
      });

      if (response.ok) {
        const newDoc = await response.json();
        setDocuments((prev) => [newDoc, ...prev]);
      } else {
        throw new Error('Backend POST failed');
      }
    } catch (err) {
      const newLocalDoc = {
        ...duplicatedData,
        id: Date.now().toString(),
      };
      const updatedList = [newLocalDoc, ...documents];
      setDocuments(updatedList);
      localStorage.setItem('document_history', JSON.stringify(updatedList));
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDownloadPDF = async (doc) => {
    const docId = doc._id || doc.id;
    setDownloadingId(docId);
    setPdfRenderDoc(doc);

    setTimeout(async () => {
      try {
        if (!renderRef.current) return;

        const canvas = await html2canvas(renderRef.current, {
          scale: 2,
          useCORS: true,
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

        const fileName = `${(doc.preparedFor || 'Document').replace(/[^a-zA-Z0-9]/g, '_')}_Agreement.pdf`;
        pdf.save(fileName);
      } catch (err) {
        console.error('PDF Generation Error:', err);
        alert('Failed to generate PDF download.');
      } finally {
        setDownloadingId(null);
        setPdfRenderDoc(null);
      }
    }, 200);
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this record permanently?')) return;
    setDocuments((prev) => prev.filter((d) => (d._id || d.id) !== docId));

    try {
      await fetch(`http://localhost:5000/api/documents/${docId}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Backend delete error:', err);
    }
  };

  const handleStatusChange = async (docId, newStatus) => {
    setUpdatingId(docId);
    setDocuments((prev) =>
      prev.map((d) => ((d._id || d.id) === docId ? { ...d, status: newStatus } : d))
    );

    try {
      await fetch(`http://localhost:5000/api/documents/${docId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error('Status sync update failed:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const isAllSelected = filteredAndSortedDocuments.length > 0 && selectedIds.length === filteredAndSortedDocuments.length;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* 📱 Header Bar Responsive Layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 flex-shrink-0" /> 
            <span>Document History</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Manage, filter, download, and track document statuses</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none justify-center bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 text-xs px-3 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
          </button>

          <button
            type="button"
            onClick={fetchDocuments}
            className="flex-1 sm:flex-none justify-center bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 font-medium transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* 📊 Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Total Value</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-slate-100">${analytics.totalRevenue.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Avg: ${Math.round(analytics.avgDeal).toLocaleString()}</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Paid Deals</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-emerald-400">{analytics.counts.Paid}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Completed payments</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Sent / Pending</span>
            <Send className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg font-bold text-blue-400">{analytics.counts.Sent + analytics.counts.Signed}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{analytics.counts.Sent} sent · {analytics.counts.Signed} signed</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Drafts</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-amber-400">{analytics.counts.Draft}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">In progress</div>
        </div>
      </div>

      {/* 🔍 Filter & Sort Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-4 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search client or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl pl-10 pr-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="lg:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft ({analytics.counts.Draft})</option>
            <option value="Sent">Sent ({analytics.counts.Sent})</option>
            <option value="Signed">Signed ({analytics.counts.Signed})</option>
            <option value="Paid">Paid ({analytics.counts.Paid})</option>
          </select>
        </div>

        <div className="lg:col-span-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>

        <div className="lg:col-span-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
          >
            <option value="newest">Sort: Date (Newest First)</option>
            <option value="oldest">Sort: Date (Oldest First)</option>
            <option value="amount-high">Sort: Amount (High to Low)</option>
            <option value="amount-low">Sort: Amount (Low to High)</option>
          </select>
        </div>
      </div>

      {/* Batch Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-950/40 border border-blue-500/30 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <span className="text-xs font-medium text-blue-300">
            {selectedIds.length} document{selectedIds.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 hidden sm:inline">Mark as:</span>
            {['Draft', 'Sent', 'Signed', 'Paid'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => handleBatchStatusChange(st)}
                disabled={batchActionLoading}
                className="text-xs bg-slate-800 hover:bg-blue-600 text-slate-200 px-2.5 py-1 rounded-lg transition-colors border border-slate-700"
              >
                {st}
              </button>
            ))}
            <button
              type="button"
              onClick={handleBatchDelete}
              disabled={batchActionLoading}
              className="text-xs bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1 rounded-lg transition-colors border border-red-500/30 flex items-center gap-1 ml-auto sm:ml-2"
            >
              {batchActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Delete
            </button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {filteredAndSortedDocuments.length > 0 && (
          <div className="p-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-2 hover:text-slate-200"
            >
              {isAllSelected ? <CheckSquare className="w-4 h-4 text-blue-400" /> : <Square className="w-4 h-4" />}
              <span>{isAllSelected ? 'Deselect All' : 'Select All'}</span>
            </button>
            <span>Showing {filteredAndSortedDocuments.length} of {documents.length}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-xs">Fetching history records...</p>
          </div>
        ) : filteredAndSortedDocuments.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p className="text-xs font-medium">No documents found matching criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filteredAndSortedDocuments.map((doc) => {
              const docId = doc._id || doc.id;
              const isDownloading = downloadingId === docId;
              const isDuplicating = duplicatingId === docId;
              const isSelected = selectedIds.includes(docId);
              const currentStatus = doc.status || 'Draft';

              return (
                <div key={docId} className={`p-4 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isSelected ? 'bg-blue-950/20' : 'hover:bg-slate-950/50'}`}>
                  
                  {/* Item Content */}
                  <div className="flex items-start gap-3 flex-1 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => toggleSelectOne(docId)}
                      className="mt-1 text-slate-500 hover:text-blue-400 flex-shrink-0"
                    >
                      {isSelected ? <CheckSquare className="w-4 h-4 text-blue-400" /> : <Square className="w-4 h-4" />}
                    </button>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-200 truncate max-w-xs">{doc.title || `Agreement - ${doc.preparedFor}`}</h3>
                        <select
                          value={currentStatus}
                          onChange={(e) => handleStatusChange(docId, e.target.value)}
                          disabled={updatingId === docId}
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-slate-950 border-slate-800 text-slate-300 cursor-pointer outline-none capitalize"
                        >
                          <option value="Draft">Draft</option>
                          <option value="Sent">Sent</option>
                          <option value="Signed">Signed</option>
                          <option value="Paid">Paid</option>
                        </select>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span><User className="w-3.5 h-3.5 inline mr-1 text-slate-500" />{doc.preparedFor || 'N/A'}</span>
                        <span className="text-slate-200 font-medium"><DollarSign className="w-3.5 h-3.5 inline text-emerald-400" />${(doc.totalCost || 0).toLocaleString()}</span>
                        <span className="text-slate-500"><Calendar className="w-3.5 h-3.5 inline mr-1" />{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap sm:flex-nowrap">
                    <button
                      type="button"
                      onClick={() => handleDownloadPDF(doc)}
                      disabled={isDownloading}
                      className="px-2.5 py-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicate(doc)}
                      disabled={isDuplicating}
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-colors"
                      title="Duplicate Document"
                    >
                      {isDuplicating ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <Copy className="w-4 h-4" />}
                    </button>

                    {onLoadDocument && (
                      <button
                        type="button"
                        onClick={() => onLoadDocument(doc)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Load
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(docId)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hidden PDF Canvas Engine */}
      <div className="absolute top-[-9999px] left-[-9999px]">
        {pdfRenderDoc && (
          <div
            ref={renderRef}
            style={{
              width: '595px',
              minHeight: '842px',
              padding: '40px',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              fontFamily: 'sans-serif',
            }}
          >
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', borderBottom: '2px solid #2563eb', paddingBottom: '8px' }}>
              {pdfRenderDoc.title || 'SERVICES AGREEMENT'}
            </h1>
            <p style={{ fontSize: '12px', marginTop: '12px' }}><strong>Prepared For:</strong> {pdfRenderDoc.preparedFor}</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}><strong>Company Name:</strong> {pdfRenderDoc.companyName}</p>
            <p style={{ fontSize: '12px', marginTop: '12px', color: '#475569' }}>{pdfRenderDoc.projectScope}</p>

            <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: '8px 0' }}>Deliverable</th>
                  <th style={{ padding: '8px 0', textAlign: 'right' }}>Cost</th>
                </tr>
              </thead>
              <tbody>
                {(pdfRenderDoc.items || []).map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 0' }}>{item.description}</td>
                    <td style={{ padding: '8px 0', textAlign: 'right' }}>${(Number(item.cost) || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ textAlign: 'right', marginTop: '20px', fontSize: '14px', fontWeight: 'bold', color: '#2563eb' }}>
              Total: ${(pdfRenderDoc.totalCost || 0).toLocaleString()}
            </div>
          </div>
        )}
      </div>

    </div>
  );
} 