import React from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AppLayout from "./layout/AppLayout.jsx"; 
import CreateDocument from "./pages/CreateDocument.jsx";
import TemplateLibrary from "./pages/TemplateLibrary.jsx"; // ✅ Importing real component
import Dashboard from "./pages/Dashboard.jsx"; 

// Quick Placeholder Components for remaining pages
function DocumentHistory() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Document History</h1>
      <p className="text-slate-400">Saved documents, versions, and download logs will render here.</p>
    </div>
  );
}

function CompanyProfile() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Company Profile & Branding</h1>
      <p className="text-slate-400">Reusable logos, letterheads, and default brand colors will render here.</p>
    </div>
  );
}

function Settings() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Platform Settings</h1>
      <p className="text-slate-400">Role permissions and user settings will render here.</p>
    </div>
  );
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract current route active tab (e.g., 'create', 'dashboard')
  const activeTab = location.pathname.substring(1) || 'dashboard';

  // Navigation handler for Sidebar buttons
  const handleTabChange = (tabId) => {
    navigate(`/${tabId}`);
  };

  return (
    <AppLayout activeTab={activeTab} setActiveTab={handleTabChange}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/templates" element={<TemplateLibrary />} />
        <Route path="/create" element={<CreateDocument />} />
        <Route path="/history" element={<DocumentHistory />} />
        <Route path="/company" element={<CompanyProfile />} />
        <Route path="/settings" element={<Settings />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default App;  