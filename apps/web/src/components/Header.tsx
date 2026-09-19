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
    <header className="h-14 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors duration-200">
      {/* Enterprise Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer">UBOP</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <h2 className="text-xs font-semibold text-slate-900 tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center justify-between w-60 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 rounded-lg px-2.5 py-1 text-xs text-slate-400 transition-all shadow-xs btn-press cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-normal">Jump to or search...</span>
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
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200/80 transition-all duration-150 btn-press"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-slate-900' : ''}`} />
          </button>
        )}

        {/* Notifications */}
        <button className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200/80 transition-all duration-150 relative btn-press">
          <Bell className="w-3.5 h-3.5" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-1.5 right-1.5" />
        </button>

        {/* User profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-7 h-7 rounded-md bg-slate-900 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
            HN
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-semibold text-slate-900 leading-tight">Huy Nguyen</div>
            <div className="text-[10px] text-slate-400 font-medium">Platform Admin</div>
          </div>
        </div>
      </div>
    </header>
  );
};
