import React from 'react';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  change?: number;
  period?: string;
  target?: string;
  icon?: LucideIcon; // Kept in interface for backward compat, but intentionally NOT rendered to eliminate corner icon clutter
  sparklineData?: number[];
  colorScheme?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtext,
  change,
  period = 'vs prior period',
  target,
  sparklineData,
}) => {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change !== undefined && change === 0;

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between card-hover shadow-enterprise hover:shadow-enterprise-hover inset-highlight relative overflow-hidden transition-all duration-200">
      <div>
        {/* Metric Label - Clean & Crisp without decorative corner icon */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </span>
          {target && (
            <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80">
              Target: {target}
            </span>
          )}
        </div>

        {/* Primary Value */}
        <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
          {value}
        </div>
      </div>

      {/* Delta, subtext & sparkline */}
      <div className="mt-3.5 pt-3 border-t border-slate-100/90 flex items-center justify-between text-xs">
        {change !== undefined ? (
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-bold font-mono ${
                isPositive
                  ? 'bg-emerald-50 text-emerald-700'
                  : isNegative
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isPositive && <TrendingUp className="w-3 h-3" />}
              {isNegative && <TrendingDown className="w-3 h-3" />}
              {isNeutral && <Minus className="w-3 h-3" />}
              {change > 0 ? `+${change}%` : `${change}%`}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">{period}</span>
          </div>
        ) : subtext ? (
          <span className="text-[11px] text-slate-500">{subtext}</span>
        ) : (
          <span />
        )}

        {/* Mini SVG Sparkline */}
        {sparklineData && sparklineData.length > 1 && (
          <div className="w-16 h-5 flex items-end gap-1">
            {sparklineData.map((val, idx) => {
              const max = Math.max(...sparklineData);
              const heightPct = Math.max(15, Math.round((val / max) * 100));
              return (
                <div
                  key={idx}
                  style={{ height: `${heightPct}%` }}
                  className={`flex-1 rounded-xs transition-all duration-300 ${
                    isNegative ? 'bg-rose-400' : 'bg-teal-500'
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
