import React from 'react';
import { AlertTriangle, FolderOpen, RefreshCw, Plus, CheckCircle2 } from 'lucide-react';

/* =========================================================================
   1. Skeleton Loading States (Enterprise Shimmer)
   ========================================================================= */

export const SkeletonCard: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-3 shadow-xs"
        >
          <div className="flex justify-between items-center">
            <div className="h-3 w-24 bg-slate-200 rounded" />
            <div className="h-4 w-12 bg-slate-100 rounded-full" />
          </div>
          <div className="h-8 w-32 bg-slate-200 rounded mt-2" />
          <div className="h-2 w-full bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs animate-pulse">
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
        <div className="h-4 w-36 bg-slate-200 rounded" />
        <div className="h-7 w-48 bg-slate-200 rounded" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="p-4 flex items-center justify-between gap-4">
            {Array.from({ length: columns }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="h-3.5 bg-slate-200/70 rounded"
                style={{ width: `${60 + ((rIdx + cIdx) % 4) * 20}px` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/* =========================================================================
   2. Empty State (Explain why empty + what to do next)
   ========================================================================= */

export interface EmptyStateProps {
  title?: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Records Found',
  description,
  actionLabel,
  onAction,
  icon: Icon = FolderOpen,
}) => {
  return (
    <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-6 shadow-xs animate-smooth-fade">
      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-3 shadow-xs">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-all shadow-xs btn-press"
        >
          <Plus className="w-3.5 h-3.5" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

/* =========================================================================
   3. Error State (Explain problem + recovery action)
   ========================================================================= */

export interface ErrorStateProps {
  title?: string;
  problem: string;
  recoveryAction?: () => void;
  recoveryLabel?: string;
  errorCode?: string | number;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Connection or Operation Failed',
  problem,
  recoveryAction,
  recoveryLabel = 'Retry Request',
  errorCode,
}) => {
  return (
    <div className="bg-rose-50/50 border border-rose-200/80 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-xs animate-smooth-fade">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-rose-900">{title}</h4>
            {errorCode && (
              <span className="px-1.5 py-0.5 bg-white border border-rose-200 rounded font-mono text-[10px] text-rose-700 font-bold">
                {errorCode}
              </span>
            )}
          </div>
          <p className="text-rose-700/90 mt-0.5 max-w-xl leading-relaxed">{problem}</p>
        </div>
      </div>

      {recoveryAction && (
        <button
          type="button"
          onClick={recoveryAction}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-800 font-medium rounded-lg transition-colors shadow-xs shrink-0 btn-press"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {recoveryLabel}
        </button>
      )}
    </div>
  );
};

/* =========================================================================
   4. Success State (Confirm action completed)
   ========================================================================= */

export interface SuccessBannerProps {
  title: string;
  message: string;
  onDismiss?: () => void;
}

export const SuccessBanner: React.FC<SuccessBannerProps> = ({ title, message, onDismiss }) => {
  return (
    <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 flex items-center justify-between text-xs shadow-xs animate-smooth-fade">
      <div className="flex items-center gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <div>
          <span className="font-semibold text-emerald-900">{title}: </span>
          <span className="text-emerald-800/90">{message}</span>
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-emerald-700 hover:text-emerald-900 font-medium text-[11px] ml-4 hover:underline"
        >
          Dismiss
        </button>
      )}
    </div>
  );
};
