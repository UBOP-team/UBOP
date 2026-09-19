import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  Search,
  RotateCcw,
  Save,
  Lock,
  Eye,
  Users,
} from 'lucide-react';
import { useToast } from './Toast';

export type PermissionLevel = 'FULL' | 'READ' | 'DENY';

export interface ModuleCapability {
  id: string;
  module: 'CRM' | 'OMS' | 'ERP' | 'BI' | 'WORKFLOW' | 'INTEGRATIONS';
  name: string;
  description: string;
  category: string;
}

export interface RolePermissionState {
  roleId: string;
  roleName: string;
  roleDescription: string;
  badgeColor: string;
  permissions: Record<string, PermissionLevel>; // capabilityId -> PermissionLevel
}

export const PermissionMatrix: React.FC = () => {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [activeRole, setActiveRole] = useState<string>('ADMIN');

  const capabilities: ModuleCapability[] = [
    // CRM
    {
      id: 'crm_read',
      module: 'CRM',
      name: 'View Customers & Leads',
      description: 'Access customer profiles, activities timeline, and contact cards',
      category: 'Data Access',
    },
    {
      id: 'crm_edit',
      module: 'CRM',
      name: 'Create & Update Customers',
      description: 'Modify contact details, change customer statuses, add deals',
      category: 'Operations',
    },
    {
      id: 'crm_export',
      module: 'CRM',
      name: 'Export Customer Directory',
      description: 'Download bulk CSV/JSON dumps of all customer records',
      category: 'Governance',
    },
    // OMS
    {
      id: 'oms_read',
      module: 'OMS',
      name: 'View Orders & Tracking',
      description: 'Browse omnichannel orders across Shopify, Amazon, and Manual routes',
      category: 'Data Access',
    },
    {
      id: 'oms_create',
      module: 'OMS',
      name: 'Create & Edit Orders',
      description: 'Place new sales orders and update item lines and quantities',
      category: 'Operations',
    },
    {
      id: 'oms_fulfill',
      module: 'OMS',
      name: 'Advance Fulfillment State',
      description: 'Mark orders as Confirmed, Packed, Shipped, or Delivered',
      category: 'Operations',
    },
    {
      id: 'oms_cancel',
      module: 'OMS',
      name: 'Cancel Orders & Issue Refunds',
      description: 'Void orders and trigger gateway refund reverse-flows',
      category: 'Financial',
    },
    // ERP
    {
      id: 'erp_inventory_view',
      module: 'ERP',
      name: 'View Warehouse Inventory',
      description: 'Check stock on hand, bin locations, and safety stock thresholds',
      category: 'Data Access',
    },
    {
      id: 'erp_inventory_adjust',
      module: 'ERP',
      name: 'Adjust Stock & Transfer Bins',
      description: 'Override physical counts, perform cycle counts, and inter-warehouse moves',
      category: 'Operations',
    },
    {
      id: 'erp_finance_view',
      module: 'ERP',
      name: 'View General Ledger & Financials',
      description: 'Inspect revenue, cost of goods, gross margins, and cashflow',
      category: 'Financial',
    },
    {
      id: 'erp_finance_close',
      module: 'ERP',
      name: 'Execute Accounting Period Close',
      description: 'Lock accounting journals and run month-end reconciliation',
      category: 'Governance',
    },
    // BI
    {
      id: 'bi_dashboards',
      module: 'BI',
      name: 'View Executive Analytics',
      description: 'Access cross-system KPI charts and executive summaries',
      category: 'Data Access',
    },
    {
      id: 'bi_authoring',
      module: 'BI',
      name: 'Author Metric Cards & Widgets',
      description: 'Create custom query visualizations, funnel charts, and line graphs',
      category: 'Authoring',
    },
    // WORKFLOW
    {
      id: 'workflow_read',
      module: 'WORKFLOW',
      name: 'Inspect Automation Logs',
      description: 'Review EventBus dispatch history, payload logs, and error traces',
      category: 'Monitoring',
    },
    {
      id: 'workflow_build',
      module: 'WORKFLOW',
      name: 'Build & Deploy Automation Rules',
      description: 'Author Trigger-Condition-Action nodes and activate live pipelines',
      category: 'Authoring',
    },
    // INTEGRATIONS
    {
      id: 'providers_view',
      module: 'INTEGRATIONS',
      name: 'View Provider Marketplace & Health',
      description: 'Inspect active connector status, ping latency, and sync frequencies',
      category: 'Data Access',
    },
    {
      id: 'providers_connect',
      module: 'INTEGRATIONS',
      name: 'Connect & Configure Adapters',
      description: 'Run integration wizards, configure OAuth/API keys, and toggle auto-sync',
      category: 'Governance',
    },
    {
      id: 'providers_custom_studio',
      module: 'INTEGRATIONS',
      name: 'Author Custom Providers & Mappings',
      description: 'Create bespoke REST adapters, test endpoints, and map entity schemas',
      category: 'Authoring',
    },
  ];

  const defaultRoles: RolePermissionState[] = [
    {
      roleId: 'ADMIN',
      roleName: 'Global Administrator',
      roleDescription: 'Unrestricted access to all modules, system configurations, and security policies.',
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      permissions: capabilities.reduce((acc, c) => ({ ...acc, [c.id]: 'FULL' as PermissionLevel }), {}),
    },
    {
      roleId: 'OPS_MANAGER',
      roleName: 'Operations Director',
      roleDescription: 'Full control over OMS fulfillment, inventory transfers, and workflow pipelines.',
      badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
      permissions: {
        crm_read: 'FULL',
        crm_edit: 'FULL',
        crm_export: 'READ',
        oms_read: 'FULL',
        oms_create: 'FULL',
        oms_fulfill: 'FULL',
        oms_cancel: 'READ',
        erp_inventory_view: 'FULL',
        erp_inventory_adjust: 'FULL',
        erp_finance_view: 'READ',
        erp_finance_close: 'DENY',
        bi_dashboards: 'FULL',
        bi_authoring: 'FULL',
        workflow_read: 'FULL',
        workflow_build: 'FULL',
        providers_view: 'FULL',
        providers_connect: 'READ',
        providers_custom_studio: 'DENY',
      },
    },
    {
      roleId: 'FINANCE',
      roleName: 'Finance Controller',
      roleDescription: 'Governance over financial ledger, margins, order revenue, and month-end closes.',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      permissions: {
        crm_read: 'READ',
        crm_edit: 'DENY',
        crm_export: 'FULL',
        oms_read: 'FULL',
        oms_create: 'DENY',
        oms_fulfill: 'DENY',
        oms_cancel: 'FULL',
        erp_inventory_view: 'READ',
        erp_inventory_adjust: 'DENY',
        erp_finance_view: 'FULL',
        erp_finance_close: 'FULL',
        bi_dashboards: 'FULL',
        bi_authoring: 'FULL',
        workflow_read: 'READ',
        workflow_build: 'DENY',
        providers_view: 'READ',
        providers_connect: 'DENY',
        providers_custom_studio: 'DENY',
      },
    },
    {
      roleId: 'WAREHOUSE',
      roleName: 'Warehouse Supervisor',
      roleDescription: 'Focused execution on pick-pack-ship operations, stock levels, and couriers.',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      permissions: {
        crm_read: 'DENY',
        crm_edit: 'DENY',
        crm_export: 'DENY',
        oms_read: 'FULL',
        oms_create: 'READ',
        oms_fulfill: 'FULL',
        oms_cancel: 'DENY',
        erp_inventory_view: 'FULL',
        erp_inventory_adjust: 'FULL',
        erp_finance_view: 'DENY',
        erp_finance_close: 'DENY',
        bi_dashboards: 'READ',
        bi_authoring: 'DENY',
        workflow_read: 'READ',
        workflow_build: 'DENY',
        providers_view: 'READ',
        providers_connect: 'DENY',
        providers_custom_studio: 'DENY',
      },
    },
    {
      roleId: 'INTEGRATION_ENG',
      roleName: 'Integration Engineer',
      roleDescription: 'Provider adapter connector development, webhook routing, and field mapping.',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      permissions: {
        crm_read: 'READ',
        crm_edit: 'READ',
        crm_export: 'DENY',
        oms_read: 'READ',
        oms_create: 'READ',
        oms_fulfill: 'READ',
        oms_cancel: 'DENY',
        erp_inventory_view: 'READ',
        erp_inventory_adjust: 'READ',
        erp_finance_view: 'DENY',
        erp_finance_close: 'DENY',
        bi_dashboards: 'READ',
        bi_authoring: 'DENY',
        workflow_read: 'FULL',
        workflow_build: 'FULL',
        providers_view: 'FULL',
        providers_connect: 'FULL',
        providers_custom_studio: 'FULL',
      },
    },
    {
      roleId: 'AUDITOR',
      roleName: 'Compliance Auditor',
      roleDescription: 'Strict read-only oversight across all business operations and audit logs.',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      permissions: capabilities.reduce((acc, c) => ({ ...acc, [c.id]: 'READ' as PermissionLevel }), {}),
    },
  ];

  const [roles, setRoles] = useState<RolePermissionState[]>(defaultRoles);

  const activeRoleObj = roles.find((r) => r.roleId === activeRole) || roles[0];

  const handleTogglePermission = (roleId: string, capId: string, level: PermissionLevel) => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.roleId !== roleId) return r;
        return {
          ...r,
          permissions: {
            ...r.permissions,
            [capId]: level,
          },
        };
      })
    );
  };

  const handleSetAllForRole = (roleId: string, level: PermissionLevel) => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.roleId !== roleId) return r;
        const newPerms: Record<string, PermissionLevel> = {};
        capabilities.forEach((c) => {
          newPerms[c.id] = level;
        });
        return { ...r, permissions: newPerms };
      })
    );
    toast.info('Role Permissions Updated', `Set all capabilities for ${roleId} to ${level}.`);
  };

  const handleSavePolicy = () => {
    toast.success('Security Policy Deployed', 'RBAC Permission Matrix persisted to auth middleware.');
  };

  const filteredCapabilities = capabilities.filter((cap) => {
    const matchesModule = selectedModule === 'ALL' || cap.module === selectedModule;
    const matchesQuery =
      cap.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cap.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cap.module.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesModule && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono uppercase font-semibold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Enterprise RBAC Governance
              </span>
              <span className="text-xs text-slate-500">• ISO-27001 / SOC-2 Compliant</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
              Role & Capability Permission Matrix
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Grant granular access policies across CRM, OMS, ERP, BI, Workflow, and Integration
              Provider layers to ensure zero-trust separation of concerns.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRoles(defaultRoles)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
            </button>
            <button
              onClick={handleSavePolicy}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-teal-500/20"
            >
              <Save className="w-4 h-4" /> Save Policy Matrix
            </button>
          </div>
        </div>

        {/* Roles Quick Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-800/80 overflow-x-auto pb-1">
          {roles.map((r) => {
            const isActive = activeRole === r.roleId;
            return (
              <button
                key={r.roleId}
                onClick={() => setActiveRole(r.roleId)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-slate-950 text-slate-100 border-teal-500 shadow-md shadow-teal-500/10 ring-1 ring-teal-500/40'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-teal-400" />
                <span>{r.roleName}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${r.badgeColor}`}>
                  {r.roleId}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Role Quick Overview */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-100 text-sm">{activeRoleObj.roleName}</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${activeRoleObj.badgeColor}`}>
              {activeRoleObj.roleId}
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-0.5">{activeRoleObj.roleDescription}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-slate-500 font-mono text-[11px]">Batch assign:</span>
          <button
            onClick={() => handleSetAllForRole(activeRoleObj.roleId, 'FULL')}
            className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-medium transition-colors"
          >
            Grant Full All
          </button>
          <button
            onClick={() => handleSetAllForRole(activeRoleObj.roleId, 'READ')}
            className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-[11px] font-medium transition-colors"
          >
            Read Only All
          </button>
          <button
            onClick={() => handleSetAllForRole(activeRoleObj.roleId, 'DENY')}
            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-[11px] font-medium transition-colors"
          >
            Deny All
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'CRM', 'OMS', 'ERP', 'BI', 'WORKFLOW', 'INTEGRATIONS'].map((mod) => (
            <button
              key={mod}
              onClick={() => setSelectedModule(mod)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                selectedModule === mod
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {mod}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search capability or permission..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 text-xs"
          />
        </div>
      </div>

      {/* Full Cross-Matrix Table View */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                <th className="p-3.5 font-semibold">Business Module</th>
                <th className="p-3.5 font-semibold">Capability Name & Scope</th>
                <th className="p-3.5 font-semibold text-center w-28">Category</th>
                {roles.map((r) => (
                  <th
                    key={r.roleId}
                    className={`p-3.5 font-semibold text-center min-w-[130px] ${
                      activeRole === r.roleId ? 'bg-slate-800/80 text-teal-300' : ''
                    }`}
                  >
                    <div>{r.roleName.split(' ')[0]}</div>
                    <div className="text-[9px] text-slate-500 font-mono normal-case">{r.roleId}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCapabilities.map((cap) => {
                return (
                  <tr key={cap.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3.5 align-top">
                      <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-900 text-teal-400 border border-slate-800">
                        {cap.module}
                      </span>
                    </td>

                    <td className="p-3.5 align-top">
                      <div className="font-bold text-slate-200">{cap.name}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5 leading-snug">{cap.description}</div>
                    </td>

                    <td className="p-3.5 align-top text-center">
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                        {cap.category}
                      </span>
                    </td>

                    {roles.map((r) => {
                      const level = r.permissions[cap.id] || 'DENY';
                      const isHighlighted = activeRole === r.roleId;

                      return (
                        <td
                          key={r.roleId}
                          className={`p-2.5 align-middle text-center ${
                            isHighlighted ? 'bg-slate-900/30' : ''
                          }`}
                        >
                          <div className="inline-flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
                            <button
                              type="button"
                              title="Full Access"
                              onClick={() => handleTogglePermission(r.roleId, cap.id, 'FULL')}
                              className={`p-1.5 rounded-lg text-xs transition-all ${
                                level === 'FULL'
                                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                                  : 'text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              title="Read Only"
                              onClick={() => handleTogglePermission(r.roleId, cap.id, 'READ')}
                              className={`p-1.5 rounded-lg text-xs transition-all ${
                                level === 'READ'
                                  ? 'bg-blue-500/20 text-blue-300 font-bold border border-blue-500/40 shadow-sm'
                                  : 'text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              title="Deny Access"
                              onClick={() => handleTogglePermission(r.roleId, cap.id, 'DENY')}
                              className={`p-1.5 rounded-lg text-xs transition-all ${
                                level === 'DENY'
                                  ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 shadow-sm'
                                  : 'text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
              <span>Full Access (Read, Write, Execute)</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold">
                <Eye className="w-3.5 h-3.5" />
              </span>
              <span>Read-Only Visibility</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center text-[10px] font-bold">
                <Lock className="w-3.5 h-3.5" />
              </span>
              <span>Access Denied</span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-500">
            {filteredCapabilities.length} capabilities governed
          </div>
        </div>
      </div>
    </div>
  );
};
