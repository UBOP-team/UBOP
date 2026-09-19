import React from 'react';
import { Search, Bell, RefreshCw, ChevronRight } from 'lucide-react';

interface HeaderProps {
  title: string;
  onRefresh?: () => void;
  loading?: boolean;
  onOpenCommandPalette?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onRefresh,
  loading = false,
  onOpenCommandPalette,
}) => {
  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors duration-200">
      {/* Enterprise Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-mono font-bold text-teal-700 uppercase tracking-wider">UBOP</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-3.5">
        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center justify-between w-64 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-400 transition-all shadow-xs btn-press cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">Quick jump & actions...</span>
          </div>
          <kbd className="font-mono text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-xs">
            ⌘K
          </kbd>
        </button>

        {/* Refresh Action */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all duration-200 btn-press"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        )}

        {/* Notifications */}
        <button className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all duration-200 relative btn-press">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-teal-500 absolute top-1.5 right-1.5 ring-2 ring-white" />
        </button>

        {/* User profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
            HN
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-bold text-slate-800">Huy Nguyen</div>
            <div className="text-[10px] text-slate-500 font-medium">Platform Admin</div>
          </div>
        </div>
      </div>
    </header>
  );
};
