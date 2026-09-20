import React, { useState } from 'react';
import { Hash, ExternalLink, FileText } from 'lucide-react';
import { MetricDefinition } from '../../types';
import { Modal } from '../Modal';

interface MetricsCatalogProps {
  metrics: MetricDefinition[];
  onOpenReport?: (reportId: string) => void;
}

export const MetricsCatalog: React.FC<MetricsCatalogProps> = ({
  metrics,
  onOpenReport,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricDefinition | null>(null);

  return (
    <div className="space-y-4 animate-smooth-fade">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Governed Metrics & Measures</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Single source of truth calculations used consistently across executive dashboards, exploratory reports, and alerts.
          </p>
        </div>
      </div>

      {/* Metrics Table (Section 11) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Metric Name</th>
              <th className="px-4 py-3">Semantic Model</th>
              <th className="px-4 py-3">Expression / Formula</th>
              <th className="px-4 py-3">Format / Unit</th>
              <th className="px-4 py-3">Report Usage</th>
              <th className="px-4 py-3 text-right">Lineage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {metrics.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold">
                      <Hash className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{m.display_name}</div>
                      <span className="text-[10px] font-mono text-slate-400">{m.name}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 font-mono text-slate-600">{m.semantic_model_id}</td>
                <td className="px-4 py-3.5 font-mono text-slate-800 font-medium">{m.expression}</td>
                <td className="px-4 py-3.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {m.format_type} ({m.unit})
                  </span>
                </td>
                <td className="px-4 py-3.5 font-mono text-slate-600">
                  {m.used_in_reports_count || 3} reports
                </td>
                <td className="px-4 py-3.5 text-right">
                  <button
                    onClick={() => setSelectedMetric(m)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
                  >
                    View Lineage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Metric Detail & Lineage Modal (Section 11 & 61) */}
      {selectedMetric && (
        <Modal
          isOpen={!!selectedMetric}
          onClose={() => setSelectedMetric(null)}
          title={`Measure Lineage: ${selectedMetric.display_name}`}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            <p className="text-xs text-slate-500 -mt-2">
              Where does this number come from?
            </p>
            <p className="text-slate-600 leading-relaxed">{selectedMetric.description}</p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 font-mono text-[11px]">
              <div>
                <span className="text-slate-400 block">GOVERNED EXPRESSION</span>
                <span className="font-bold text-slate-900">{selectedMetric.expression}</span>
              </div>
              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-slate-400 block">SOURCE LINEAGE</span>
                <span className="font-semibold text-teal-700">{selectedMetric.lineage_source}</span>
              </div>
              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-slate-400 block">FORMAT &amp; UNIT</span>
                <span className="font-semibold text-slate-800">{selectedMetric.format_type} ({selectedMetric.unit})</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-900 block mb-2">Used In Reports</span>
              <div className="space-y-1.5">
                <div
                  onClick={() => {
                    setSelectedMetric(null);
                    if (onOpenReport) onOpenReport('rep_sales_performance');
                  }}
                  className="flex items-center justify-between p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    <span className="font-semibold text-slate-800">Sales Performance &amp; Channel Analytics</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
