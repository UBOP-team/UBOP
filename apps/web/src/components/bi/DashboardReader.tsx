import React from 'react';
import {
  ExternalLink,
  Clock,
  Share2,
  ArrowUpRight,
  BarChart3,
} from 'lucide-react';
import { Dashboard } from '../../types';
import { useToast } from '../Toast';

interface DashboardReaderProps {
  dashboard: Dashboard;
  onOpenSourceReport?: (reportId: string, pageId?: string) => void;
  onOpenOperationalModule?: (module: string) => void;
}

export const DashboardReader: React.FC<DashboardReaderProps> = ({
  dashboard,
  onOpenSourceReport,
  onOpenOperationalModule: _onOpenOperationalModule,
}) => {
  const toast = useToast();
  const tiles = dashboard.tiles || [];

  return (
    <div className="space-y-5 animate-smooth-fade">
      {/* Executive Header (Section 33) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">{dashboard.name}</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Executive Monitor
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{dashboard.description || 'One-page curated operational telemetry.'}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 font-mono">
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            <span>Refreshed: 10:30 UTC</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success('URI Copied', 'Executive dashboard link copied to clipboard.');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors btn-press"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" /> Share
          </button>
        </div>
      </div>

      {/* Grid of Pinned Tiles (Section 33 & 34) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {tiles.map((t) => {
          const colSpan = t.position?.col_span || 6;
          const spanClass =
            colSpan === 3
              ? 'md:col-span-3'
              : colSpan === 4
              ? 'md:col-span-4'
              : colSpan === 6
              ? 'md:col-span-6'
              : 'md:col-span-12';

          const cfg = t.configuration || {};
          const isKpi = t.tile_type === 'METRIC_CARD';

          return (
            <div
              key={t.id}
              className={`${spanClass} bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900 tracking-tight">{t.title}</span>
                  {cfg.source_report_id ? (
                    <button
                      onClick={() =>
                        onOpenSourceReport &&
                        onOpenSourceReport(cfg.source_report_id!, cfg.page_id)
                      }
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-700 hover:text-teal-800 hover:underline"
                      title="Open source report"
                    >
                      Report <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                </div>

                {isKpi ? (
                  <div className="py-2">
                    <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                      {cfg.value || '$2,840,000'}
                    </div>
                    {cfg.subtext && <p className="text-[11px] text-slate-500 mt-0.5">{cfg.subtext}</p>}
                  </div>
                ) : (
                  <div className="h-32 bg-slate-50 rounded-xl p-3 flex flex-col items-center justify-center text-center space-y-1.5">
                    <BarChart3 className="w-6 h-6 text-teal-600" />
                    <span className="text-xs font-semibold text-slate-800">
                      Pinned Exploratory Visual
                    </span>
                    <p className="text-[10px] text-slate-500">
                      Aggregated live from &quot;Sales Performance &amp; Channel Analytics&quot;
                    </p>
                  </div>
                )}
              </div>

              {/* Tile Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                {cfg.change ? (
                  <span className="inline-flex items-center gap-0.5 font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                    <ArrowUpRight className="w-3 h-3" /> {cfg.change}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-400">Curated Tile</span>
                )}
                <span className="text-[10px] text-slate-400 font-mono">10:30 UTC Sync</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
