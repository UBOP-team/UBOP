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
  Zap,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Layers,
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
    { id: 'erp', label: 'ERP (Resources & Stock)', icon: Boxes, shortLabel: 'ERP' },
    { id: 'crm', label: 'CRM (Customers & Pipeline)', icon: Users, shortLabel: 'CRM' },
    { id: 'oms', label: 'OMS (Omnichannel Orders)', icon: ShoppingCart, shortLabel: 'OMS' },
    { id: 'dashboard', label: 'BI (Dashboards & Reports)', icon: BarChart3, shortLabel: 'BI' },
    { id: 'workflow', label: 'Workflow (Automation Canvas)', icon: GitFork, shortLabel: 'Flow' },
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
    { id: 'workflow', label: 'Workflow Automation', icon: Zap },
    { id: 'dashboard', label: 'Analytics Reports', icon: FileText },
    { id: 'settings', label: 'Settings & Security', icon: Settings },
  ];

  return (
    <aside
      className={`bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between p-3 h-screen sticky top-0 shrink-0 select-none transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 via-teal-400 to-emerald-400 flex items-center justify-center font-black text-slate-950 shadow-md shadow-teal-500/20 shrink-0">
              U
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-slate-100 tracking-tight">UBOP</span>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-teal-500/10 text-teal-400 border border-teal-500/30">
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
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Tree Navigation */}
        <nav className="space-y-1 text-xs">
          {/* Workspace Root: Dashboard */}
          {!isCollapsed && (
            <div className="text-[10px] font-mono uppercase text-slate-500 px-3 py-1 font-semibold">
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
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-semibold transition-all ${
                  active
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                }`}
                title={item.label}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-teal-400' : 'text-slate-500'}`} />
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
                className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-mono uppercase text-slate-500 font-semibold hover:text-slate-300"
              >
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-slate-500" />
                  Business Modules
                </span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${isModulesOpen ? 'rotate-0' : '-rotate-90'}`}
                />
              </button>
            ) : (
              <div className="h-0.5 bg-slate-800 my-2" />
            )}

            {(isModulesOpen || isCollapsed) && (
              <div className={`space-y-1 ${!isCollapsed ? 'pl-2 pt-1' : ''}`}>
                {moduleItems.map((m) => {
                  const Icon = m.icon;
                  const active = currentTab === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => onTabChange(m.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition-all ${
                        active
                          ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                      }`}
                      title={m.label}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-teal-400' : 'text-slate-500'}`} />
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
              <div className="text-[10px] font-mono uppercase text-slate-500 px-3 py-1 font-semibold">
                Platform & Adapters
              </div>
            )}

            {platformItems.map((item) => {
              const Icon = item.icon;
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${
                    active
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                  }`}
                  title={item.label}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-teal-400' : 'text-slate-500'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold uppercase bg-slate-900 text-teal-400 border border-teal-500/30 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Footer System Status & Permission Indicator */}
      <div className="space-y-2">
        {!isCollapsed && (
          <div className="p-2.5 bg-slate-900/70 rounded-xl border border-slate-800 text-[11px] flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Shield className="w-3.5 h-3.5 text-teal-400" />
              Role: Admin
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
              Full RBAC
            </span>
          </div>
        )}

        <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800 text-xs text-center">
          <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {!isCollapsed ? 'Platform Operational' : 'OK'}
          </div>
          {!isCollapsed && (
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
              EventBus • FastAPI 3.12
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};
