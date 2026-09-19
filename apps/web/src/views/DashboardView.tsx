import React, { useState } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Users,
  AlertTriangle,
  TrendingUp,
  PackageCheck,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { KpiSummary, Order } from '../types';

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
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D'>('30D');

  const salesTrends = {
    '7D': [
      { month: 'Mon', val: 42 },
      { month: 'Tue', val: 58 },
      { month: 'Wed', val: 65 },
      { month: 'Thu', val: 74 },
      { month: 'Fri', val: 89 },
      { month: 'Sat', val: 96 },
      { month: 'Sun', val: 82 },
    ],
    '30D': [
      { month: 'W1', val: 52 },
      { month: 'W2', val: 68 },
      { month: 'W3', val: 84 },
      { month: 'W4', val: 95 },
    ],
    '90D': [
      { month: 'Apr', val: 64 },
      { month: 'May', val: 78 },
      { month: 'Jun', val: 96 },
    ],
  };

  const currentTrend = salesTrends[timeRange];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-950/60 via-slate-900 to-slate-900 border border-teal-500/20 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 text-[10px] font-mono uppercase font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                Real-time Operations Engine
              </span>
              <span className="text-xs text-slate-500">• Event-Driven Monolith</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Executive Dashboard</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Cross-functional telemetry synchronizing Order Management, Warehouse Stock, Customer CRM,
              and Provider Adapters in real-time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Core Platform Operational
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Gross Revenue"
          value={`$${kpis.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle={`Avg Order: $${kpis.avg_order_value.toFixed(2)}`}
          trend="+18.4%"
          isPositive={true}
          icon={DollarSign}
          color="teal"
        />
        <StatsCard
          title="Fulfillment Orders"
          value={kpis.total_orders}
          subtitle="Processed through OMS"
          trend="+12.0%"
          isPositive={true}
          icon={ShoppingCart}
          color="blue"
        />
        <StatsCard
          title="Active Accounts"
          value={kpis.total_customers}
          subtitle="Managed in CRM"
          trend="+8.5%"
          isPositive={true}
          icon={Users}
          color="emerald"
        />
        <StatsCard
          title="Stock Alerts"
          value={kpis.low_stock_count}
          subtitle="Under reorder minimum"
          trend={kpis.low_stock_count > 0 ? "Requires restock" : "Optimal"}
          isPositive={kpis.low_stock_count === 0}
          icon={AlertTriangle}
          color="amber"
        />
      </div>

      {/* Main Charts & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Performance Chart */}
        <div className="lg:col-span-2 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-400" />
                Revenue & Sales Trajectory
              </h3>
              <p className="text-xs text-slate-400">Indexed sales growth across all channels</p>
            </div>

            {/* Time Range Pills */}
            <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-800 self-start sm:self-auto">
              {(['7D', '30D', '90D'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    timeRange === range
                      ? 'bg-teal-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Bar Chart */}
          <div className="h-48 flex items-end justify-between gap-4 pt-4 border-b border-slate-800/80 pb-2">
            {currentTrend.map((item) => (
              <div key={item.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="text-[10px] text-teal-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  ${item.val}k
                </div>
                <div
                  className="w-full bg-slate-800 hover:bg-teal-500/80 rounded-t-xl transition-all duration-300 relative overflow-hidden"
                  style={{ height: `${item.val}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-teal-500/30 to-transparent" />
                </div>
                <span className="text-xs text-slate-400 font-semibold">{item.month}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2">
            <span>Minimum: $42,000</span>
            <span className="text-teal-400 font-semibold">Peak Index: $96,000 (Current Period)</span>
          </div>
        </div>

        {/* Live Orders Tracker */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between backdrop-blur-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-teal-400" />
                Live Order Feed
              </h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                Live
              </span>
            </div>

            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">No orders recorded yet.</div>
              ) : (
                recentOrders.slice(0, 4).map((order) => (
                  <div
                    key={order.id}
                    onClick={() => onSelectOrder && onSelectOrder(order)}
                    className="p-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-xl flex items-center justify-between text-xs cursor-pointer transition-all"
                  >
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        {order.order_number}
                        <ArrowUpRight className="w-3 h-3 text-slate-500" />
                      </div>
                      <div className="text-slate-500 text-[11px]">Account #{order.customer_id}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-100 font-mono">${order.total_amount.toFixed(2)}</div>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-center">
            <button
              onClick={() => onNavigateTab && onNavigateTab('oms')}
              className="text-xs text-teal-400 hover:text-teal-300 font-medium transition-colors"
            >
              Open OMS Fulfillment Console &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
