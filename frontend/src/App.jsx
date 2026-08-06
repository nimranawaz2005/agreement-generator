import React from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import AppLayout from "./layout/AppLayout.jsx"; 
import CreateDocument from "./pages/CreateDocument.jsx";
import TemplateLibrary from "./pages/TemplateLibrary.jsx";
import Dashboard from "./pages/Dashboard.jsx"; 
import Settings from "../components/Settings.jsx"; 
import DocumentHistory from "./pages/DocumentHistory.jsx"; // ✅ Correct import path matching your file

// Placeholder Component for remaining page
function CompanyProfile() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2 text-slate-100">Company Profile & Branding</h1>
      <p className="text-slate-400">Reusable logos, letterheads, and default brand colors will render here.</p>
    </div>
  );
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract current route active tab
  const activeTab = location.pathname.substring(1) || 'dashboard';

  // Navigation handler for Sidebar buttons
  const handleTabChange = (tabId) => {
    navigate(`/${tabId}`);
  };

  // Callback handler to send loaded document data to Create Document form
  const handleLoadDocument = (doc) => {
    navigate('/create', { state: { documentData: doc } });
  };

  return (
    <AppLayout activeTab={activeTab} setActiveTab={handleTabChange}>
      {/* Global Toast Notification Container */}
      <Toaster 
        position="top-right" 
        reverseOrder={false}
        toastOptions={{
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            border: '1px solid #1e293b',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#0f172a',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#0f172a',
            },
          },
        }}
      />

      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/templates" element={<TemplateLibrary />} />
        <Route path="/create" element={<CreateDocument />} />
        <Route path="/history" element={<DocumentHistory onLoadDocument={handleLoadDocument} />} />
        <Route path="/company" element={<CompanyProfile />} />
        <Route path="/settings" element={<Settings />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default App;  