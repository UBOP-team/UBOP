import React from 'react';
import { X, RotateCcw, Calendar } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterGroup {
  id: string;
  name: string;
  options: FilterOption[];
}

export interface FilterPanelProps {
  groups: FilterGroup[];
  selectedValues: Record<string, string>; // groupId -> value
  onSelectValue: (groupId: string, value: string) => void;
  onReset: () => void;
  dateRange?: string;
  onSelectDateRange?: (range: string) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  groups,
  selectedValues,
  onSelectValue,
  onReset,
  dateRange = '30D',
  onSelectDateRange,
}) => {
  const activeCount = Object.values(selectedValues).filter((v) => v && v !== 'ALL').length;

  const dateOptions = [
    { id: 'TODAY', label: 'Today' },
    { id: '7D', label: 'Last 7 Days' },
    { id: '30D', label: 'Last 30 Days' },
    { id: 'YTD', label: 'Year to Date' },
  ];

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 text-xs shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">Filter Criteria</span>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] font-semibold border border-slate-200">
              {activeCount} active
            </span>
          )}
        </div>

        {/* Date Presets */}
        {onSelectDateRange && (
          <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            {dateOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onSelectDateRange(opt.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all btn-press ${
                  dateRange === opt.id
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter Groups */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
        {groups.map((grp) => {
          const currentVal = selectedValues[grp.id] || 'ALL';

          return (
            <div key={grp.id} className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">
                {grp.name}
              </label>
              <select
                value={currentVal}
                onChange={(e) => onSelectValue(grp.id, e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 text-xs font-medium"
              >
                <option value="ALL">All {grp.name}s</option>
                {grp.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      {/* Active Filter Chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] text-slate-400 font-mono">Active Filters:</span>
          {Object.entries(selectedValues).map(([grpId, val]) => {
            if (!val || val === 'ALL') return null;
            const grp = groups.find((g) => g.id === grpId);
            return (
              <span
                key={grpId}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-mono"
              >
                <span className="text-slate-500">{grp?.name || grpId}:</span> {val}
                <button
                  type="button"
                  onClick={() => onSelectValue(grpId, 'ALL')}
                  className="hover:text-rose-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}

          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-slate-500 hover:text-rose-600 transition-colors ml-auto"
          >
            <RotateCcw className="w-3 h-3" /> Clear All
          </button>
        </div>
      )}
    </div>
  );
};
