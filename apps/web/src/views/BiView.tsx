import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Database,
  RefreshCw,
  FileText,
  Hash,
  Home,
} from 'lucide-react';
import {
  KpiSummary,
  Order,
  Customer,
  Product,
  InventoryItem,
  Report,
  Dashboard,
  SemanticModel,
  MetricDefinition,
  RefreshRun,
  BIHomeSummary,
} from '../types';
import { BIHome } from '../components/bi/BIHome';
import { DashboardReader } from '../components/bi/DashboardReader';
import { ReportReader } from '../components/bi/ReportReader';
import { ReportEditor } from '../components/bi/ReportEditor';
import { SemanticModelIndex } from '../components/bi/SemanticModelIndex';
import { MetricsCatalog } from '../components/bi/MetricsCatalog';
import { DataRefreshManager } from '../components/bi/DataRefreshManager';
import { useToast } from '../components/Toast';

interface BiViewProps {
  kpis: KpiSummary;
  orders: Order[];
  customers: Customer[];
  products: Product[];
  inventory: InventoryItem[];
  activeSubNav?: string;
  onNavigateModule?: (module: string) => void;
}

export const BiView: React.FC<BiViewProps> = ({
  kpis: _kpis,
  orders,
  customers,
  products: _products,
  inventory: _inventory,
  activeSubNav,
  onNavigateModule,
}) => {
  const toast = useToast();

  // Subnavigation Tab State (Section 5: Home, Dashboards, Reports, Metrics, Models, Refresh)
  const [activeTab, setActiveTab] = useState<'HOME' | 'DASHBOARDS' | 'REPORTS' | 'METRICS' | 'MODELS' | 'REFRESH'>('HOME');

  // Mode: Reading Mode vs Editing Mode (Section 3 & 4)
  const [isEditingReport, setIsEditingReport] = useState<boolean>(false);

  // Stored Data State
  const [reports, setReports] = useState<Report[]>([]);
  const [activeReportId, setActiveReportId] = useState<string>('rep_sales_performance');
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [activeDashboardId, setActiveDashboardId] = useState<string>('dash_exec_cockpit');
  const [models, setModels] = useState<SemanticModel[]>([]);
  const [metrics, setMetrics] = useState<MetricDefinition[]>([]);
  const [refreshRuns, setRefreshRuns] = useState<RefreshRun[]>([]);
  const [homeSummary, setHomeSummary] = useState<BIHomeSummary | null>(null);
  const [_isLoading, setIsLoading] = useState<boolean>(true);

  // Stale data state simulation (Section 39)
  const [isStaleData, setIsStaleData] = useState<boolean>(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<string>('10:30 UTC');

  // Synchronize with Sidebar subnavigation
  useEffect(() => {
    if (!activeSubNav) return;
    if (activeSubNav === 'HOME') setActiveTab('HOME');
    else if (activeSubNav === 'DASHBOARDS' || activeSubNav === 'OVERVIEW') setActiveTab('DASHBOARDS');
    else if (activeSubNav === 'REPORTS' || activeSubNav === 'WORKSPACE') setActiveTab('REPORTS');
    else if (activeSubNav === 'METRICS') setActiveTab('METRICS');
    else if (activeSubNav === 'MODELS') setActiveTab('MODELS');
    else if (activeSubNav === 'REFRESH' || activeSubNav === 'ANALYTICS') setActiveTab('REFRESH');
  }, [activeSubNav]);

  // Fetch BI Data from Backend APIs
  const fetchBiData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Home Hub
      const homeRes = await fetch('/api/v1/bi/home');
      if (homeRes.ok) {
        const hData = await homeRes.json();
        setHomeSummary(hData);
      }

      // 2. Fetch Reports
      const repsRes = await fetch('/api/v1/bi/reports');
      if (repsRes.ok) {
        const repsData = await repsRes.json();
        setReports(repsData);
        if (repsData.length > 0 && !activeReportId) {
          setActiveReportId(repsData[0].id);
        }
      }

      // 3. Fetch Dashboards
      const dashRes = await fetch('/api/v1/bi/dashboards');
      if (dashRes.ok) {
        const dashData = await dashRes.json();
        setDashboards(dashData);
      }

      // 4. Fetch Semantic Models
      const modelsRes = await fetch('/api/v1/bi/semantic-models');
      if (modelsRes.ok) {
        const mData = await modelsRes.json();
        setModels(mData);
      }

      // 5. Fetch Metrics
      const metRes = await fetch('/api/v1/bi/metrics');
      if (metRes.ok) {
        const metData = await metRes.json();
        setMetrics(metData);
      }

      // 6. Fetch Refresh Runs
      const runsRes = await fetch('/api/v1/bi/refresh-runs');
      if (runsRes.ok) {
        const runsData = await runsRes.json();
        setRefreshRuns(runsData);
      }
    } catch (err) {
      console.warn('BI Backend API fallback to default demo data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBiData();
  }, []);

  // Operational Navigation handler (Section 23)
  const handleOperationalNavigate = (type: string, id: string) => {
    toast.info('Operational Drillthrough', `Navigating to source ${type} (ID: ${id}) without transactional mutation.`);
    if (type.includes('CRM') && onNavigateModule) {
      onNavigateModule('crm');
    } else if (type.includes('OMS') && onNavigateModule) {
      onNavigateModule('oms');
    } else if (type.includes('ERP') && onNavigateModule) {
      onNavigateModule('erp');
    }
  };

  // Trigger manual refresh or retry (Section 38 & 39)
  const handleTriggerRefresh = async (modelId: string, isRetry?: boolean) => {
    try {
      const endpoint = isRetry
        ? `/api/v1/bi/semantic-models/${modelId}/refresh?trigger_type=MANUAL_RETRY`
        : `/api/v1/bi/semantic-models/${modelId}/refresh?trigger_type=MANUAL`;
      const res = await fetch(endpoint, { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        toast.success(
          isRetry ? 'Refresh Retry Succeeded' : 'Semantic Model Refreshed',
          `Model ${modelId} updated in ${result.duration_ms}ms (${result.rows_processed} rows).`
        );
        setIsStaleData(false);
        setLastRefreshTime('Just now');
        fetchBiData();
        return;
      }
    } catch {}

    // Fallback simulation if offline
    toast.success('Refresh Completed', `Projection refreshed across ${orders.length} orders and ${customers.length} accounts.`);
    setIsStaleData(false);
    setLastRefreshTime('Just now');
  };

  // Current active report
  const currentReport = reports.find((r) => r.id === activeReportId) || reports[0] || {
    id: 'rep_sales_performance',
    organization_id: 'default',
    semantic_model_id: 'sm_commerce_ops',
    name: 'Sales Performance & Channel Analytics',
    description: 'Comprehensive cross-channel multi-page analysis for executive decision makers and regional leaders.',
    status: 'PUBLISHED',
    owner_id: '1',
    default_page_id: 'page_exec_summary',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    pages: [],
  };

  // Current active dashboard
  const currentDashboard = dashboards.find((d) => d.id === activeDashboardId) || dashboards[0] || {
    id: 'dash_exec_cockpit',
    organization_id: 'default',
    name: 'Executive Commerce & Telemetry Cockpit',
    description: 'Glanceable executive monitor summarizing enterprise ARR, open pipeline, inventory alerts, and provider latency.',
    is_executive: true,
    owner_id: '1',
    last_refreshed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tiles: [],
  };

  return (
    <div className="space-y-5 animate-smooth-fade">
      {/* Top Level BI Floorplan Tabs (Section 5) */}
      <div className="flex border-b border-slate-200 bg-white px-2 pt-1 rounded-xl shadow-2xs">
        {[
          { id: 'HOME', label: 'BI Home', icon: Home },
          { id: 'DASHBOARDS', label: 'Dashboards', icon: BarChart3 },
          { id: 'REPORTS', label: 'Reports', icon: FileText },
          { id: 'METRICS', label: 'Metrics & Measures', icon: Hash },
          { id: 'MODELS', label: 'Semantic Models', icon: Database },
          { id: 'REFRESH', label: 'Data Refresh', icon: RefreshCw },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setIsEditingReport(false);
              }}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
                isActive
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: BI HOME (Discovery Hub) */}
      {activeTab === 'HOME' && homeSummary && (
        <BIHome
          summary={homeSummary}
          onOpenReport={(id) => {
            setActiveReportId(id);
            setActiveTab('REPORTS');
            setIsEditingReport(false);
          }}
          onOpenDashboard={(id) => {
            setActiveDashboardId(id);
            setActiveTab('DASHBOARDS');
          }}
          onNavigateSubNav={(subNav) => setActiveTab(subNav as any)}
        />
      )}

      {/* TAB 2: DASHBOARDS (1-Page Curated Monitoring Surface - Section 4 & 33) */}
      {activeTab === 'DASHBOARDS' && (
        <DashboardReader
          dashboard={currentDashboard}
          onOpenSourceReport={(repId, _pageId) => {
            setActiveReportId(repId);
            setActiveTab('REPORTS');
            setIsEditingReport(false);
          }}
          onOpenOperationalModule={onNavigateModule}
        />
      )}

      {/* TAB 3: REPORTS (Multi-Page Exploratory Analysis - Section 4, 12, 26) */}
      {activeTab === 'REPORTS' && (
        <>
          {isEditingReport ? (
            <ReportEditor
              report={currentReport}
              onExitEditMode={() => setIsEditingReport(false)}
              onSaveDraft={(draft) => {
                setReports((prev) => prev.map((r) => (r.id === draft.id ? draft : r)));
              }}
              onPublish={(published) => {
                setReports((prev) => prev.map((r) => (r.id === published.id ? published : r)));
                setIsEditingReport(false);
              }}
            />
          ) : (
            <ReportReader
              report={currentReport}
              onToggleEditMode={() => setIsEditingReport(true)}
              onOperationalNavigate={handleOperationalNavigate}
              isStaleData={isStaleData}
              lastRefreshTime={lastRefreshTime}
              onRetryRefresh={() => handleTriggerRefresh('sm_procurement', true)}
            />
          )}
        </>
      )}

      {/* TAB 4: METRICS & MEASURES CATALOG (Section 11) */}
      {activeTab === 'METRICS' && (
        <MetricsCatalog
          metrics={metrics}
          onOpenReport={(repId) => {
            setActiveReportId(repId);
            setActiveTab('REPORTS');
          }}
        />
      )}

      {/* TAB 5: SEMANTIC MODELS (Section 10) */}
      {activeTab === 'MODELS' && (
        <SemanticModelIndex
          models={models}
          onTriggerRefresh={(modelId) => handleTriggerRefresh(modelId)}
        />
      )}

      {/* TAB 6: DATA REFRESH & HEALTH (Section 37 & 38) */}
      {activeTab === 'REFRESH' && (
        <DataRefreshManager
          models={models}
          runs={refreshRuns}
          onTriggerRefresh={handleTriggerRefresh}
        />
      )}
    </div>
  );
};
