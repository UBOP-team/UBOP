import React from 'react';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  change?: number; // e.g. +14.2 or -3.5
  period?: string; // e.g. "vs last 30 days"
  target?: string;
  icon?: LucideIcon;
  colorScheme?: 'teal' | 'emerald' | 'blue' | 'indigo' | 'amber' | 'rose' | 'purple';
  sparklineData?: number[];
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtext,
  change,
  period = 'vs prior period',
  target,
  icon: Icon,
  colorScheme = 'teal',
  sparklineData,
}) => {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change !== undefined && change === 0;

  const colorVariants = {
    teal: 'from-teal-500/10 to-teal-500/0 text-teal-400 border-teal-500/30',
    emerald: 'from-emerald-500/10 to-emerald-500/0 text-emerald-400 border-emerald-500/30',
    blue: 'from-blue-500/10 to-blue-500/0 text-blue-400 border-blue-500/30',
    indigo: 'from-indigo-500/10 to-indigo-500/0 text-indigo-400 border-indigo-500/30',
    amber: 'from-amber-500/10 to-amber-500/0 text-amber-400 border-amber-500/30',
    rose: 'from-rose-500/10 to-rose-500/0 text-rose-400 border-rose-500/30',
    purple: 'from-purple-500/10 to-purple-500/0 text-purple-400 border-purple-500/30',
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-md relative overflow-hidden group">
      {/* Subtle gradient background glow */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${colorVariants[colorScheme]} rounded-full blur-2xl opacity-30 pointer-events-none group-hover:opacity-60 transition-opacity`}
      />

      <div>
        {/* Top line: Title & Icon */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-medium">
            {title}
          </span>
          {Icon && (
            <div className={`p-1.5 rounded-lg bg-slate-900 border border-slate-800/80 ${colorVariants[colorScheme].split(' ')[2]}`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Primary Value */}
        <div className="text-2xl font-bold tracking-tight text-slate-100 font-mono">
          {value}
        </div>
      </div>

      {/* Bottom line: Change Delta, Target, or Sparkline */}
      <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
        {change !== undefined ? (
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                isPositive
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : isNegative
                  ? 'bg-rose-500/15 text-rose-400'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isPositive && <TrendingUp className="w-3 h-3" />}
              {isNegative && <TrendingDown className="w-3 h-3" />}
              {isNeutral && <Minus className="w-3 h-3" />}
              {change > 0 ? `+${change}%` : `${change}%`}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">{period}</span>
          </div>
        ) : subtext ? (
          <span className="text-[11px] text-slate-400">{subtext}</span>
        ) : (
          <span />
        )}

        {target && (
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
            Target: {target}
          </span>
        )}

        {/* Mini SVG Sparkline */}
        {sparklineData && sparklineData.length > 1 && (
          <div className="w-16 h-5 flex items-end gap-0.5">
            {sparklineData.map((val, idx) => {
              const max = Math.max(...sparklineData);
              const heightPct = Math.max(15, Math.round((val / max) * 100));
              return (
                <div
                  key={idx}
                  style={{ height: `${heightPct}%` }}
                  className={`flex-1 rounded-t-sm transition-all ${
                    isNegative ? 'bg-rose-500/60 group-hover:bg-rose-400' : 'bg-teal-500/60 group-hover:bg-teal-400'
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
