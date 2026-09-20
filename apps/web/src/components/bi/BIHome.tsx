import React, { useState } from 'react';
import {
  Star,
  Clock,
  Database,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { BIHomeSummary, BIContentCard } from '../../types';

interface BIHomeProps {
  summary: BIHomeSummary;
  onOpenReport: (id: string) => void;
  onOpenDashboard: (id: string) => void;
  onNavigateSubNav: (subNav: string) => void;
}

export const BIHome: React.FC<BIHomeProps> = ({
  summary,
  onOpenReport,
  onOpenDashboard,
  onNavigateSubNav,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filterCards = (cards: BIContentCard[]) => {
    if (!searchQuery.trim()) return cards;
    const q = searchQuery.toLowerCase();
    return cards.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        c.type.toLowerCase().includes(q)
    );
  };

  return (
    <div className="space-y-6 animate-smooth-fade">
      {/* Header & Quick Search (Section 6 & 46) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Analytics Discovery Home</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              Power BI Workspace
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Quickly discover, monitor, and explore governed reports, executive dashboards, and semantic measures.
          </p>
        </div>

        {/* Global Search */}
        <div className="w-full md:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reports, dashboards, metrics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 font-medium shadow-2xs"
          />
        </div>
      </div>

      {/* Data Health Banner (Section 6) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Governed Data Health</span>
              <span className="text-[10px] font-mono text-slate-500">
                Last synced: {summary.data_health.last_synced_at}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600 mt-0.5">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {summary.data_health.healthy_count} Models Healthy
              </span>
              {summary.data_health.stale_count > 0 && (
                <span className="flex items-center gap-1 text-amber-700 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {summary.data_health.stale_count} Model Stale (Procurement)
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigateSubNav('REFRESH')}
          className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors"
        >
          View Refresh Operations <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Favorites Section (Section 6) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Favorites
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filterCards(summary.favorites).map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (item.type === 'DASHBOARD') onOpenDashboard(item.id);
                else onOpenReport(item.id);
              }}
              className="p-4 bg-white hover:bg-slate-50/70 border border-slate-200/90 hover:border-slate-300 rounded-2xl shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700">
                    {item.type}
                  </span>
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{item.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono mt-3">
                <span>{item.author}</span>
                <span>{item.last_modified}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recents Section (Section 6) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> Recent Content
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filterCards(summary.recents).map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (item.type === 'DASHBOARD') onOpenDashboard(item.id);
                else onOpenReport(item.id);
              }}
              className="p-4 bg-white hover:bg-slate-50/70 border border-slate-200/90 hover:border-slate-300 rounded-2xl shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700">
                    {item.type}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 font-semibold">{item.status}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{item.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono mt-3">
                <span>{item.author}</span>
                <span>{item.last_modified}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
