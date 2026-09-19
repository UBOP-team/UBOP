import React, { useState } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Users,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Download,
  Share2,
  Plus,
  Sliders,
  Layers,
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { KpiSummary, Order } from '../types';
import { useToast } from '../components/Toast';

interface DashboardViewProps {
  kpis: KpiSummary;
  recentOrders: Order[];
  onSelectOrder?: (order: Order) => void;
  onNavigateTab?: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  kpis,
  recentOrders,
  onSelectOrder,
  onNavigateTab,
}) => {
  const toast = useToast();
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D' | 'YTD'>('30D');
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  const [selectedFunnelStage, setSelectedFunnelStage] = useState<string | null>(null);

  // Power BI Funnel Stages: Ingested -> Qualified -> Packed -> Shipped -> Delivered
  const funnelStages = [
    { name: 'Lead / Ingestion', count: 1420, percent: '100%', color: 'bg-blue-500' },
    { name: 'Order Confirmed', count: 1180, percent: '83.1%', color: 'bg-teal-500' },
    { name: 'Warehouse Packed', count: 980, percent: '69.0%', color: 'bg-emerald-500' },
    { name: 'Carrier In-Transit', count: 910, percent: '64.1%', color: 'bg-amber-500' },
    { name: 'Fulfill & Delivered', count: 865, percent: '60.9%', color: 'bg-indigo-500' },
  ];

  // Bar Chart Data
  const categorySales = [
    { category: 'Enterprise Hardware', value: 48, amount: '$58,400' },
    { category: 'IoT Sensor Nodes', value: 72, amount: '$86,200' },
    { category: 'Power Distribution', value: 34, amount: '$41,000' },
    { category: 'Accessories & Cables', value: 92, amount: '$24,800' },
  ];

  const salesTrends = {
    '7D': [
      { label: 'Mon', val: 42, revenue: 12400 },
      { label: 'Tue', val: 58, revenue: 16800 },
      { label: 'Wed', val: 65, revenue: 18500 },
      { label: 'Thu', val: 74, revenue: 21200 },
      { label: 'Fri', val: 89, revenue: 26400 },
      { label: 'Sat', val: 96, revenue: 29100 },
      { label: 'Sun', val: 82, revenue: 24800 },
    ],
    '30D': [
      { label: 'W1', val: 52, revenue: 84000 },
      { label: 'W2', val: 68, revenue: 112000 },
      { label: 'W3', val: 84, revenue: 138000 },
      { label: 'W4', val: 95, revenue: 148500 },
    ],
    '90D': [
      { label: 'Jul', val: 64, revenue: 290000 },
      { label: 'Aug', val: 78, revenue: 345000 },
      { label: 'Sep', val: 96, revenue: 482500 },
    ],
    'YTD': [
      { label: 'Q1', val: 54, revenue: 820000 },
      { label: 'Q2', val: 72, revenue: 1040000 },
      { label: 'Q3', val: 96, revenue: 1420000 },
    ],
  };

  const currentTrend = salesTrends[timeRange];

  const handleExport = () => {
    toast.success('Report Exported', 'Power BI telemetry dataset compiled into XLSX report.');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Share Link Copied', 'Interactive dashboard URI copied to clipboard.');
  };

  return (
    <div className="space-y-6 animate-smooth-fade">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 relative overflow-hidden shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-mono uppercase font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                Power BI Enterprise Studio
              </span>
              <span className="text-xs text-slate-400">• Real-time Analytics Fabric</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Business Intelligence & Analytics Hub
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Cross-system operational telemetry synchronizing Order Management, Warehouse Stock, Customer CRM,
              and Provider Adapters in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsBuilderMode(!isBuilderMode)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all border btn-press ${
                isBuilderMode
                  ? 'bg-teal-50 text-teal-800 border-teal-300 shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-xs'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              {isBuilderMode ? 'Exit Builder' : 'Dashboard Builder'}
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors shadow-xs btn-press"
            >
              <Share2 className="w-3.5 h-3.5 text-teal-600" /> Share
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors shadow-xs btn-press"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" /> Export
            </button>
          </div>
        </div>

        {/* Date Range & Quick Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-5 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-700">Reporting Horizon:</span>
            <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {(['7D', '30D', '90D', 'YTD'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1 rounded-md font-semibold transition-all text-xs ${
                    timeRange === r
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-emerald-700 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Live Stream Handshake 100%
            </span>
          </div>
        </div>
      </div>

      {/* Builder Mode Header Alert (if active) */}
      {isBuilderMode && (
        <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between gap-3 text-xs animate-smooth-scale">
          <div className="flex items-center gap-2 text-teal-800 font-medium">
            <Layers className="w-4 h-4 text-teal-600" />
            Power BI Visual Builder Active: Click on any widget to adjust parameters or add new visualizations.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toast.info('Add Widget', 'Select Metric, Line Chart, Bar Chart, or Funnel')}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg flex items-center gap-1 shadow-xs btn-press"
            >
              <Plus className="w-3.5 h-3.5" /> Add Component
            </button>
          </div>
        </div>
      )}

      {/* Power BI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Gross Revenue"
          value={`$${kpis.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtext={`Avg Order Value: $${kpis.avg_order_value.toFixed(2)}`}
          change={18.4}
          period="vs prior period"
          icon={DollarSign}
          colorScheme="teal"
          sparklineData={[42, 58, 65, 74, 89, 96]}
        />
        <MetricCard
          title="Fulfillment Orders"
          value={kpis.total_orders}
          subtext="Processed through OMS"
          change={12.0}
          period="omnichannel ingestion"
          icon={ShoppingCart}
          colorScheme="blue"
          sparklineData={[12, 14, 18, 22, 29]}
        />
        <MetricCard
          title="Active Accounts"
          value={kpis.total_customers}
          subtext="Managed in CRM"
          change={8.5}
          period="enterprise accounts"
          icon={Users}
          colorScheme="emerald"
        />
        <MetricCard
          title="Stock Safety Alerts"
          value={kpis.low_stock_count}
          subtext={kpis.low_stock_count > 0 ? 'Requires replenishment' : 'Optimal capacity'}
          change={kpis.low_stock_count > 0 ? -15.0 : 0}
          period="reorder threshold"
          icon={AlertTriangle}
          colorScheme={kpis.low_stock_count > 0 ? 'amber' : 'teal'}
        />
      </div>

      {/* Power BI Visuals: Line Chart & Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LINE CHART: Order Velocity & Trend */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs card-hover">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Revenue & Order Ingestion Velocity
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time throughput aggregated across Shopify, Amazon, and ERP general ledger.
              </p>
            </div>
            <span className="font-mono text-xs text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 font-semibold">
              Horizon: {timeRange}
            </span>
          </div>

          <div className="h-64 flex items-end justify-between gap-3 pt-6 pb-2 px-2">
            {currentTrend.map((item, idx) => {
              const maxVal = Math.max(...currentTrend.map((t) => t.val));
              const heightPct = Math.round((item.val / maxVal) * 100);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 bg-slate-900 border border-slate-800 px-2 py-1 rounded-md text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-20 whitespace-nowrap">
                    ${item.revenue.toLocaleString()}
                  </div>

                  <div className="w-full bg-slate-100 rounded-xl h-48 flex items-end p-1.5">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-gradient-to-t from-teal-600 to-teal-400 rounded-lg transition-all group-hover:brightness-110"
                    />
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 font-medium">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* BAR CHART: Category Revenue Distribution */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs card-hover flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Category Breakdown
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Distribution by product line</p>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              {categorySales.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">{cat.category}</span>
                    <span className="font-mono text-teal-700 font-bold">{cat.amount}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      style={{ width: `${cat.value}%` }}
                      className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Aggregated 4 Categories</span>
            <span className="font-mono text-slate-700 font-semibold">100% Normalized</span>
          </div>
        </div>
      </div>

      {/* POWER BI FUNNEL: Lead to Fulfillment Conversion Funnel */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs card-hover">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Omnichannel Operational Conversion Funnel
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Lifecycle conversion drop-off analysis: Inbound Lead ➔ Order Ingestion ➔ Picking ➔ Carrier ➔ Delivery.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedFunnelStage && (
              <span className="text-[11px] font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-semibold">
                Filtered: {selectedFunnelStage}
              </span>
            )}
            <span className="text-xs font-mono text-slate-500">
              Net Efficiency: 60.9% End-to-End
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {funnelStages.map((stage, idx) => (
            <div
              key={idx}
              onClick={() => {
                setSelectedFunnelStage(stage.name);
                toast.info('Funnel Filter', `Filtered analytics by ${stage.name}`);
              }}
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-700 font-mono text-xs flex items-center justify-center font-bold shadow-xs">
                  {idx + 1}
                </span>
                <div>
                  <div className="font-semibold text-slate-800 text-xs">{stage.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{stage.count} Volume Units</div>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:w-64">
                <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden border border-slate-200">
                  <div
                    style={{ width: stage.percent }}
                    className={`h-full ${stage.color} rounded-full transition-all`}
                  />
                </div>
                <span className="font-mono text-xs font-bold text-slate-800 w-12 text-right">
                  {stage.percent}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RECENT ORDERS TABLE (Power BI Data Grid) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="font-bold text-slate-900 text-xs">Omnichannel Order Stream</span>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('oms')}
              className="text-teal-700 hover:text-teal-800 font-semibold text-xs flex items-center gap-1"
            >
              Open in OMS <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Order ID</th>
                <th className="px-5 py-3.5">Account ID</th>
                <th className="px-5 py-3.5">Fulfillment Status</th>
                <th className="px-5 py-3.5">Total Amount</th>
                <th className="px-5 py-3.5 text-right">Date Ingested</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No orders in current buffer.
                  </td>
                </tr>
              ) : (
                recentOrders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => onSelectOrder && onSelectOrder(o)}
                    className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono font-bold text-teal-700">{o.order_number}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-500">Customer #{o.customer_id}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                      ${o.total_amount.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-slate-400 text-[11px]">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
