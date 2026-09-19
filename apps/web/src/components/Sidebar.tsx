import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Boxes,
  ShoppingCart,
  GitFork,
  Radio,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Shield,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  connectedProvidersCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  connectedProvidersCount = 4,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isModulesOpen, setIsModulesOpen] = useState(true);

  // Business Modules sub-tree
  const moduleItems = [
    { id: 'erp', label: 'ERP (Resources & Stock)', icon: Boxes },
    { id: 'crm', label: 'CRM (Customers & Deals)', icon: Users },
    { id: 'oms', label: 'OMS (Omnichannel Orders)', icon: ShoppingCart },
    { id: 'dashboard', label: 'BI (Dashboards & Reports)', icon: BarChart3 },
    { id: 'workflow', label: 'Workflow (Automation)', icon: GitFork },
  ];

  const rootItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
  ];

  const platformItems = [
    {
      id: 'providers',
      label: 'Integrations & Providers',
      icon: Radio,
      badge: `${connectedProvidersCount} live`,
    },
    { id: 'settings', label: 'Settings & Security', icon: Settings },
  ];

  return (
    <aside
      className={`bg-white border-r border-slate-200/90 flex flex-col justify-between p-3.5 h-screen sticky top-0 shrink-0 select-none transition-all duration-300 ease-out shadow-[1px_0_2px_rgba(0,0,0,0.02)] ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center font-black text-white shadow-md shadow-teal-500/20 shrink-0">
              U
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-slate-900 tracking-tight">UBOP</span>
                  <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded bg-teal-50 text-teal-700 border border-teal-200/60">
                    OS
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">Enterprise Operations</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors btn-press"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Tree Navigation */}
        <nav className="space-y-1 text-xs">
          {/* Workspace Root */}
          {!isCollapsed && (
            <div className="text-[10px] font-mono uppercase text-slate-400 px-3 py-1 font-semibold tracking-wider">
              Workspace
            </div>
          )}

          {rootItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-teal-50 text-teal-800 border border-teal-200/80 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
                title={item.label}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-teal-600' : 'text-slate-400'}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}

          {/* Business Modules Group (Collapsible) */}
          <div className="pt-2">
            {!isCollapsed ? (
              <button
                type="button"
                onClick={() => setIsModulesOpen(!isModulesOpen)}
                className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-mono uppercase text-slate-400 font-semibold hover:text-slate-600 transition-colors"
              >
                <span>Business Modules</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${isModulesOpen ? 'rotate-0' : '-rotate-90'}`}
                />
              </button>
            ) : (
              <div className="h-0.5 bg-slate-100 my-2" />
            )}

            {(isModulesOpen || isCollapsed) && (
              <div className={`space-y-0.5 ${!isCollapsed ? 'pl-2 pt-1' : ''}`}>
                {moduleItems.map((m) => {
                  const Icon = m.icon;
                  const active = currentTab === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => onTabChange(m.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition-all duration-200 ${
                        active
                          ? 'bg-teal-50 text-teal-800 border border-teal-200/80 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                      }`}
                      title={m.label}
                    >
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-teal-600' : 'text-slate-400'}`} />
                      {!isCollapsed && <span className="truncate">{m.label}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Platform / Integrations / Settings */}
          <div className="pt-2">
            {!isCollapsed && (
              <div className="text-[10px] font-mono uppercase text-slate-400 px-3 py-1 font-semibold tracking-wider">
                Platform
              </div>
            )}

            {platformItems.map((item) => {
              const Icon = item.icon;
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-teal-50 text-teal-800 border border-teal-200/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                  }`}
                  title={item.label}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-teal-600' : 'text-slate-400'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold uppercase bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Footer Status */}
      <div className="space-y-2">
        {!isCollapsed && (
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
              <Shield className="w-3.5 h-3.5 text-teal-600" />
              Role: Admin
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
              Full RBAC
            </span>
          </div>
        )}

        <div className="p-2 bg-slate-50/80 rounded-xl border border-slate-200 text-xs text-center">
          <div className="flex items-center justify-center gap-1.5 text-emerald-600 font-bold text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {!isCollapsed ? 'Platform Operational' : 'OK'}
          </div>
        </div>
      </div>
    </aside>
  );
};
