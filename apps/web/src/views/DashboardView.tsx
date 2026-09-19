import React, { useState } from 'react';
import { ArrowUpRight, Download, Share2 } from 'lucide-react';
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
  const [selectedFunnelStage, setSelectedFunnelStage] = useState<string | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

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
      { label: 'Week 1', val: 52, revenue: 84000 },
      { label: 'Week 2', val: 68, revenue: 112000 },
      { label: 'Week 3', val: 84, revenue: 138000 },
      { label: 'Week 4', val: 95, revenue: 148500 },
    ],
    '90D': [
      { label: 'Jul 2026', val: 64, revenue: 290000 },
      { label: 'Aug 2026', val: 78, revenue: 345000 },
      { label: 'Sep 2026', val: 96, revenue: 482500 },
    ],
    'YTD': [
      { label: 'Q1 FY26', val: 54, revenue: 820000 },
      { label: 'Q2 FY26', val: 72, revenue: 1040000 },
      { label: 'Q3 FY26', val: 96, revenue: 1420000 },
    ],
  };

  const currentTrend = salesTrends[timeRange];

  // SVG Area Chart Calculations
  const svgWidth = 720;
  const svgHeight = 220;
  const padX = 40;
  const padYTop = 25;
  const padYBottom = 30;
  const plotWidth = svgWidth - padX * 2;
  const plotHeight = svgHeight - padYTop - padYBottom;

  const maxRevenue = Math.max(...currentTrend.map((t) => t.revenue)) * 1.12;
  const minRevenue = 0;

  const chartPoints = currentTrend.map((item, i) => {
    const x = padX + (currentTrend.length === 1 ? plotWidth / 2 : (i / (currentTrend.length - 1)) * plotWidth);
    const y = padYTop + plotHeight - ((item.revenue - minRevenue) / (maxRevenue - minRevenue)) * plotHeight;
    return { ...item, x, y };
  });

  const linePath = chartPoints.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    const prev = chartPoints[i - 1];
    const cpX1 = (prev.x + (pt.x - prev.x) / 2).toFixed(1);
    const cpX2 = cpX1;
    return `${acc} C ${cpX1} ${prev.y.toFixed(1)}, ${cpX2} ${pt.y.toFixed(1)}, ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
  }, '');

  const areaPath = `${linePath} L ${chartPoints[chartPoints.length - 1].x.toFixed(1)} ${(padYTop + plotHeight).toFixed(1)} L ${chartPoints[0].x.toFixed(1)} ${(padYTop + plotHeight).toFixed(1)} Z`;

  const activeHoverItem = hoverIndex !== null ? chartPoints[hoverIndex] : null;

  const handleExport = () => {
    toast.success('Report Exported', 'Power BI telemetry dataset compiled into XLSX report.');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Share Link Copied', 'Interactive dashboard URI copied to clipboard.');
  };

  return (
    <div className="space-y-6 animate-smooth-fade">
      {/* Top Header & Operational Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Executive Overview</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Stream
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time telemetry aggregated across orders, inventory, customer pipeline, and integrations.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Horizon Selector (Segmented control) */}
          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
            {(['7D', '30D', '90D', 'YTD'] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setTimeRange(r);
                  setHoverIndex(null);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  timeRange === r
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-medium rounded-lg transition-colors shadow-xs btn-press"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-medium rounded-lg transition-colors shadow-xs btn-press"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" /> Share
          </button>
        </div>
      </div>

      {/* Precision KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Total Revenue"
          value={`$${kpis.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtext={`Avg order: $${kpis.avg_order_value.toFixed(2)}`}
          change={18.4}
          period="vs prior month"
          sparklineData={[42, 58, 65, 74, 89, 96]}
        />
        <MetricCard
          title="Fulfillment Orders"
          value={kpis.total_orders}
          subtext="Processed through OMS"
          change={12.0}
          period="vs prior month"
          sparklineData={[12, 14, 18, 22, 29]}
        />
        <MetricCard
          title="Active Customers"
          value={kpis.total_customers}
          subtext="Managed in CRM"
          change={8.5}
          period="vs prior month"
          sparklineData={[10, 12, 14, 16, 20]}
        />
        <MetricCard
          title="Stock Safety Alerts"
          value={kpis.low_stock_count}
          subtext={kpis.low_stock_count > 0 ? 'Requires replenishment' : 'Optimal capacity'}
          change={kpis.low_stock_count > 0 ? -15.0 : 0}
          period="reorder threshold < 10"
        />
      </div>

      {/* Power BI Visuals: Interactive SVG Area Chart & Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* STRIPE-GRADE INTERACTIVE SVG AREA CHART */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-enterprise card-hover relative">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Revenue & Order Ingestion Velocity
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Interactive real-time throughput aggregated across Shopify, Amazon, and ERP ledger.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {activeHoverItem ? (
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-teal-700">
                    ${activeHoverItem.revenue.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-400 ml-2">
                    ({activeHoverItem.val} orders)
                  </span>
                </div>
              ) : (
                <span className="font-mono text-xs text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 font-semibold">
                  Horizon: {timeRange}
                </span>
              )}
            </div>
          </div>

          <div
            className="relative w-full h-64 select-none cursor-crosshair"
            onMouseLeave={() => setHoverIndex(null)}
          >
            <svg
              className="w-full h-full overflow-visible"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              preserveAspectRatio="none"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseRelX = ((e.clientX - rect.left) / rect.width) * svgWidth;
                let closestIdx = 0;
                let minDiff = Infinity;
                chartPoints.forEach((pt, idx) => {
                  const diff = Math.abs(pt.x - mouseRelX);
                  if (diff < minDiff) {
                    minDiff = diff;
                    closestIdx = idx;
                  }
                });
                setHoverIndex(closestIdx);
              }}
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid guide lines */}
              {[0.25, 0.5, 0.75, 1].map((lvl) => {
                const y = padYTop + plotHeight * (1 - lvl);
                return (
                  <line
                    key={lvl}
                    x1={padX}
                    y1={y}
                    x2={svgWidth - padX}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                );
              })}

              {/* Area Gradient Fill */}
              <path d={areaPath} fill="url(#revenueGradient)" />

              {/* Stroke Curve */}
              <path
                d={linePath}
                fill="none"
                stroke="#0d9488"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {chartPoints.map((pt, idx) => (
                <circle
                  key={idx}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoverIndex === idx ? 6 : 3.5}
                  className="transition-all duration-150"
                  fill={hoverIndex === idx ? '#0d9488' : '#ffffff'}
                  stroke="#0d9488"
                  strokeWidth={hoverIndex === idx ? 3 : 2}
                />
              ))}

              {/* Scrubber vertical line */}
              {activeHoverItem && (
                <line
                  x1={activeHoverItem.x}
                  y1={padYTop}
                  x2={activeHoverItem.x}
                  y2={padYTop + plotHeight}
                  stroke="#0d9488"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              )}
            </svg>

            {/* Floating Tooltip Card */}
            {activeHoverItem && (
              <div
                style={{
                  left: `${(activeHoverItem.x / svgWidth) * 100}%`,
                  top: `${Math.max(10, (activeHoverItem.y / svgHeight) * 100 - 30)}%`,
                  transform: 'translate(-50%, -100%)',
                }}
                className="absolute pointer-events-none bg-slate-900/95 backdrop-blur-md text-white px-3 py-2 rounded-xl shadow-enterprise-popover border border-slate-700/80 z-30 min-w-[130px] animate-smooth-fade"
              >
                <div className="text-[10px] uppercase font-mono text-slate-400 font-medium">
                  {activeHoverItem.label}
                </div>
                <div className="font-mono text-sm font-bold text-teal-400 mt-0.5">
                  ${activeHoverItem.revenue.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-300 font-mono mt-0.5">
                  {activeHoverItem.val} orders processed
                </div>
              </div>
            )}

            {/* X-Axis Labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-10 text-[11px] font-mono text-slate-400 font-medium">
              {chartPoints.map((pt, idx) => (
                <span
                  key={idx}
                  className={hoverIndex === idx ? 'text-teal-700 font-bold' : ''}
                >
                  {pt.label}
                </span>
              ))}
            </div>
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
