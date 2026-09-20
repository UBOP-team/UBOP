import React from 'react';
import { LucideIcon, ArrowLeft, Radio } from 'lucide-react';

interface KeyFact {
  label: string;
  value: string | number;
  subtext?: string;
  highlight?: boolean;
}

interface FioriObjectHeaderProps {
  title: string;
  subtitle?: string;
  typeLabel?: string;
  statusText?: string;
  statusVariant?: 'success' | 'warning' | 'error' | 'neutral' | 'info';
  onBack?: () => void;
  keyFacts?: KeyFact[];
  primaryAction?: {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
    variant?: 'primary' | 'success' | 'danger';
    disabled?: boolean;
  };
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
    disabled?: boolean;
  }>;
  providerInfo?: {
    name: string;
    syncStatus: string;
    externalId?: string;
  };
}

export const FioriObjectHeader: React.FC<FioriObjectHeaderProps> = ({
  title,
  subtitle,
  typeLabel,
  statusText,
  statusVariant = 'neutral',
  onBack,
  keyFacts = [],
  primaryAction,
  secondaryActions = [],
  providerInfo,
}) => {
  const badgeStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-rose-50 text-rose-700 border-rose-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
  }[statusVariant];

  return (
    <div className="bg-white border border-slate-200/80 rounded-lg p-5 shadow-xs mb-6">
      {/* Top Bar: Back & Provenance */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors mr-2 cursor-pointer font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          )}
          {typeLabel && (
            <span className="uppercase tracking-wider font-semibold text-slate-400 text-[10px]">
              {typeLabel}
            </span>
          )}
        </div>

        {providerInfo && (
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono bg-slate-50 border border-slate-200 text-slate-600">
            <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
            <span>
              Provider: <strong className="text-slate-800 font-semibold">{providerInfo.name}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-700 font-semibold">{providerInfo.syncStatus}</span>
            {providerInfo.externalId && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500">Ext: {providerInfo.externalId}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Main Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
            {statusText && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${badgeStyles}`}
              >
                {statusText}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        {/* Semantic Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {secondaryActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={action.onClick}
                disabled={action.disabled}
                className="px-3 py-1.5 text-xs font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {action.label}
              </button>
            );
          })}

          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                primaryAction.variant === 'success'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : primaryAction.variant === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {primaryAction.icon && <primaryAction.icon className="w-3.5 h-3.5" />}
              {primaryAction.label}
            </button>
          )}
        </div>
      </div>

      {/* Key Header Facts (SAP Fiori dense metadata strip) */}
      {keyFacts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-3.5 text-xs">
          {keyFacts.map((fact, idx) => (
            <div key={idx} className="space-y-0.5">
              <span className="text-slate-400 font-medium text-[11px] block">{fact.label}</span>
              <span
                className={`font-mono text-xs block truncate ${
                  fact.highlight ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'
                }`}
              >
                {fact.value}
              </span>
              {fact.subtext && <span className="text-[10px] text-slate-400 block">{fact.subtext}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
