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
  permissions: Record<string, PermissionLevel>;
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
      name: 'Adjust Physical Inventory Count',
      description: 'Perform stock delta additions and relievings in warehouse bins',
      category: 'Operations',
    },
    {
      id: 'erp_finance_view',
      module: 'ERP',
      name: 'View Financial Ledger',
      description: 'Inspect debit/credit general ledger transactions and margins',
      category: 'Financial',
    },
    {
      id: 'erp_finance_close',
      module: 'ERP',
      name: 'Period Close & Ledger Adjustments',
      description: 'Authorize journal adjustments and close monthly fiscal books',
      category: 'Governance',
    },
    // BI
    {
      id: 'bi_dashboards',
      module: 'BI',
      name: 'View Analytics Dashboards',
      description: 'Read Power BI visualizations, funnels, and revenue metrics',
      category: 'Data Access',
    },
    {
      id: 'bi_authoring',
      module: 'BI',
      name: 'Visual Builder & Custom Reports',
      description: 'Author new report cards, line charts, and telemetry funnels',
      category: 'Authoring',
    },
    // WORKFLOW
    {
      id: 'workflow_read',
      module: 'WORKFLOW',
      name: 'Inspect Automation Logs',
      description: 'Review async event execution history and payload traces',
      category: 'Data Access',
    },
    {
      id: 'workflow_build',
      module: 'WORKFLOW',
      name: 'Author Automation Pipelines',
      description: 'Create and deploy new Trigger -> Condition -> Action recipes',
      category: 'Authoring',
    },
    // INTEGRATIONS
    {
      id: 'providers_view',
      module: 'INTEGRATIONS',
      name: 'View Connector Directory',
      description: 'Inspect active integration status and handshake latency',
      category: 'Data Access',
    },
    {
      id: 'providers_connect',
      module: 'INTEGRATIONS',
      name: 'Connect & Configure Adapters',
      description: 'Modify API credentials, webhook endpoints, and sync policies',
      category: 'Governance',
    },
    {
      id: 'providers_custom_studio',
      module: 'INTEGRATIONS',
      name: 'Author Custom Adapters',
      description: 'Design REST connectors, headers, and schema mapping transforms',
      category: 'Authoring',
    },
  ];

  const defaultRoles: RolePermissionState[] = [
    {
      roleId: 'ADMIN',
      roleName: 'System Administrator',
      roleDescription: 'Unrestricted root governance across all operational domains and provider configurations.',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
      permissions: capabilities.reduce((acc, c) => ({ ...acc, [c.id]: 'FULL' as PermissionLevel }), {}),
    },
    {
      roleId: 'OPS_LEAD',
      roleName: 'Operations Lead',
      roleDescription: 'Manages omnichannel order fulfillment, customer inquiries, and warehouse stock ATP.',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      permissions: {
        crm_read: 'FULL',
        crm_edit: 'FULL',
        crm_export: 'READ',
        oms_read: 'FULL',
        oms_create: 'FULL',
        oms_fulfill: 'FULL',
        oms_cancel: 'FULL',
        erp_inventory_view: 'FULL',
        erp_inventory_adjust: 'FULL',
        erp_finance_view: 'READ',
        erp_finance_close: 'DENY',
        bi_dashboards: 'FULL',
        bi_authoring: 'READ',
        workflow_read: 'FULL',
        workflow_build: 'READ',
        providers_view: 'FULL',
        providers_connect: 'READ',
        providers_custom_studio: 'DENY',
      },
    },
    {
      roleId: 'WAREHOUSE_MGR',
      roleName: 'Warehouse Specialist',
      roleDescription: 'Warehouse physical inventory, order packing, and carrier dispatch operations.',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      permissions: {
        crm_read: 'READ',
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
      badgeColor: 'bg-sky-50 text-sky-800 border-sky-200',
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
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
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
    <div className="space-y-6 animate-smooth-fade">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 relative overflow-hidden shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono uppercase font-semibold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                Enterprise RBAC Governance
              </span>
              <span className="text-xs text-slate-400">• ISO-27001 / SOC-2 Compliant</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
              Role & Capability Permission Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              Grant granular access policies across CRM, OMS, ERP, BI, Workflow, and Integration
              Provider layers to ensure zero-trust separation of concerns.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRoles(defaultRoles)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium transition-colors shadow-xs btn-press"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
            </button>
            <button
              onClick={handleSavePolicy}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs transition-colors shadow-xs btn-press"
            >
              <Save className="w-3.5 h-3.5" /> Save Policy Matrix
            </button>
          </div>
        </div>

        {/* Roles Quick Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100 overflow-x-auto pb-1">
          {roles.map((r) => {
            const isActive = activeRole === r.roleId;
            return (
              <button
                key={r.roleId}
                onClick={() => setActiveRole(r.roleId)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all border btn-press ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-semibold'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200 font-medium'
                }`}
              >
                <Users className={`w-3.5 h-3.5 ${isActive ? 'text-slate-300' : 'text-slate-400'}`} />
                <span>{r.roleName}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${r.badgeColor}`}>
                  {r.roleId}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Role Quick Overview */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">{activeRoleObj.roleName}</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${activeRoleObj.badgeColor}`}>
              {activeRoleObj.roleId}
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-0.5">{activeRoleObj.roleDescription}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-slate-400 font-mono text-[11px]">Batch assign:</span>
          <button
            onClick={() => handleSetAllForRole(activeRoleObj.roleId, 'FULL')}
            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-medium transition-colors btn-press"
          >
            Grant Full All
          </button>
          <button
            onClick={() => handleSetAllForRole(activeRoleObj.roleId, 'READ')}
            className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-[11px] font-medium transition-colors btn-press"
          >
            Read Only All
          </button>
          <button
            onClick={() => handleSetAllForRole(activeRoleObj.roleId, 'DENY')}
            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-medium transition-colors btn-press"
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
              className={`px-3 py-1.5 rounded-lg text-xs transition-all btn-press ${
                selectedModule === mod
                  ? 'bg-slate-900 text-white shadow-xs font-semibold'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 font-medium'
              }`}
            >
              {mod}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search capability or permission..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3.5 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 text-xs shadow-xs"
          />
        </div>
      </div>

      {/* Full Cross-Matrix Table View */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono uppercase text-slate-500">
                <th className="p-3.5 font-semibold">Business Module</th>
                <th className="p-3.5 font-semibold">Capability Name & Scope</th>
                <th className="p-3.5 font-semibold text-center w-28">Category</th>
                {roles.map((r) => (
                  <th
                    key={r.roleId}
                    className={`p-3.5 font-semibold text-center min-w-[130px] ${
                      activeRole === r.roleId ? 'bg-teal-50/70 text-teal-900' : ''
                    }`}
                  >
                    <div>{r.roleName.split(' ')[0]}</div>
                    <div className="text-[9px] text-slate-400 font-mono normal-case">{r.roleId}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCapabilities.map((cap) => {
                return (
                  <tr key={cap.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 align-top">
                      <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {cap.module}
                      </span>
                    </td>

                    <td className="p-3.5 align-top">
                      <div className="font-semibold text-slate-900">{cap.name}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5 leading-snug">{cap.description}</div>
                    </td>

                    <td className="p-3.5 align-top text-center">
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
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
                            isHighlighted ? 'bg-teal-50/20' : ''
                          }`}
                        >
                          <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                            <button
                              type="button"
                              title="Full Access"
                              onClick={() => handleTogglePermission(r.roleId, cap.id, 'FULL')}
                              className={`p-1.5 rounded-md text-xs transition-all ${
                                level === 'FULL'
                                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                                  : 'text-slate-400 hover:text-slate-700'
                              }`}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              title="Read Only"
                              onClick={() => handleTogglePermission(r.roleId, cap.id, 'READ')}
                              className={`p-1.5 rounded-md text-xs transition-all ${
                                level === 'READ'
                                  ? 'bg-sky-600 text-white font-bold shadow-xs'
                                  : 'text-slate-400 hover:text-slate-700'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              title="Deny Access"
                              onClick={() => handleTogglePermission(r.roleId, cap.id, 'DENY')}
                              className={`p-1.5 rounded-md text-xs transition-all ${
                                level === 'DENY'
                                  ? 'bg-rose-600 text-white font-bold shadow-xs'
                                  : 'text-slate-400 hover:text-slate-700'
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
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center text-[10px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
              <span>Full Access (Read, Write, Execute)</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-700 border border-sky-200 flex items-center justify-center text-[10px] font-bold">
                <Eye className="w-3.5 h-3.5" />
              </span>
              <span>Read-Only Visibility</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center text-[10px] font-bold">
                <Lock className="w-3.5 h-3.5" />
              </span>
              <span>Access Denied</span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            {filteredCapabilities.length} capabilities governed
          </div>
        </div>
      </div>
    </div>
  );
};
