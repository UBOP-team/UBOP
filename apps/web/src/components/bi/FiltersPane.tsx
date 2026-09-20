import React from 'react';
import { Filter, X, ChevronRight, Lock, SlidersHorizontal } from 'lucide-react';
import { AnalyticalFilter } from '../../types';

interface FiltersPaneProps {
  isOpen: boolean;
  onToggle: () => void;
  reportFilters: AnalyticalFilter[];
  pageFilters: AnalyticalFilter[];
  visualFilter: AnalyticalFilter | null;
  onClearFilter: (field: string, scope: string) => void;
  onResetAllFilters: () => void;
}

export const FiltersPane: React.FC<FiltersPaneProps> = ({
  isOpen,
  onToggle,
  reportFilters,
  pageFilters,
  visualFilter,
  onClearFilter,
  onResetAllFilters,
}) => {
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-white border-l border-t border-b border-slate-300 px-2 py-3 rounded-l-xl shadow-md text-slate-700 hover:text-slate-900 flex flex-col items-center gap-1 transition-all z-20"
        title="Open Filters Pane"
      >
        <SlidersHorizontal className="w-4 h-4 text-teal-600" />
        <span className="text-[10px] font-bold uppercase tracking-wider [writing-mode:vertical-lr] rotate-180">
          Filters
        </span>
      </button>
    );
  }

  const totalFilterCount = reportFilters.length + pageFilters.length + (visualFilter ? 1 : 0);

  return (
    <div className="w-72 bg-white border-l border-slate-200/90 h-full flex flex-col shadow-lg z-20 animate-smooth-fade">
      {/* Pane Header */}
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-teal-600" />
          <h3 className="text-xs font-bold text-slate-900 tracking-tight">Filters Pane</h3>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            {totalFilterCount} Active
          </span>
        </div>
        <div className="flex items-center gap-1">
          {totalFilterCount > 0 && (
            <button
              onClick={onResetAllFilters}
              className="text-[10px] font-semibold text-teal-700 hover:text-teal-800 px-2 py-1 rounded hover:bg-teal-50/50 transition-colors"
              title="Reset all filters to defaults"
            >
              Reset All
            </button>
          )}
          <button
            onClick={onToggle}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
            title="Collapse Filters Pane"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
        {/* SCOPE 1: VISUAL-LEVEL FILTERS */}
        <div>
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Visual Filters (Focused Visual)
            </span>
          </div>
          {visualFilter ? (
            <div className="p-2.5 bg-indigo-50/60 border border-indigo-200/80 rounded-lg space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 text-[11px]">{visualFilter.display_label || visualFilter.field}</span>
                <button
                  onClick={() => onClearFilter(visualFilter.field, 'VISUAL')}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-[11px] font-mono text-indigo-900">
                {visualFilter.operator} ({visualFilter.values.join(', ')})
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic">Select a visual on the canvas to inspect local visual filters.</p>
          )}
        </div>

        {/* SCOPE 2: PAGE-LEVEL FILTERS */}
        <div>
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Page Filters (Active Page)
            </span>
          </div>
          {pageFilters.length > 0 ? (
            <div className="space-y-2">
              {pageFilters.map((f, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 text-[11px]">{f.display_label || f.field}</span>
                    <button
                      onClick={() => onClearFilter(f.field, 'PAGE')}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-[11px] font-mono text-slate-600">
                    is in: <span className="font-semibold text-slate-900">{f.values.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic">No page-specific constraints applied.</p>
          )}
        </div>

        {/* SCOPE 3: REPORT-LEVEL FILTERS */}
        <div>
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Report Filters (All Pages)
            </span>
          </div>
          {reportFilters.length > 0 ? (
            <div className="space-y-2">
              {reportFilters.map((f, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 text-[11px] flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      {f.display_label || f.field}
                    </span>
                    <button
                      onClick={() => onClearFilter(f.field, 'REPORT')}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-[11px] font-mono text-slate-600">
                    is: <span className="font-semibold text-slate-900">{f.values.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic">Global reporting scope is unfiltered.</p>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 font-mono text-center">
        Reading mode: filters applied client-side to query requests
      </div>
    </div>
  );
};
