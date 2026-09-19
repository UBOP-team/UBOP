import React from 'react';
import { Search, Bell, RefreshCw } from 'lucide-react';

interface HeaderProps {
  title: string;
  onRefresh?: () => void;
  loading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, onRefresh, loading = false }) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search records, SKUs, orders..."
            className="w-64 bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        {/* Refresh Action */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        )}

        {/* Notifications */}
        <button className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-teal-400 absolute top-1.5 right-1.5 ring-2 ring-slate-900" />
        </button>

        {/* User profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-teal-600/20 border border-teal-500/40 text-teal-400 font-semibold text-xs flex items-center justify-center">
            HN
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-semibold text-slate-200">Huy Nguyen</div>
            <div className="text-[10px] text-slate-400">Operations Admin</div>
          </div>
        </div>
      </div>
    </header>
  );
};
