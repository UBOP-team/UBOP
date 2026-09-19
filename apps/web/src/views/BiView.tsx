import React, { useState } from 'react';
import {
  TrendingUp,
  Download,
  Layers,
  ArrowUpRight,
  Share2,
  RefreshCw,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { ConfigPanel, ConfigSection } from '../components/ConfigPanel';
import { useToast } from '../components/Toast';
import { KpiSummary, Order, Customer, Product, InventoryItem } from '../types';

interface BiViewProps {
  kpis: KpiSummary;
  orders: Order[];
  customers: Customer[];
  products: Product[];
  inventory: InventoryItem[];
}

export const BiView: React.FC<BiViewProps> = ({
  kpis,
  orders,
  customers,
  products,
  inventory,
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'WORKSPACE' | 'CONFIG' | 'PROVIDERS' | 'ANALYTICS'>('OVERVIEW');
  const [timeHorizon, setTimeHorizon] = useState<'7D' | '30D' | '90D' | 'YTD'>('30D');
  const [selectedDimension, setSelectedDimension] = useState<'CATEGORY' | 'CHANNEL' | 'SEGMENT'>('CATEGORY');
  const [isExporting, setIsExporting] = useState(false);

  // BI Configuration State
  const [configSections, setConfigSections] = useState<ConfigSection[]>([
    {
      title: 'Fiscal & Currency Localization',
      description: 'Define reporting base currency and financial calendar boundaries.',
      fields: [
        {
          id: 'base_currency',
          label: 'Reporting Currency',
          description: 'Standard currency used across consolidated reports.',
          type: 'select',
          value: 'USD',
          options: [
            { label: 'USD ($) - US Dollar', value: 'USD' },
            { label: 'EUR (€) - Euro', value: 'EUR' },
            { label: 'VND (₫) - Vietnam Dong', value: 'VND' },
            { label: 'GBP (£) - British Pound', value: 'GBP' },
          ],
        },
        {
          id: 'fiscal_year_start',
          label: 'Fiscal Year Starting Month',
          description: 'Used for YTD/QTD financial aggregations.',
          type: 'select',
          value: '1',
          options: [
            { label: 'January (Calendar Year)', value: '1' },
            { label: 'April (UK / Commonwealth)', value: '4' },
            { label: 'October (US Federal / Enterprise)', value: '10' },
          ],
        },
        {
          id: 'auto_fx_conversion',
          label: 'Real-time FX Conversion',
          description: 'Automatically normalize multi-currency transactions via ECB daily exchange rates.',
          type: 'toggle',
          value: true,
        },
      ],
    },
    {
      title: 'BI Anomaly Detection & Alerts',
      description: 'Algorithmic notifications for statistical outliers in revenue and inventory turnover.',
      fields: [
        {
          id: 'anomaly_sensitivity',
          label: 'Outlier Sensitivity Threshold (Z-Score)',
          description: 'Threshold deviation before triggering executive incident dispatch.',
          type: 'select',
          value: '2.5',
          options: [
            { label: 'High (Z > 1.96 - 95% Confidence)', value: '1.96' },
            { label: 'Standard (Z > 2.50 - 99% Confidence)', value: '2.5' },
            { label: 'Strict (Z > 3.00 - 99.9% Confidence)', value: '3.0' },
          ],
        },
        {
          id: 'email_digest_cadence',
          label: 'Executive Digest Dispatch',
          description: 'Scheduled PDF snapshot delivered to leadership.',
          type: 'select',
          value: 'WEEKLY',
          options: [
            { label: 'Daily Morning Brief (08:00 UTC)', value: 'DAILY' },
            { label: 'Weekly Monday Summary', value: 'WEEKLY' },
            { label: 'Monthly Close Report', value: 'MONTHLY' },
          ],
        },
      ],
    },
  ]);

  const handleConfigChange = (secIdx: number, fieldId: string, val: any) => {
    setConfigSections((prev) => {
      const copy = [...prev];
      const fields = [...copy[secIdx].fields];
      const fIdx = fields.findIndex((f) => f.id === fieldId);
      if (fIdx !== -1) {
        fields[fIdx] = { ...fields[fIdx], value: val };
        copy[secIdx] = { ...copy[secIdx], fields };
      }
      return copy;
    });
  };

  const handleSaveConfig = () => {
    toast.success('BI Configuration Saved', 'Reporting parameters and anomaly thresholds updated.');
  };

  const handleExportReport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      toast.success('Report Compiled', 'Power BI compatible analytical dataset exported to CSV.');
    }, 600);
  };

  // Dimensions
  const dimensionData = {
    CATEGORY: [
      { label: 'Enterprise Hardware', revenue: 58400, share: 42, margin: '38.5%', growth: '+24.1%' },
      { label: 'Cloud Licenses & Subscriptions', revenue: 41200, share: 30, margin: '92.0%', growth: '+31.4%' },
      { label: 'Networking & Optics', revenue: 24800, share: 18, margin: '44.2%', growth: '+12.0%' },
      { label: 'Professional Deployment Services', revenue: 13800, share: 10, margin: '61.0%', growth: '+8.7%' },
    ],
    CHANNEL: [
      { label: 'Direct Enterprise Sales (B2B)', revenue: 78500, share: 57, margin: '56.0%', growth: '+28.0%' },
      { label: 'Shopify Storefront Connector', revenue: 38200, share: 28, margin: '48.2%', growth: '+19.5%' },
      { label: 'Amazon Seller Marketplace', revenue: 21500, share: 15, margin: '39.0%', growth: '+6.2%' },
    ],
    SEGMENT: [
      { label: 'Tier-1 Strategic Accounts (> $50k)', revenue: 84200, share: 61, margin: '58.4%', growth: '+34.2%' },
      { label: 'Mid-Market Operations ($10k - $50k)', revenue: 39600, share: 29, margin: '49.1%', growth: '+18.0%' },
      { label: 'Self-Serve Emerging Accounts', revenue: 14400, share: 10, margin: '42.0%', growth: '+4.5%' },
    ],
  };

  const currentDimensionRows = dimensionData[selectedDimension];

  // Provider Data Connectors
  const biConnectors = [
    {
      id: 'bigquery',
      name: 'Google BigQuery Lakehouse',
      type: 'DATA_WAREHOUSE',
      status: 'SYNCED',
      lastSync: '4 mins ago',
      recordsProcessed: '1,420,890 rows',
      latency: '24ms',
    },
    {
      id: 'powerbi',
      name: 'Microsoft Power BI Embedded DirectQuery',
      type: 'BI_ENGINE',
      status: 'ACTIVE',
      lastSync: 'Real-time',
      recordsProcessed: 'Direct Query Push',
      latency: '18ms',
    },
    {
      id: 'snowflake',
      name: 'Snowflake Enterprise Analytical Replica',
      type: 'DATA_WAREHOUSE',
      status: 'STANDBY',
      lastSync: '1 hr ago',
      recordsProcessed: '890,210 rows',
      latency: '45ms',
    },
    {
      id: 'postgresql_olap',
      name: 'PostgreSQL TimescaleDB Analytics Node',
      type: 'TIME_SERIES',
      status: 'SYNCED',
      lastSync: '12 secs ago',
      recordsProcessed: '3,210,000 events',
      latency: '8ms',
    },
  ];

  return (
    <div className="space-y-6 animate-smooth-fade">
      {/* Header with Title & 5 Standard Tabs */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Business Intelligence & Telemetry</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                Power BI Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Consolidated operational intelligence, unit economics, cohort analysis, and cross-module telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Horizon Selector */}
            <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
              {(['7D', '30D', '90D', 'YTD'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeHorizon(r)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    timeHorizon === r
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <button
              onClick={handleExportReport}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg shadow-xs transition-colors btn-press disabled:opacity-50"
            >
              {isExporting ? (
                <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-slate-500" />
              )}
              Export Dataset
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('URI Copied', 'BI Dashboard URI copied to clipboard.');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg shadow-xs transition-colors btn-press"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500" /> Share
            </button>
          </div>
        </div>

        {/* Section 4: 5 Standard Module Tabs */}
        <div className="flex border-b border-slate-200">
          {[
            { id: 'OVERVIEW', label: 'Overview' },
            { id: 'WORKSPACE', label: 'Workspace' },
            { id: 'CONFIG', label: 'Configuration' },
            { id: 'PROVIDERS', label: 'Provider Settings' },
            { id: 'ANALYTICS', label: 'Analytics' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Executive KPI Scorecards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <MetricCard
              title="Consolidated Net Revenue"
              value={`$${kpis.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              subtext="Blended ARR run-rate: $1.42M"
              change={22.8}
              period="vs prior quarter"
              sparklineData={[52, 68, 79, 85, 94]}
            />
            <MetricCard
              title="Gross Profit Margin"
              value="54.2%"
              subtext="COGS normalized across ERP"
              change={4.1}
              period="vs target 50.0%"
              sparklineData={[48, 50, 51, 53, 54]}
            />
            <MetricCard
              title="Customer LTV / CAC"
              value="4.8x"
              subtext="Healthy enterprise benchmark"
              change={12.5}
              period="payback in 3.8 mos"
              sparklineData={[3.6, 3.9, 4.2, 4.5, 4.8]}
            />
            <MetricCard
              title="Inventory Velocity"
              value="6.4 turns/yr"
              subtext={`${kpis.low_stock_count} critical safety warnings`}
              change={-1.2}
              period="carrying cost -8.2%"
              sparklineData={[7.1, 6.9, 6.7, 6.5, 6.4]}
            />
          </div>

          {/* Analytical Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Multi-Dimensional Revenue Breakdown */}
            <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Multi-Dimensional Performance Explorer</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Slice performance by product category, sales channel, or customer tier.</p>
                </div>

                {/* Dimension Toggle */}
                <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
                  {[
                    { id: 'CATEGORY', label: 'Category' },
                    { id: 'CHANNEL', label: 'Channel' },
                    { id: 'SEGMENT', label: 'Segment' },
                  ].map((dim) => (
                    <button
                      key={dim.id}
                      onClick={() => setSelectedDimension(dim.id as any)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        selectedDimension === dim.id
                          ? 'bg-white text-slate-900 font-semibold shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {dim.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dimension Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Dimension Segment</th>
                      <th className="px-4 py-3">Volume Share</th>
                      <th className="px-4 py-3">Gross Margin</th>
                      <th className="px-4 py-3">YoY Velocity</th>
                      <th className="px-4 py-3 text-right">Net Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {currentDimensionRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5 font-medium text-slate-900 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-teal-500" />
                          {row.label}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                              <div style={{ width: `${row.share}%` }} className="h-full bg-teal-500 rounded-full" />
                            </div>
                            <span className="font-mono text-slate-500 text-[11px]">{row.share}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-700 font-semibold">{row.margin}</td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-0.5 text-emerald-700 font-mono font-bold text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded">
                            <ArrowUpRight className="w-3 h-3" /> {row.growth}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                          ${row.revenue.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Insights Card */}
            <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Algorithmic Executive Signals</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Automated telemetry insights.</p>
                </div>

                <div className="space-y-3.5 pt-4">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> High-Margin Acceleration
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Software license ARR grew 31.4% with 92% gross margins, driving corporate profitability above baseline.
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-800 font-semibold text-xs">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-600" /> Reorder Buffer Alert
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      2 core hardware SKUs are approaching safety threshold under projected Q4 fulfillment cadence.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs">
                      <Layers className="w-3.5 h-3.5 text-slate-500" /> Carrier Performance
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      ShipStation cross-carrier tracking shows 98.4% on-time delivery across standard ground lanes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Evaluated across 4 Data Streams</span>
                <span className="font-mono text-teal-700 font-semibold">100% Health</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WORKSPACE (Interactive Report Explorer) */}
      {activeTab === 'WORKSPACE' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Custom Report Workspace & Cross-Join Builder</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Join datasets across OMS orders, CRM pipeline, and ERP inventory valuation.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toast.info('Query Executed', 'Joined 3,420 rows across OMS and ERP in 14ms.')}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs transition-colors shadow-xs"
              >
                Run Analytical Query
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold">Source 1: OMS Ingestion</span>
              <div className="font-bold text-slate-900 text-xs">Total Ingested Orders</div>
              <div className="font-mono text-lg font-bold text-teal-700">{orders.length} Records</div>
              <p className="text-[11px] text-slate-500">Live order state machine & payment capture status.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold">Source 2: CRM Profiles</span>
              <div className="font-bold text-slate-900 text-xs">Managed Accounts</div>
              <div className="font-mono text-lg font-bold text-indigo-700">{customers.length} Accounts</div>
              <p className="text-[11px] text-slate-500">Unified customer profile & lifetime spend history.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold">Source 3: ERP Inventory</span>
              <div className="font-bold text-slate-900 text-xs">Master SKUs & Bins</div>
              <div className="font-mono text-lg font-bold text-emerald-700">
                {products.length} Products ({inventory.reduce((acc, i) => acc + i.quantity, 0)} Units)
              </div>
              <p className="text-[11px] text-slate-500">Warehouse stock on hand, unit cost, and safety margin.</p>
            </div>
          </div>

          {/* Sample Join Output Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Preview: Consolidated Cross-Module Ledger</span>
              <span className="font-mono text-slate-400 text-[11px]">Columns: Order #, Customer, SKU, Total, Margin</span>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-white text-slate-500 text-[11px] uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Order Ref</th>
                  <th className="px-4 py-2.5">Customer Name</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Line Items</th>
                  <th className="px-4 py-2.5 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono font-bold text-teal-700">{o.order_number}</td>
                    <td className="px-4 py-3">{o.customer_name || `Customer #${o.customer_id}`}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">{o.items.length} item(s)</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      ${o.total_amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CONFIGURATION */}
      {activeTab === 'CONFIG' && (
        <ConfigPanel
          title="Business Intelligence Engine Settings"
          subtitle="Configure fiscal calendar boundaries, currency conversions, and automated anomaly thresholds."
          sections={configSections}
          onChangeField={handleConfigChange}
          onSave={handleSaveConfig}
          onReset={() => toast.info('Reset Defaults', 'Restored baseline BI engine configuration.')}
        />
      )}

      {/* TAB 4: PROVIDER SETTINGS */}
      {activeTab === 'PROVIDERS' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Analytical Storage & BI Integrations</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Connect external data warehouses, lakehouses, and real-time Power BI reporting engines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {biConnectors.map((c) => (
              <div key={c.id} className="p-4 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl space-y-3 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-xs">
                      <Database className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-xs">{c.name}</div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">{c.type}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {c.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-slate-200/70 text-slate-500">
                  <div>
                    <span className="text-slate-400 block text-[10px]">THROUGHPUT</span>
                    <span className="font-semibold text-slate-700">{c.recordsProcessed}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">LATENCY</span>
                    <span className="font-semibold text-teal-700">{c.latency}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-slate-400 font-mono">Last sync: {c.lastSync}</span>
                  <button
                    onClick={() => toast.success(`${c.name} Triggered`, 'Forced incremental data replication cycle.')}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800"
                  >
                    Sync Now ➔
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ANALYTICS (Query Performance Telemetry) */}
      {activeTab === 'ANALYTICS' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Telemetry & Analytical Engine Performance</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Query latency, cache hit rates, materialized view refreshes, and dashboard concurrent user metrics.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Average Query Latency</span>
              <div className="font-mono text-xl font-bold text-teal-700">14.2 ms</div>
              <span className="text-[11px] text-emerald-700 font-semibold">99.8% queries under 50ms</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Redis Cache Hit Ratio</span>
              <div className="font-mono text-xl font-bold text-indigo-700">94.6%</div>
              <span className="text-[11px] text-slate-500">Materialized KPI buffer hit</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Scheduled Export SLA</span>
              <div className="font-mono text-xl font-bold text-slate-900">100.0%</div>
              <span className="text-[11px] text-emerald-700 font-semibold">0 failed automated dispatches</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
