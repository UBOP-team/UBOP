import React from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { ReportVisual } from '../../types';

interface VisualRendererProps {
  visual: ReportVisual;
  queryData?: any[];
  isLoading?: boolean;
  hasError?: boolean;
  selectedFilterValue?: string | null;
  onSelectDataPoint?: (field: string, value: string) => void;
  onDrillDown?: (level: string, value: string) => void;
  onOperationalNavigate?: (type: string, id: string) => void;
  onRetry?: () => void;
  interactionMode?: 'FILTER' | 'HIGHLIGHT' | 'NONE';
  activeCrossFilter?: { field: string; value: string } | null;
}

export const VisualRenderer: React.FC<VisualRendererProps> = ({
  visual,
  queryData = [],
  isLoading = false,
  hasError = false,
  selectedFilterValue,
  onSelectDataPoint,
  onDrillDown: _onDrillDown,
  onOperationalNavigate,
  onRetry,
  interactionMode = 'FILTER',
  activeCrossFilter,
}) => {
  const config = visual.configuration || {};

  // Error boundary per visual
  if (hasError) {
    return (
      <div className="h-full min-h-[160px] flex flex-col items-center justify-center p-4 bg-rose-50/50 border border-rose-200 rounded-xl text-center">
        <AlertCircle className="w-5 h-5 text-rose-500 mb-2" />
        <span className="text-xs font-semibold text-rose-800">Could not load this visual</span>
        <span className="text-[11px] text-slate-500 mt-0.5 mb-2.5 max-w-[200px]">
          Other report data remains accessible.
        </span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 px-2.5 py-1 bg-white border border-rose-300 text-rose-700 text-xs font-medium rounded-md hover:bg-rose-100/50 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Retry
          </button>
        )}
      </div>
    );
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="h-full min-h-[160px] p-4 bg-white border border-slate-200 rounded-xl animate-pulse space-y-3">
        <div className="h-3 w-1/3 bg-slate-200 rounded" />
        <div className="h-10 w-2/3 bg-slate-100 rounded" />
        <div className="h-20 w-full bg-slate-50 rounded" />
      </div>
    );
  }

  // RENDER BASED ON VISUAL TYPE
  switch (visual.visual_type) {
    case 'KPI': {
      const val = config.value || (queryData[0] && (queryData[0].revenue ? `$${Number(queryData[0].revenue).toLocaleString()}` : queryData[0].order_count || '0')) || '$2,840,000';
      const changeText = config.comparison_text || '+12.4% vs previous period';
      const isPositive = !changeText.includes('-');

      return (
        <div className="h-full p-4 bg-white border border-slate-200/90 rounded-xl shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 tracking-tight">{visual.title}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tracking-tight">
              {val}
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className={`inline-flex items-center gap-0.5 font-mono font-bold text-[11px] ${isPositive ? 'text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded' : 'text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded'}`}>
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {changeText}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Governed Metric</span>
          </div>
        </div>
      );
    }

    case 'LINE': {
      // Monthly trajectory line chart
      const points = queryData.length > 0 ? queryData : [
        { month: 'Jul', revenue: 142000 },
        { month: 'Aug', revenue: 198500 },
        { month: 'Sep', revenue: 284000 },
      ];
      const maxVal = Math.max(...points.map((p) => p.revenue || 1), 300000);

      return (
        <div className="h-full p-4 bg-white border border-slate-200/90 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div>
              <h4 className="text-xs font-bold text-slate-900">{visual.title}</h4>
              {config.chart_subtitle && (
                <p className="text-[11px] text-slate-500">{config.chart_subtitle}</p>
              )}
            </div>
            {config.drill_enabled && (
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                Drill: Year &gt; Quarter &gt; Month
              </span>
            )}
          </div>

          {/* SVG Line visualization */}
          <div className="h-36 w-full flex items-end justify-between gap-3 pt-4 px-2">
            {points.map((pt, idx) => {
              const heightPct = Math.round(((pt.revenue || 0) / maxVal) * 80) + 10;
              const isSelected = selectedFilterValue === pt.month;
              return (
                <div
                  key={idx}
                  onClick={() => onSelectDataPoint && onSelectDataPoint('month', pt.month)}
                  className={`flex-1 flex flex-col items-center gap-1.5 cursor-pointer group transition-transform ${isSelected ? 'scale-105' : 'opacity-90 hover:opacity-100'}`}
                >
                  <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-900">
                    ${Math.round((pt.revenue || 0) / 1000)}k
                  </span>
                  <div className="w-full h-24 flex items-end justify-center">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-3/5 rounded-t-md transition-all ${
                        isSelected
                          ? 'bg-teal-600 shadow-md ring-2 ring-teal-300'
                          : 'bg-teal-500 group-hover:bg-teal-600'
                      }`}
                    />
                  </div>
                  <span className={`text-[11px] font-semibold ${isSelected ? 'text-teal-800 font-bold underline' : 'text-slate-700'}`}>
                    {pt.month}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Aggregated by Monthly Settlement</span>
            <span>Click point to filter page</span>
          </div>
        </div>
      );
    }

    case 'BAR':
    case 'COLUMN': {
      // Channel or Category breakdown
      const bars = queryData.length > 0 ? queryData : [
        { channel: 'Direct B2B', revenue: 745000, share: 52 },
        { channel: 'Shopify', revenue: 425500, share: 30 },
        { channel: 'Amazon Marketplace', revenue: 224000, share: 18 },
      ];
      const maxRev = Math.max(...bars.map((b) => b.revenue || 1), 800000);

      return (
        <div className="h-full p-4 bg-white border border-slate-200/90 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div>
              <h4 className="text-xs font-bold text-slate-900">{visual.title}</h4>
              <p className="text-[11px] text-slate-500">Cross-filters all associated report visuals</p>
            </div>
            {activeCrossFilter && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Filtered: {activeCrossFilter.value}
              </span>
            )}
          </div>

          <div className="space-y-2.5 py-1">
            {bars.map((b, idx) => {
              const label = b.channel || b.category || b.group || `Segment ${idx + 1}`;
              const val = b.revenue || b.volume || 0;
              const pct = Math.round((val / maxRev) * 100);
              const isSelected = activeCrossFilter?.value === label;
              const isDimmed = activeCrossFilter && activeCrossFilter.value !== label && interactionMode === 'FILTER';

              return (
                <div
                  key={idx}
                  onClick={() => onSelectDataPoint && onSelectDataPoint('channel', label)}
                  className={`p-2 rounded-lg cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-teal-50/80 border-teal-300 shadow-xs'
                      : isDimmed
                      ? 'opacity-40 border-transparent hover:opacity-80'
                      : 'hover:bg-slate-50 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-teal-600 ring-2 ring-teal-300' : 'bg-slate-400'}`} />
                      {label}
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      ${Number(val).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full transition-all ${
                        isSelected ? 'bg-teal-600' : 'bg-teal-500'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Visual Mode: {visual.interaction_config?.target_mode || 'FILTER'}</span>
            <span>Click row to toggle focus</span>
          </div>
        </div>
      );
    }

    case 'DONUT': {
      const slices = queryData.length > 0 ? queryData : [
        { channel: 'Shopify Storefront', order_count: 58, pct: 45 },
        { channel: 'Direct Enterprise B2B', order_count: 42, pct: 33 },
        { channel: 'Amazon Marketplace', order_count: 28, pct: 22 },
      ];

      return (
        <div className="h-full p-4 bg-white border border-slate-200/90 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="pb-2 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-900">{visual.title}</h4>
            <p className="text-[11px] text-slate-500">Order share breakdown</p>
          </div>

          <div className="flex items-center justify-center gap-6 py-3">
            {/* Donut representation */}
            <div className="relative w-24 h-24 rounded-full border-8 border-teal-500 flex items-center justify-center shadow-inner">
              <div className="text-center">
                <span className="text-xs font-bold font-mono text-slate-900 block">100%</span>
                <span className="text-[9px] text-slate-400 uppercase">Share</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              {slices.map((s, idx) => {
                const label = s.channel || s.category || `Slice ${idx + 1}`;
                const colors = ['bg-teal-500', 'bg-indigo-500', 'bg-amber-500'];
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${colors[idx % colors.length]}`} />
                    <span className="text-slate-600 text-[11px]">{label}</span>
                    <span className="font-mono font-semibold text-slate-900 text-[11px] ml-auto">
                      {s.order_count || s.volume || 0}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
            Normalized across multi-channel settlement
          </div>
        </div>
      );
    }

    case 'TABLE':
    default: {
      // Analytical table with operational deep-links
      const rows = queryData.length > 0 ? queryData : [
        { channel: 'Direct B2B', category: 'Hardware', revenue: 745000, order_count: 24, gross_margin_pct: 38.5, entity_reference: { type: 'CRM_ACCOUNT', id: '1', label: 'Acme Corp' } },
        { channel: 'Shopify', category: 'Cloud Licenses', revenue: 425500, order_count: 52, gross_margin_pct: 92.0, entity_reference: { type: 'OMS_ORDER', id: 'ORD-101', label: 'ORD-101' } },
        { channel: 'Amazon Marketplace', category: 'Networking', revenue: 224000, order_count: 35, gross_margin_pct: 44.2, entity_reference: { type: 'ERP_ITEM', id: '1', label: 'Edge Server' } },
      ];

      return (
        <div className="h-full p-4 bg-white border border-slate-200/90 rounded-xl shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-xs font-bold text-slate-900">{visual.title}</h4>
              <p className="text-[11px] text-slate-500">Multidimensional analytical ledger with operational record drill-through</p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {rows.length} Rows
            </span>
          </div>

          <div className="overflow-x-auto py-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2">Channel</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2 text-right">Orders</th>
                  <th className="px-3 py-2 text-right">Margin %</th>
                  <th className="px-3 py-2 text-right">Revenue</th>
                  <th className="px-3 py-2 text-center">Operational Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {rows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-3 py-2 font-medium text-slate-900">{r.channel || 'All'}</td>
                    <td className="px-3 py-2 text-slate-600">{r.category || 'General'}</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-600">{r.order_count || r.volume || 0}</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-700">
                      {r.gross_margin_pct ? `${r.gross_margin_pct}%` : '42.0%'}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                      ${Number(r.revenue || 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {r.entity_reference ? (
                        <button
                          onClick={() => onOperationalNavigate && onOperationalNavigate(r.entity_reference.type, r.entity_reference.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-800 hover:underline cursor-pointer"
                          title={`Navigate to source ${r.entity_reference.type}`}
                        >
                          {r.entity_reference.label}
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-slate-400 font-mono text-[10px]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Read-only Analytical Projection</span>
            <span>Click operational link to inspect source record</span>
          </div>
        </div>
      );
    }
  }
};
