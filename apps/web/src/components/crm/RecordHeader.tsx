import React from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export interface HighlightField {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

interface RecordHeaderProps {
  breadcrumbLabel: string;
  onBack: () => void;
  title: string;
  subtitle?: string;
  badge?: {
    text: string;
    variant?: 'teal' | 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
  };
  syncStatus?: 'HEALTHY' | 'PENDING' | 'FAILED';
  providerName?: string;
  highlights: HighlightField[];
  actions?: React.ReactNode;
}

export const RecordHeader: React.FC<RecordHeaderProps> = ({
  breadcrumbLabel,
  onBack,
  title,
  subtitle,
  badge,
  syncStatus = 'HEALTHY',
  providerName = 'UBOP Canonical CRM',
  highlights,
  actions,
}) => {
  const badgeClasses = {
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  }[badge?.variant || 'slate'];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
      {/* Top row: Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {breadcrumbLabel}
        </button>

        {/* Sync Provenance Pill */}
        <div className="flex items-center gap-2">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              syncStatus === 'HEALTHY'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : syncStatus === 'FAILED'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {syncStatus === 'HEALTHY' ? (
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
            ) : syncStatus === 'FAILED' ? (
              <AlertTriangle className="w-3 h-3 text-rose-600" />
            ) : (
              <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" />
            )}
            <span>{providerName} · {syncStatus}</span>
          </div>

          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>

      {/* Main Identity */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
            {badge && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClasses}`}>
                {badge.text}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
      </div>

      {/* Highlights Panel (Key Metadata Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-100">
        {highlights.map((field, idx) => (
          <div key={idx} className="space-y-0.5">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
              {field.icon}
              {field.label}
            </div>
            <div className="text-xs font-semibold text-slate-800 truncate">{field.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
