import React, { useState } from 'react';
import {
  Save,
  CheckCircle,
  Plus,
  Trash2,
  Layers,
  BarChart2,
  Hash,
  Database,
  ArrowLeft,
  Settings,
} from 'lucide-react';
import { Report, ReportVisual, VisualType } from '../../types';
import { useToast } from '../Toast';

interface ReportEditorProps {
  report: Report;
  onExitEditMode: () => void;
  onSaveDraft: (updated: Report) => void;
  onPublish: (updated: Report) => void;
}

export const ReportEditor: React.FC<ReportEditorProps> = ({
  report,
  onExitEditMode,
  onSaveDraft,
  onPublish,
}) => {
  const toast = useToast();
  const [currentReport, setCurrentReport] = useState<Report>(report);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const activePage = currentReport.pages[activePageIndex] || currentReport.pages[0];
  const [selectedVisualId, setSelectedVisualId] = useState<string | null>(
    activePage?.visuals[0]?.id || null
  );

  const selectedVisual = activePage?.visuals.find((v) => v.id === selectedVisualId) || activePage?.visuals[0];

  // Handle Visual Title change
  const handleUpdateVisualTitle = (newTitle: string) => {
    if (!selectedVisual) return;
    setCurrentReport((prev) => {
      const copy = { ...prev };
      const p = copy.pages[activePageIndex];
      const vIdx = p.visuals.findIndex((v) => v.id === selectedVisual.id);
      if (vIdx !== -1) {
        p.visuals[vIdx] = { ...p.visuals[vIdx], title: newTitle };
      }
      return copy;
    });
  };

  // Handle Visual Type change
  const handleUpdateVisualType = (newType: VisualType) => {
    if (!selectedVisual) return;
    setCurrentReport((prev) => {
      const copy = { ...prev };
      const p = copy.pages[activePageIndex];
      const vIdx = p.visuals.findIndex((v) => v.id === selectedVisual.id);
      if (vIdx !== -1) {
        p.visuals[vIdx] = { ...p.visuals[vIdx], visual_type: newType };
      }
      return copy;
    });
  };

  // Handle Interaction Mode change (FILTER, HIGHLIGHT, NONE)
  const handleUpdateInteractionMode = (mode: 'FILTER' | 'HIGHLIGHT' | 'NONE') => {
    if (!selectedVisual) return;
    setCurrentReport((prev) => {
      const copy = { ...prev };
      const p = copy.pages[activePageIndex];
      const vIdx = p.visuals.findIndex((v) => v.id === selectedVisual.id);
      if (vIdx !== -1) {
        p.visuals[vIdx] = {
          ...p.visuals[vIdx],
          interaction_config: { ...p.visuals[vIdx].interaction_config, target_mode: mode },
        };
      }
      return copy;
    });
  };

  // Add a new visual
  const handleAddVisual = () => {
    const newId = `vis_${Date.now()}`;
    const newVis: ReportVisual = {
      id: newId,
      report_page_id: activePage.id,
      visual_type: 'COLUMN',
      title: 'New Analytical Visual',
      configuration: {
        measures: ['revenue'],
        dimensions: ['channel'],
        format: 'CURRENCY',
      },
      position: { col_span: 6, row_span: 2 },
      interaction_config: { target_mode: 'FILTER' },
    };
    setCurrentReport((prev) => {
      const copy = { ...prev };
      copy.pages[activePageIndex].visuals.push(newVis);
      return copy;
    });
    setSelectedVisualId(newId);
    toast.success('Visual Added', 'Configured default column visual on canvas.');
  };

  // Remove visual
  const handleDeleteVisual = (id: string) => {
    setCurrentReport((prev) => {
      const copy = { ...prev };
      copy.pages[activePageIndex].visuals = copy.pages[activePageIndex].visuals.filter((v) => v.id !== id);
      return copy;
    });
    setSelectedVisualId(null);
    toast.info('Visual Removed', 'Removed visual from page layout.');
  };

  // Publish with validation (Section 58)
  const handlePublishClick = () => {
    if (!activePage.page_question || !activePage.page_question.trim()) {
      toast.error('Validation Error', 'Each report page must state a clear analytical question before publishing.');
      return;
    }
    if (activePage.visuals.length === 0) {
      toast.error('Validation Error', 'Report must have at least 1 configured visual.');
      return;
    }
    const published = { ...currentReport, status: 'PUBLISHED' as const };
    setCurrentReport(published);
    onPublish(published);
    toast.success('Report Published', `"${currentReport.name}" is now live in reading mode.`);
  };

  return (
    <div className="space-y-3 animate-smooth-fade">
      {/* Editor Top Bar (Section 57) */}
      <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onExitEditMode}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Reader
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs tracking-tight">Report Authoring Workspace</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-teal-900/80 text-teal-300 border border-teal-700">
                Editing Mode
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Configure visual types, bound measures, and cross-interaction rules.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onSaveDraft(currentReport);
              toast.success('Draft Saved', 'Authoring state saved locally.');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors btn-press"
          >
            <Save className="w-3.5 h-3.5 text-teal-400" /> Save Draft
          </button>

          <button
            onClick={handlePublishClick}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors btn-press"
          >
            <CheckCircle className="w-3.5 h-3.5" /> Publish Report
          </button>
        </div>
      </div>

      {/* 3-Column Power BI Layout (Section 26 & 57) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* COLUMN 1: LEFT DATA / FIELDS PANE (col-span-3) */}
        <div className="lg:col-span-3 bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs space-y-3">
          <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900">Fields & Measures</h3>
              <p className="text-[10px] text-slate-400 font-mono">Model: {currentReport.semantic_model_id}</p>
            </div>
            <Database className="w-4 h-4 text-teal-600" />
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto text-xs">
            {/* Group 1: Governed Measures */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 font-mono block mb-1.5">
                Governed Measures
              </span>
              <div className="space-y-1 pl-1">
                {[
                  { name: 'revenue', label: 'Gross Revenue', unit: 'VND' },
                  { name: 'net_revenue', label: 'Net Revenue', unit: 'VND' },
                  { name: 'order_count', label: 'Order Count', unit: 'Orders' },
                  { name: 'avg_order_value', label: 'Average Ticket (AOV)', unit: 'VND' },
                  { name: 'gross_margin_pct', label: 'Gross Margin %', unit: '%' },
                ].map((m) => (
                  <div key={m.name} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded text-[11px] text-slate-700">
                    <Hash className="w-3 h-3 text-teal-600 shrink-0" />
                    <span className="font-medium">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Group 2: Dimensions */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 font-mono block mb-1.5">
                Analytical Dimensions
              </span>
              <div className="space-y-1 pl-1">
                {[
                  { name: 'channel', label: 'Sales Channel' },
                  { name: 'category', label: 'Product Category' },
                  { name: 'customer_segment', label: 'Customer Tier' },
                  { name: 'region', label: 'Geographic Region' },
                  { name: 'month', label: 'Settlement Month' },
                  { name: 'quarter', label: 'Calendar Quarter' },
                ].map((d) => (
                  <div key={d.name} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded text-[11px] text-slate-700">
                    <Layers className="w-3 h-3 text-indigo-600 shrink-0" />
                    <span className="font-medium">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-[10px] text-slate-500 leading-relaxed">
              Technical database keys and internal IDs are hidden to preserve governance.
            </div>
          </div>
        </div>

        {/* COLUMN 2: CENTER REPORT CANVAS (col-span-6) */}
        <div className="lg:col-span-6 space-y-3">
          {/* Page Question Formulation (Section 32) */}
          <div className="p-3 bg-white border border-slate-200/90 rounded-xl shadow-xs">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Page Question (Mandatory for Governance)
            </label>
            <input
              type="text"
              value={activePage?.page_question || ''}
              onChange={(e) => {
                const val = e.target.value;
                setCurrentReport((prev) => {
                  const copy = { ...prev };
                  copy.pages[activePageIndex].page_question = val;
                  return copy;
                });
              }}
              placeholder="e.g. How is consolidated revenue pacing across channels and regions?"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-teal-500 font-medium"
            />
          </div>

          {/* Canvas Wireframe Grid */}
          <div className="bg-slate-100/70 border-2 border-dashed border-slate-300 rounded-2xl p-3 min-h-[420px] space-y-3">
            {/* Page Switcher */}
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200">
              {currentReport.pages.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActivePageIndex(idx);
                    setSelectedVisualId(p.visuals[0]?.id || null);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    activePageIndex === idx
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                Active Canvas: {activePage?.name} ({activePage?.visuals.length} Visuals)
              </span>
              <button
                onClick={handleAddVisual}
                className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 hover:border-slate-400 text-slate-800 text-xs font-bold rounded-lg shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-teal-600" /> Add Visual
              </button>
            </div>

            <div className="grid grid-cols-12 gap-3">
              {(activePage?.visuals || []).map((vis) => {
                const isSelected = vis.id === selectedVisualId;
                const colSpan = vis.position?.col_span || 6;
                const spanClass =
                  colSpan === 12
                    ? 'col-span-12'
                    : colSpan === 8
                    ? 'col-span-8'
                    : colSpan === 4
                    ? 'col-span-4'
                    : 'col-span-6';

                return (
                  <div
                    key={vis.id}
                    onClick={() => setSelectedVisualId(vis.id)}
                    className={`${spanClass} p-3 bg-white rounded-xl border-2 transition-all cursor-pointer shadow-xs ${
                      isSelected
                        ? 'border-teal-600 ring-2 ring-teal-200'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <BarChart2 className="w-3.5 h-3.5 text-teal-600" />
                        <span className="text-xs font-bold text-slate-900 truncate max-w-[140px]">{vis.title}</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-600">
                        {vis.visual_type}
                      </span>
                    </div>
                    <div className="h-20 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 text-xs font-mono">
                      {vis.visual_type} Container ({vis.configuration?.measures?.join(', ') || 'measure'})
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUMN 3: RIGHT VISUAL CONFIGURATION PANE (col-span-3) */}
        <div className="lg:col-span-3 bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs space-y-4">
          <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900">Visual Configuration</h3>
            <Settings className="w-4 h-4 text-slate-400" />
          </div>

          {selectedVisual ? (
            <div className="space-y-3.5 text-xs">
              {/* Visual Title */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Visual Title</label>
                <input
                  type="text"
                  value={selectedVisual.title}
                  onChange={(e) => handleUpdateVisualTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-teal-500 font-medium text-xs"
                />
              </div>

              {/* Visual Type Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Visual Type</label>
                <select
                  value={selectedVisual.visual_type}
                  onChange={(e) => handleUpdateVisualType(e.target.value as VisualType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-teal-500"
                >
                  <option value="KPI">KPI / Metric Card</option>
                  <option value="COLUMN">Column Chart</option>
                  <option value="BAR">Bar Chart</option>
                  <option value="LINE">Line Chart</option>
                  <option value="DONUT">Donut Chart</option>
                  <option value="TABLE">Analytical Table</option>
                </select>
              </div>

              {/* Interaction Config (Section 20) */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Interaction Rule on Other Visuals
                </label>
                <select
                  value={selectedVisual.interaction_config?.target_mode || 'FILTER'}
                  onChange={(e) => handleUpdateInteractionMode(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-teal-500"
                >
                  <option value="FILTER">FILTER — Slice target visuals by selection</option>
                  <option value="HIGHLIGHT">HIGHLIGHT — Retain totals and spotlight</option>
                  <option value="NONE">NONE — Isolate visual from canvas clicks</option>
                </select>
              </div>

              {/* Delete Visual */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleDeleteVisual(selectedVisual.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100/80 rounded-lg border border-rose-200 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove Visual from Page
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Select a visual on the canvas to configure.</p>
          )}
        </div>
      </div>
    </div>
  );
};
