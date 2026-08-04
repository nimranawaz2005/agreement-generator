import React from 'react';
import { Search, Bell, User } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-16 bg-slate-950 border-b border-slate-800 px-6 flex items-center justify-between">
      {/* Left Side: Search Bar */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search documents or templates..."
          className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Right Side: Actions & User Avatar */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full"></span>
        </button>

        <div className="h-6 w-[1px] bg-slate-800" />

        {/* User Profile */}
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-slate-200 leading-none">Nimra Nawaz</p>
            <p className="text-xs text-slate-500 mt-1 leading-none">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}  