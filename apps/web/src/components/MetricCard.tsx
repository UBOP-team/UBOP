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

  // Generate continuous SVG sparkline path
  const sparklineSvg = (() => {
    if (!sparklineData || sparklineData.length < 2) return null;
    const w = 64;
    const h = 20;
    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max === min ? 1 : max - min;
    const pts = sparklineData.map((v, i) => {
      const x = (i / (sparklineData.length - 1)) * w;
      const y = h - 2 - ((v - min) / range) * (h - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M ${pts.join(' L ')}`;
  })();

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between card-hover shadow-enterprise hover:shadow-enterprise-hover inset-highlight relative overflow-hidden transition-all duration-200">
      <div>
        {/* Metric Label - Linear / Stripe standard */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            {title}
          </span>
          {target && (
            <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
              Target: {target}
            </span>
          )}
        </div>

        {/* Primary Value */}
        <div className="text-2xl font-bold tracking-tight text-slate-950 tabular-nums">
          {value}
        </div>
      </div>

      {/* Delta, subtext & continuous hairline sparkline */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        {change !== undefined ? (
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold tabular-nums border ${
                isPositive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                  : isNegative
                  ? 'bg-rose-50 text-rose-700 border-rose-200/60'
                  : 'bg-slate-50 text-slate-600 border-slate-200/60'
              }`}
            >
              {isPositive && <TrendingUp className="w-3 h-3" />}
              {isNegative && <TrendingDown className="w-3 h-3" />}
              {isNeutral && <Minus className="w-3 h-3" />}
              {change > 0 ? `+${change}%` : `${change}%`}
            </span>
            <span className="text-[11px] text-slate-400 font-medium truncate">{period}</span>
          </div>
        ) : subtext ? (
          <span className="text-[11px] text-slate-400 truncate">{subtext}</span>
        ) : (
          <span />
        )}

        {/* Continuous SVG Hairline Sparkline (Stripe style) */}
        {sparklineSvg && (
          <svg className="w-16 h-5 shrink-0 overflow-visible" viewBox="0 0 64 20">
            <path
              d={sparklineSvg}
              fill="none"
              stroke={isNegative ? '#f43f5e' : '#0f172a'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </div>
  );
};
