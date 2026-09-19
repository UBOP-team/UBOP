import React from 'react';
import { LayoutDashboard, Users, Boxes, ShoppingCart, GitFork, Settings, Activity } from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard & BI', icon: LayoutDashboard },
    { id: 'crm', label: 'CRM (Customers)', icon: Users },
    { id: 'erp', label: 'ERP (Inventory)', icon: Boxes },
    { id: 'oms', label: 'OMS (Orders)', icon: ShoppingCart },
    { id: 'workflow', label: 'Workflow Engine', icon: GitFork },
    { id: 'settings', label: 'System & Adapters', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-4 h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-teal-500/20">
            U
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-100 tracking-tight">UBOP</h1>
            <p className="text-xs text-slate-400">Enterprise Operations</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-teal-400' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="flex items-center gap-1.5 font-medium">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Platform Core
          </span>
          <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded-full font-mono">
            v0.1.0
          </span>
        </div>
        <p className="text-slate-500 text-[11px]">Modular Monolith Engine</p>
      </div>
    </aside>
  );
};
