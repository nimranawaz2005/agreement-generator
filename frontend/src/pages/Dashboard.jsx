import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // Fetch documents from backend API
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/documents');
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      const data = await response.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  // Status Change Handler
  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/documents/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setDocuments((prevDocs) =>
          prevDocs.map((doc) =>
            doc._id === id || doc.id === id ? { ...doc, status: newStatus } : doc
          )
        );
      } else {
        alert('Failed to update status.');
      }
    } catch (err) {
      console.error('Status update error:', err);
      alert('Error updating status.');
    }
  };

  // Delete document handler
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/documents/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDocuments(documents.filter((doc) => doc._id !== id && doc.id !== id));
      } else {
        alert('Failed to delete document.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error deleting document.');
    }
  };

  // Helper for Status Badge Styling
  const getStatusBadgeStyle = (status = 'Draft') => {
    switch (status.toLowerCase()) {
      case 'paid':
        return { backgroundColor: '#065f46', color: '#34d399', border: '1px solid #059669' };
      case 'signed':
        return { backgroundColor: '#1e3a8a', color: '#60a5fa', border: '1px solid #2563eb' };
      case 'sent':
        return { backgroundColor: '#7c2d12', color: '#fb923c', border: '1px solid #ea580c' };
      default: // Draft
        return { backgroundColor: '#374151', color: '#9ca3af', border: '1px solid #4b5563' };
    }
  };

  // Dynamic Analytics Calculations
  const totalRevenue = (documents || []).reduce((acc, doc) => acc + (doc?.totalCost || 0), 0);
  const totalDocs = (documents || []).length;
  const avgDocValue = totalDocs > 0 ? totalRevenue / totalDocs : 0;

  // Filter documents by search term
  const filteredDocs = (documents || []).filter((doc) => {
    const term = searchTerm.toLowerCase();
    return (
      (doc.preparedFor && doc.preparedFor.toLowerCase().includes(term)) ||
      (doc.companyName && doc.companyName.toLowerCase().includes(term)) ||
      (doc.title && doc.title.toLowerCase().includes(term)) ||
      (doc.id && doc.id.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: '#f3f4f6' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#ffffff', margin: 0 }}>Dashboard</h2>
          <p style={{ color: '#9ca3af', marginTop: '0.25rem', fontSize: '0.95rem' }}>
            Manage, view, and track all your generated documents.
          </p>
        </div>
        <Link 
          to="/create" 
          style={{
            padding: '0.6rem 1.25rem',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            fontSize: '0.9rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
          }}
        >
          + Create New Document
        </Link>
      </div>

      {/* Analytics Cards Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: '#111827', padding: '1.25rem', borderRadius: '8px', border: '1px solid #1f2937' }}>
          <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: 0 }}>Total Pipeline Revenue</p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981', margin: '0.5rem 0 0 0' }}>
            ${totalRevenue.toLocaleString()}
          </h3>
        </div>

        <div style={{ backgroundColor: '#111827', padding: '1.25rem', borderRadius: '8px', border: '1px solid #1f2937' }}>
          <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: 0 }}>Total Documents Generated</p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#60a5fa', margin: '0.5rem 0 0 0' }}>
            {totalDocs}
          </h3>
        </div>

        <div style={{ backgroundColor: '#111827', padding: '1.25rem', borderRadius: '8px', border: '1px solid #1f2937' }}>
          <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: 0 }}>Average Deal Value</p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b', margin: '0.5rem 0 0 0' }}>
            ${avgDocValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </h3>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Search by client, company, title, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            border: '1px solid #374151',
            backgroundColor: '#1f2937',
            color: '#ffffff',
            fontSize: '0.95rem',
            outline: 'none'
          }}
        />
      </div>

      {/* Loading & Error States */}
      {loading && <p style={{ color: '#9ca3af' }}>Loading documents from MongoDB...</p>}
      {error && <p style={{ color: '#ef4444', fontWeight: '500' }}>Error: {error}</p>}

      {/* Document Table */}
      {!loading && !error && (
        <div style={{ backgroundColor: '#111827', borderRadius: '8px', overflow: 'hidden', border: '1px solid #1f2937' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#1f2937', borderBottom: '1px solid #374151', color: '#9ca3af', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.85rem 1rem' }}>DOC TITLE / ID</th>
                <th style={{ padding: '0.85rem 1rem' }}>CLIENT</th>
                <th style={{ padding: '0.85rem 1rem' }}>STATUS</th>
                <th style={{ padding: '0.85rem 1rem' }}>DATE</th>
                <th style={{ padding: '0.85rem 1rem' }}>TOTAL COST</th>
                <th style={{ padding: '0.85rem 1rem' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => {
                  const docId = doc._id || doc.id;
                  const currentStatus = doc.status || 'Draft';
                  return (
                    <tr key={docId} style={{ borderBottom: '1px solid #1f2937' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '600', color: '#ffffff' }}>{doc.title || 'Untitled Document'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: 'monospace', marginTop: '2px' }}>
                          {docId}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: '#d1d5db' }}>{doc.preparedFor || 'N/A'}</td>
                      
                      {/* Interactive Status Column */}
                      <td style={{ padding: '1rem' }}>
                        <select
                          value={currentStatus}
                          onChange={(e) => handleStatusChange(docId, e.target.value)}
                          style={{
                            ...getStatusBadgeStyle(currentStatus),
                            padding: '0.25rem 0.6rem',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          <option value="Draft" style={{ backgroundColor: '#1f2937', color: '#fff' }}>Draft</option>
                          <option value="Sent" style={{ backgroundColor: '#1f2937', color: '#fff' }}>Sent</option>
                          <option value="Signed" style={{ backgroundColor: '#1f2937', color: '#fff' }}>Signed</option>
                          <option value="Paid" style={{ backgroundColor: '#1f2937', color: '#fff' }}>Paid</option>
                        </select>
                      </td>

                      <td style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.9rem' }}>
                        {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : (doc.date ? new Date(doc.date).toLocaleDateString() : 'N/A')}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: '700', color: '#10b981' }}>
                        ${doc.totalCost ? doc.totalCost.toLocaleString() : '0'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <button
                          onClick={() => handleDelete(docId)}
                          style={{
                            padding: '0.4rem 0.8rem',
                            backgroundColor: '#dc2626',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '500'
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                    No saved documents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Dashboard;  