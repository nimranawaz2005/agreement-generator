import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  History, 
  Building2, 
  Settings 
} from 'lucide-react'; // If you don't have lucide-react installed, you can replace these with plain text or standard SVGs

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'templates', label: 'Template Library', icon: FileText },
    { id: 'create', label: 'Create Document', icon: PlusCircle },
    { id: 'history', label: 'Document History', icon: History },
    { id: 'company', label: 'Company Profile', icon: Building2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between h-full p-4">
      <div>
        {/* Logo / Brand Name */}
        <div className="flex items-center gap-3 px-3 py-4 mb-6">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-lg">
            A
          </div>
          <span className="text-xl font-bold tracking-wide text-white">Aicyro</span>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {Icon && <Icon className="w-5 h-5" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Optional Bottom Section */}
      <div className="pt-4 border-t border-slate-800 px-3">
        <p className="text-xs text-slate-500">Corporate Doc Generator</p>
      </div>
    </aside>
  );
}   