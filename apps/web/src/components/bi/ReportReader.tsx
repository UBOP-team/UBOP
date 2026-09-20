import React, { useState } from 'react';
import {
  RotateCcw,
  Bookmark as BookmarkIcon,
  Download,
  Edit3,
  RefreshCw,
  AlertTriangle,
  SlidersHorizontal,
  Database,
} from 'lucide-react';
import { Report, AnalyticalFilter, AnalyticalBookmark } from '../../types';
import { ReportPageTabs } from './ReportPageTabs';
import { Slicer } from './Slicer';
import { FiltersPane } from './FiltersPane';
import { DrillControls } from './DrillControls';
import { VisualRenderer } from './VisualRenderer';
import { BookmarkModal } from './BookmarkModal';
import { useToast } from '../Toast';

interface ReportReaderProps {
  report: Report;
  onToggleEditMode?: () => void;
  onOperationalNavigate?: (type: string, id: string) => void;
  isStaleData?: boolean;
  lastRefreshTime?: string;
  onRetryRefresh?: () => void;
}

export const ReportReader: React.FC<ReportReaderProps> = ({
  report,
  onToggleEditMode,
  onOperationalNavigate,
  isStaleData = false,
  lastRefreshTime = '10:30 UTC',
  onRetryRefresh,
}) => {
  const toast = useToast();
  const pages = report.pages || [];
  const [activePageId, setActivePageId] = useState<string>(report.default_page_id || pages[0]?.id || '');
  const activePage = pages.find((p) => p.id === activePageId) || pages[0];

  // Slicer States
  const [timeHorizon, setTimeHorizon] = useState<'7D' | '30D' | '90D' | 'YTD'>('30D');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');

  // Cross-filtering and Highlighting state
  const [activeCrossFilter, setActiveCrossFilter] = useState<{ field: string; value: string } | null>(null);

  // Drill Hierarchy State
  const [drillHierarchy, setDrillHierarchy] = useState<string[]>(['2026', 'Q3']);
  const [drillthroughContext, setDrillthroughContext] = useState<{ entity: string; id: string; name: string } | null>(null);

  // Filters Pane State
  const [isFiltersPaneOpen, setIsFiltersPaneOpen] = useState(false);
  const [pageFilters, setPageFilters] = useState<AnalyticalFilter[]>(activePage?.default_filter_state || []);
  const [reportFilters, setReportFilters] = useState<AnalyticalFilter[]>([
    { field: 'fiscal_year', operator: 'EQUALS', values: ['2026'], scope: 'REPORT', display_label: 'Fiscal Year' },
  ]);
  const [focusedVisualFilter, setFocusedVisualFilter] = useState<AnalyticalFilter | null>(null);

  // Bookmarks State
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<AnalyticalBookmark[]>([
    {
      id: 'bm-1',
      report_id: report.id,
      user_id: 'current_user',
      name: 'Vietnam Shopify Q3',
      is_default: false,
      state: {
        active_page_id: pages[0]?.id,
        slicers: { channel: 'Shopify', region: 'Vietnam', horizon: '90D' },
      },
      created_at: '2026-09-20T10:00:00Z',
    },
  ]);

  // Handle Slicer and Cross-filter reset
  const handleResetToDefaults = () => {
    setTimeHorizon('30D');
    setSelectedChannel('ALL');
    setSelectedRegion('ALL');
    setActiveCrossFilter(null);
    setDrillHierarchy(['2026', 'Q3']);
    setDrillthroughContext(null);
    setFocusedVisualFilter(null);
    setPageFilters(activePage?.default_filter_state || []);
    toast.info('Report Reset', 'Restored report defaults for filters, slicers, and visuals.');
  };

  // Click on visual data point (Cross-filter / Cross-highlight)
  const handleSelectDataPoint = (field: string, val: string) => {
    if (activeCrossFilter?.value === val) {
      // Toggle off
      setActiveCrossFilter(null);
      setFocusedVisualFilter(null);
      toast.info('Filter Cleared', `Removed cross-filter on ${field}.`);
    } else {
      setActiveCrossFilter({ field, value: val });
      setFocusedVisualFilter({
        field,
        operator: 'EQUALS',
        values: [val],
        scope: 'VISUAL',
        display_label: `Visual Cross-Filter: ${val}`,
      });
      toast.success('Cross-Filter Applied', `Filtered report visuals for ${field} = "${val}".`);
    }
  };

  // Apply Bookmark
  const handleApplyBookmark = (bm: AnalyticalBookmark) => {
    if (bm.state.active_page_id) setActivePageId(bm.state.active_page_id);
    if (bm.state.slicers) {
      if (bm.state.slicers.channel) setSelectedChannel(bm.state.slicers.channel);
      if (bm.state.slicers.region) setSelectedRegion(bm.state.slicers.region);
      if (bm.state.slicers.horizon) setTimeHorizon(bm.state.slicers.horizon);
    }
    toast.success('Bookmark Applied', `Loaded view "${bm.name}".`);
  };

  // Save Bookmark
  const handleSaveBookmark = (name: string, isDef: boolean) => {
    const newBm: AnalyticalBookmark = {
      id: `bm-${Date.now()}`,
      report_id: report.id,
      user_id: 'current_user',
      name,
      is_default: isDef,
      state: {
        active_page_id: activePageId,
        slicers: { channel: selectedChannel, region: selectedRegion, horizon: timeHorizon },
      },
      created_at: new Date().toISOString(),
    };
    setBookmarks((prev) => [newBm, ...prev]);
    setIsBookmarkModalOpen(false);
    toast.success('Bookmark Saved', `Saved view "${name}".`);
  };

  // Export dataset
  const handleExport = () => {
    toast.success('Export Dispatched', 'Filtered analytical dataset compiled to CSV.');
  };

  return (
    <div className="space-y-4 animate-smooth-fade relative">
      {/* Stale Data Warning Banner (Section 39 & 40) */}
      {isStaleData && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Data may be stale.</span> Last successful refresh was{' '}
              <span className="font-mono font-semibold">{lastRefreshTime}</span>. Report remains readable using cached projection.
            </div>
          </div>
          {onRetryRefresh && (
            <button
              onClick={onRetryRefresh}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-[11px] shadow-xs transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Retry Refresh
            </button>
          )}
        </div>
      )}

      {/* Reading Mode Header & Toolbar (Section 12) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">{report.name}</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              {report.status}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Model: {report.semantic_model_id}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{report.description || 'Exploratory multi-page decision-support report.'}</p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 font-mono">
            <Database className="w-3.5 h-3.5 text-teal-600" />
            <span>Refreshed: {lastRefreshTime}</span>
          </div>

          <button
            onClick={handleResetToDefaults}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors btn-press"
            title="Reset filters, slicers, and drilldown to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" /> Reset
          </button>

          <button
            onClick={() => setIsBookmarkModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors btn-press"
            title="Save or restore analytical bookmarks"
          >
            <BookmarkIcon className="w-3.5 h-3.5 text-slate-500" /> Bookmarks
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors btn-press"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export
          </button>

          <button
            onClick={() => setIsFiltersPaneOpen(!isFiltersPaneOpen)}
            className={`flex items-center gap-1 px-2.5 py-1.5 border text-xs font-semibold rounded-lg shadow-2xs transition-colors btn-press ${
              isFiltersPaneOpen
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
          </button>

          {onToggleEditMode && (
            <button
              onClick={onToggleEditMode}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors btn-press"
              title="Switch to Report Authoring Mode"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Report
            </button>
          )}
        </div>
      </div>

      {/* Report Page Tabs (Section 13) */}
      <ReportPageTabs
        pages={pages}
        activePageId={activePageId}
        onSelectPage={(id) => {
          setActivePageId(id);
          setActiveCrossFilter(null);
        }}
      />

      {/* On-Canvas Slicers Bar (Section 16) */}
      <Slicer
        timeHorizon={timeHorizon}
        onChangeTimeHorizon={setTimeHorizon}
        selectedChannel={selectedChannel}
        onChangeChannel={setSelectedChannel}
        selectedRegion={selectedRegion}
        onChangeRegion={setSelectedRegion}
        onResetSlicers={() => {
          setSelectedChannel('ALL');
          setSelectedRegion('ALL');
          setTimeHorizon('30D');
        }}
        isFiltered={selectedChannel !== 'ALL' || selectedRegion !== 'ALL' || timeHorizon !== '30D'}
      />

      {/* Drill Hierarchy Controls (Section 21 & 22) */}
      <DrillControls
        currentHierarchy={drillHierarchy}
        onDrillUp={() => {
          if (drillHierarchy.length > 1) {
            setDrillHierarchy((prev) => prev.slice(0, -1));
          }
        }}
        canDrillUp={drillHierarchy.length > 1}
        drillthroughContext={drillthroughContext}
        onClearDrillthrough={() => setDrillthroughContext(null)}
      />

      {/* Main Reading Canvas with Optional Filters Pane Overlay */}
      <div className="flex gap-4 items-start">
        {/* Visuals Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
          {(activePage?.visuals || []).map((vis) => {
            const colSpan = vis.position?.col_span || 6;
            const spanClass =
              colSpan === 12
                ? 'md:col-span-12'
                : colSpan === 8
                ? 'md:col-span-8'
                : colSpan === 4
                ? 'md:col-span-4'
                : colSpan === 3
                ? 'md:col-span-3'
                : 'md:col-span-6';

            return (
              <div key={vis.id} className={spanClass}>
                <VisualRenderer
                  visual={vis}
                  selectedFilterValue={activeCrossFilter?.value}
                  onSelectDataPoint={handleSelectDataPoint}
                  onOperationalNavigate={onOperationalNavigate}
                  activeCrossFilter={activeCrossFilter}
                  interactionMode={vis.interaction_config?.target_mode || 'FILTER'}
                />
              </div>
            );
          })}
        </div>

        {/* Collapsible Filters Pane */}
        <FiltersPane
          isOpen={isFiltersPaneOpen}
          onToggle={() => setIsFiltersPaneOpen(!isFiltersPaneOpen)}
          reportFilters={reportFilters}
          pageFilters={pageFilters}
          visualFilter={focusedVisualFilter}
          onClearFilter={(field, scope) => {
            if (scope === 'VISUAL') setFocusedVisualFilter(null);
            else if (scope === 'PAGE') setPageFilters((prev) => prev.filter((f) => f.field !== field));
            else if (scope === 'REPORT') setReportFilters((prev) => prev.filter((f) => f.field !== field));
            toast.info('Filter Removed', `Removed filter on ${field}.`);
          }}
          onResetAllFilters={() => {
            setFocusedVisualFilter(null);
            setPageFilters([]);
            setActiveCrossFilter(null);
            toast.info('Filters Cleared', 'Reset all local and page filters.');
          }}
        />
      </div>

      {/* Bookmark Modal */}
      <BookmarkModal
        isOpen={isBookmarkModalOpen}
        onClose={() => setIsBookmarkModalOpen(false)}
        bookmarks={bookmarks}
        onApplyBookmark={handleApplyBookmark}
        onSaveBookmark={handleSaveBookmark}
      />
    </div>
  );
};
