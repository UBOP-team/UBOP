import React from 'react';
import { DollarSign, ShoppingCart, Users, AlertTriangle, TrendingUp, PackageCheck, Zap } from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { KpiSummary, Order } from '../types';

interface DashboardViewProps {
  kpis: KpiSummary;
  recentOrders: Order[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ kpis, recentOrders }) => {
  const salesData = [
    { month: 'Jan', val: 35 },
    { month: 'Feb', val: 52 },
    { month: 'Mar', val: 68 },
    { month: 'Apr', val: 85 },
    { month: 'May', val: 78 },
    { month: 'Jun', val: 96 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-950/60 via-slate-900 to-slate-900 border border-teal-500/20 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5" /> Unified Operations Intelligence
          </span>
          <h2 className="text-2xl font-bold text-slate-100">Executive Overview</h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time synchronization across ERP, CRM, Order Management, and Automations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-teal-500/10 text-teal-400 border border-teal-500/30 rounded-lg text-xs font-medium">
            System Online
          </span>
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
          title="Total Orders"
          value={kpis.total_orders}
          subtitle="Processed through OMS"
          trend="+12.0%"
          isPositive={true}
          icon={ShoppingCart}
          color="blue"
        />
        <StatsCard
          title="Active Customers"
          value={kpis.total_customers}
          subtitle="Registered in CRM"
          trend="+8.5%"
          isPositive={true}
          icon={Users}
          color="emerald"
        />
        <StatsCard
          title="Low Stock Alerts"
          value={kpis.low_stock_count}
          subtitle="Products below reorder level"
          trend={kpis.low_stock_count > 0 ? "Action needed" : "Healthy"}
          isPositive={kpis.low_stock_count === 0}
          icon={AlertTriangle}
          color="amber"
        />
      </div>

      {/* Main Charts & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Performance Chart */}
        <div className="lg:col-span-2 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-400" />
                Revenue & Sales Growth
              </h3>
              <p className="text-xs text-slate-400">Monthly gross sales volume index</p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
              H1 2026
            </span>
          </div>

          {/* Simple Visual Bar Chart */}
          <div className="h-48 flex items-end justify-between gap-4 pt-4 border-b border-slate-800/80 pb-2">
            {salesData.map((item) => (
              <div key={item.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                  ${item.val}k
                </div>
                <div
                  className="w-full bg-slate-800 hover:bg-teal-500/80 rounded-t-lg transition-all duration-300 relative overflow-hidden"
                  style={{ height: `${item.val}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-teal-600/30 to-transparent" />
                </div>
                <span className="text-xs text-slate-400 font-medium">{item.month}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2">
            <span>Minimum: $35,000</span>
            <span className="text-teal-400 font-medium">Peak: $96,000 (June)</span>
          </div>
        </div>

        {/* Live Orders Tracker */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-teal-400" />
                Recent Orders
              </h3>
              <span className="text-xs text-slate-400">Live feed</span>
            </div>

            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">No orders recorded yet.</div>
              ) : (
                recentOrders.slice(0, 4).map((order) => (
                  <div
                    key={order.id}
                    className="p-3 bg-slate-900/60 border border-slate-800/60 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{order.order_number}</div>
                      <div className="text-slate-500 text-[11px]">Cust #{order.customer_id}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-100">${order.total_amount.toFixed(2)}</div>
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
            <span className="text-xs text-slate-400 hover:text-teal-400 cursor-pointer transition-colors">
              View all OMS records &rarr;
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
