import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export default function AppLayout({ children, activeTab, setActiveTab }) {
  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* Left Navigation Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Header */}
        <Header />

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}   