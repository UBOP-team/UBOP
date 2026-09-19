import React, { useState } from 'react';
import {
  Plus,
  Building,
  Mail,
  Phone,
  Search,
  ChevronRight,
  ShoppingCart,
  FileText,
} from 'lucide-react';
import { Customer } from '../types';
import { Modal } from '../components/Modal';
import { Drawer } from '../components/Drawer';
import { useToast } from '../components/Toast';
import { MetricCard } from '../components/MetricCard';
import { Timeline, TimelineItem } from '../components/Timeline';
import { ConfigPanel, ConfigSection } from '../components/ConfigPanel';

interface CrmViewProps {
  customers: Customer[];
  onCreateCustomer: (customer: Partial<Customer>) => Promise<void>;
  onSelectCustomerForOrder?: (customerId: number) => void;
}

export const CrmView: React.FC<CrmViewProps> = ({
  customers,
  onCreateCustomer,
  onSelectCustomerForOrder,
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'WORKSPACE' | 'CONFIG' | 'PROVIDERS' | 'ANALYTICS'>('WORKSPACE');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerProfileTab, setCustomerProfileTab] = useState<
    'OVERVIEW' | 'ACTIVITIES' | 'DEALS' | 'ORDERS' | 'DOCUMENTS'
  >('OVERVIEW');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'ACTIVE' as 'LEAD' | 'ACTIVE' | 'INACTIVE',
  });
  const [loading, setLoading] = useState(false);

  // CRM Configuration Sections
  const [crmConfigSections, setCrmConfigSections] = useState<ConfigSection[]>([
    {
      title: 'Lead Ingestion & Routing',
      description: 'Configure automated scoring and rep assignment for incoming enterprise leads.',
      fields: [
        {
          id: 'lead_auto_assign',
          label: 'Automated Round-Robin Lead Assignment',
          description: 'Distribute qualified inbound leads evenly among account executives.',
          type: 'toggle',
          value: true,
        },
        {
          id: 'lead_qualification_score',
          label: 'Minimum Qualification Score (MQL -> SQL)',
          description: 'Lead score threshold required before opening deal opportunity in pipeline.',
          type: 'number',
          value: 75,
        },
        {
          id: 'dedup_method',
          label: 'Identity De-duplication Rule',
          description: 'Criterion used to merge identical contact inquiries.',
          type: 'select',
          value: 'EMAIL_DOMAIN',
          options: [
            { label: 'Exact Email Address Match', value: 'EMAIL' },
            { label: 'Corporate Email Domain + Company Name', value: 'EMAIL_DOMAIN' },
            { label: 'Phone Number Normalization (E.164)', value: 'PHONE' },
          ],
        },
      ],
    },
    {
      title: 'CRM Connector Cadence & Webhooks',
      description: 'Synchronize contact books and opportunity states with external CRMs.',
      fields: [
        {
          id: 'sync_cadence',
          label: 'Bi-directional Synchronization Cadence',
          description: 'Interval between HubSpot / Salesforce bulk sync passes.',
          type: 'select',
          value: 'REALTIME',
          options: [
            { label: 'Real-time Event Webhook Stream', value: 'REALTIME' },
            { label: 'Every 15 Minutes (Batched)', value: '15M' },
            { label: 'Hourly Reconciliation Pass', value: 'HOURLY' },
          ],
        },
        {
          id: 'track_email_opens',
          label: 'Telemetry Engagement Tracking',
          description: 'Inject tracking pixel into transactional outbound CRM correspondence.',
          type: 'toggle',
          value: true,
        },
      ],
    },
  ]);

  const handleCrmConfigChange = (secIdx: number, fieldId: string, val: any) => {
    setCrmConfigSections((prev) => {
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

  const handleSaveCrmConfig = () => {
    toast.success('CRM Settings Saved', 'Lead routing and synchronization policies persisted.');
  };

  const filterTabs = ['ALL', 'ACTIVE', 'LEAD', 'INACTIVE'];

  const filteredCustomers = customers.filter((c) => {
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesQuery =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesQuery;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreateCustomer(formData);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', phone: '', company: '', status: 'ACTIVE' });
      toast.success('Customer Created', `${formData.name} was added to the CRM database.`);
    } catch {
      toast.error('Creation Failed', 'Could not create customer record.');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Mock Deals for Customer 360
  const mockDeals = [
    {
      id: 'deal_1',
      title: 'Enterprise ERP Suite Expansion',
      value: '$48,500',
      stage: 'Proposal / Negotiation',
      probability: '75%',
      expectedClose: 'Oct 15, 2026',
    },
    {
      id: 'deal_2',
      title: 'Annual API Connector Maintenance',
      value: '$12,000',
      stage: 'Qualified Opportunity',
      probability: '90%',
      expectedClose: 'Nov 01, 2026',
    },
  ];

  // Mock Activity Timeline
  const mockActivities: TimelineItem[] = [
    {
      id: 'act_1',
      title: 'Executive Discovery Briefing Call',
      description: 'Conducted video call with Head of Supply Chain regarding multi-warehouse fulfillment.',
      timestamp: 'Today at 2:30 PM',
      status: 'COMPLETED',
      iconType: 'PHONE',
      actor: 'Sarah Jenkins (Account Exec)',
    },
    {
      id: 'act_2',
      title: 'Master Service Agreement Sent',
      description: 'Generated formal quote for 100 enterprise user seats and high-availability SLA.',
      timestamp: 'Yesterday at 10:15 AM',
      status: 'COMPLETED',
      iconType: 'EMAIL',
      actor: 'Automated System',
    },
    {
      id: 'act_3',
      title: 'Warehouse Automation Requirement Added',
      description: 'Customer specified requirement for automated zebra barcode scanner integration.',
      timestamp: 'Sep 17, 2026',
      status: 'COMPLETED',
      iconType: 'DOC',
      actor: 'Alex Rivera (Solutions Engineer)',
    },
    {
      id: 'act_4',
      title: 'Order ORD-2026-0919-01 Confirmed',
      description: 'Customer executed contract and placed enterprise hardware server batch order.',
      timestamp: 'Sep 16, 2026',
      status: 'COMPLETED',
      iconType: 'PACKAGE',
      actor: 'OMS Order Ingestion Engine',
    },
  ];

  const leadsCount = customers.filter((c) => c.status === 'LEAD').length;

  return (
    <div className="space-y-6 animate-smooth-fade">
      {/* Header & 5 Standard Module Tabs */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Customer Relationship Management</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
                CRM Core
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer 360, pipeline governance, contact touchpoints, and omnichannel synchronization.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-xs shrink-0 btn-press active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" /> Add Account
            </button>
          </div>
        </div>

        {/* Section 4: 5 Standard Tabs */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <MetricCard
              title="Total Accounts"
              value={customers.length}
              change={14.2}
              period="vs prior month"
              sparklineData={[12, 14, 18, 22, 25, 29, customers.length]}
            />
            <MetricCard
              title="Pipeline Leads"
              value={leadsCount || 12}
              change={28.5}
              period="active qualified"
              sparklineData={[5, 8, 7, 10, 14, 18, 22]}
            />
            <MetricCard
              title="Lead Conversion Rate"
              value="68.4%"
              change={4.1}
              target="70.0%"
              period="lead to customer"
              sparklineData={[60, 62, 65, 68]}
            />
            <MetricCard
              title="Weighted Pipeline"
              value="$482,500"
              change={19.8}
              period="active deals"
              sparklineData={[140, 180, 220, 310, 390, 482]}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Pipeline Opportunity Stages</h3>
                <span className="font-mono text-xs text-slate-500">$482.5k Total Value</span>
              </div>
              <div className="space-y-3">
                {[
                  { stage: '1. Discovery / Qualification', count: 18, val: '$84,000', pct: '100%' },
                  { stage: '2. Solution Validation', count: 12, val: '$142,500', pct: '72%' },
                  { stage: '3. Proposal & Procurement', count: 8, val: '$168,000', pct: '48%' },
                  { stage: '4. Executive Negotiation', count: 4, val: '$88,000', pct: '24%' },
                ].map((s, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{s.stage}</span>
                      <span className="font-mono font-bold text-slate-900">{s.val} ({s.count} deals)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div style={{ width: s.pct }} className="h-full bg-blue-600 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Recent Customer Activity</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Real-time touchpoint feed.</p>
                </div>
                <div className="pt-3">
                  <Timeline items={mockActivities.slice(0, 3)} />
                </div>
              </div>
              <button
                onClick={() => setActiveTab('WORKSPACE')}
                className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
              >
                Open Customer 360 Workspace ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WORKSPACE */}
      {activeTab === 'WORKSPACE' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs">
            {/* Status Pills */}
            <div className="flex items-center gap-1">
              {filterTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all btn-press ${
                    statusFilter === tab
                      ? 'bg-slate-900 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, company..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          {/* Customers Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Customer / Account</th>
                    <th className="px-5 py-3.5">Contact Channels</th>
                    <th className="px-5 py-3.5">Lifecycle Status</th>
                    <th className="px-5 py-3.5">Registered</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        No customers match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCustomer(c)}
                        className="hover:bg-slate-50/70 cursor-pointer transition-colors group"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/70 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:border-teal-500/50 group-hover:bg-teal-50/50 transition-colors">
                              {getInitials(c.name)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                {c.name}
                                {c.company && (
                                  <span className="text-[10px] text-slate-500 font-normal">
                                    • {c.company}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                Acc ID: #{c.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[180px]">{c.email}</span>
                            </div>
                            {c.phone && (
                              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{c.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border ${
                              c.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : c.status === 'LEAD'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomer(c);
                            }}
                            className="p-1 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONFIGURATION */}
      {activeTab === 'CONFIG' && (
        <ConfigPanel
          title="Customer Relationship Module Settings"
          subtitle="Configure automated lead routing, scoring weights, and external CRM sync cadences."
          sections={crmConfigSections}
          onChangeField={handleCrmConfigChange}
          onSave={handleSaveCrmConfig}
          onReset={() => toast.info('Reset Defaults', 'Restored CRM default configuration.')}
        />
      )}

      {/* TAB 4: PROVIDER SETTINGS */}
      {activeTab === 'PROVIDERS' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">CRM & Marketing Connectors</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              External CRM sync engines, contact book adapters, and omnichannel dialers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                id: 'hubspot',
                name: 'HubSpot Enterprise CRM',
                status: 'CONNECTED',
                description: 'Bi-directional deal pipeline, marketing lists, and contact sync.',
                lastSync: '2 mins ago',
                latency: '42ms',
              },
              {
                id: 'salesforce',
                name: 'Salesforce Lightning Experience',
                status: 'CONFIGURED',
                description: 'Lead generation and enterprise contract management connector.',
                lastSync: '10 mins ago',
                latency: '58ms',
              },
              {
                id: 'twilio',
                name: 'Twilio Voice & SMS Dispatcher',
                status: 'CONNECTED',
                description: 'Automated SMS updates and customer verification OTP.',
                lastSync: 'Real-time',
                latency: '19ms',
              },
              {
                id: 'sendgrid',
                name: 'SendGrid Email API',
                status: 'CONNECTED',
                description: 'Transactional email delivery and newsletter campaigns.',
                lastSync: 'Real-time',
                latency: '26ms',
              },
            ].map((prov) => (
              <div key={prov.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900 text-xs">{prov.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{prov.description}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {prov.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-slate-200 text-slate-500">
                  <span>Latency: {prov.latency}</span>
                  <button
                    onClick={() => toast.success('Connection Verified', `${prov.name} handshake active.`)}
                    className="text-teal-700 font-semibold hover:text-teal-800"
                  >
                    Test Ping ➔
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ANALYTICS */}
      {activeTab === 'ANALYTICS' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">CRM Conversion & Performance Telemetry</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sales cycle duration, lead channel attribution, and account lifetime value distribution.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Average Sales Cycle</span>
              <div className="font-mono text-xl font-bold text-blue-700">18.4 Days</div>
              <span className="text-[11px] text-emerald-700 font-semibold">-3.2 days vs Q2 benchmark</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Average Account LTV</span>
              <div className="font-mono text-xl font-bold text-emerald-700">$34,800</div>
              <span className="text-[11px] text-slate-500">Net revenue retention 118%</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Sales Quota Attainment</span>
              <div className="font-mono text-xl font-bold text-slate-900">92.4%</div>
              <span className="text-[11px] text-emerald-700 font-semibold">On track for Q3 target</span>
            </div>
          </div>
        </div>
      )}

      {/* Customer Profile 360 Drawer */}
      <Drawer
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title="Customer 360 Profile"
        subtitle={selectedCustomer ? `ID: #${selectedCustomer.id} • ${selectedCustomer.name}` : ''}
        width="lg"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Top Identity Card */}
            <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-bold text-base flex items-center justify-center shadow-xs">
                  {getInitials(selectedCustomer.name)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    {selectedCustomer.name}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                        selectedCustomer.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : selectedCustomer.status === 'LEAD'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {selectedCustomer.status}
                    </span>
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {selectedCustomer.company || 'Enterprise Account'}
                    </span>
                    <span>•</span>
                    <span className="font-mono">
                      Joined {new Date(selectedCustomer.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {onSelectCustomerForOrder && (
                <button
                  onClick={() => {
                    const custId = selectedCustomer.id;
                    setSelectedCustomer(null);
                    onSelectCustomerForOrder(custId);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors shadow-xs btn-press"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-teal-600" /> New Order
                </button>
              )}
            </div>

            {/* Profile Tabs */}
            <div className="flex border-b border-slate-200">
              {(['OVERVIEW', 'ACTIVITIES', 'DEALS', 'ORDERS', 'DOCUMENTS'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCustomerProfileTab(tab)}
                  className={`px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${
                    customerProfileTab === tab
                      ? 'border-slate-900 text-slate-900 font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* TAB CONTENT */}
            {customerProfileTab === 'OVERVIEW' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                    <span className="text-[11px] text-slate-500 uppercase font-mono font-medium">
                      Total Lifetime Spend
                    </span>
                    <div className="font-mono text-lg font-bold text-slate-900">
                      ${(selectedCustomer.total_spent || 10850).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                    <span className="text-[11px] text-slate-500 uppercase font-mono font-medium">
                      Fulfilled Orders
                    </span>
                    <div className="font-mono text-lg font-bold text-slate-900">
                      {selectedCustomer.orders_count || 1} Orders
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                  <h4 className="font-bold text-xs text-slate-900 uppercase font-mono tracking-wider">
                    Contact Channels
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Corporate Email</span>
                      <span className="font-mono text-slate-800 font-medium">{selectedCustomer.email}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Direct Phone</span>
                      <span className="font-mono text-slate-800 font-medium">
                        {selectedCustomer.phone || '+1 (555) 019-2830'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-500">Billing Address</span>
                      <span className="text-slate-800 font-medium text-right">
                        100 Silicon Ave, Suite 400, San Jose, CA
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {customerProfileTab === 'ACTIVITIES' && (
              <div className="space-y-4">
                <Timeline items={mockActivities} />
              </div>
            )}

            {customerProfileTab === 'DEALS' && (
              <div className="space-y-3">
                {mockDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="p-4 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl space-y-2 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-bold text-slate-900 text-xs">{deal.title}</h5>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Stage: {deal.stage}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {deal.value}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                      <span>Close Probability: {deal.probability}</span>
                      <span>Target: {deal.expectedClose}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {customerProfileTab === 'ORDERS' && (
              <div className="space-y-3">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-teal-700 text-xs">
                      ORD-2026-0919-01
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      2x Server Pro, 1x Core Switch
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 text-xs">$10,850.00</span>
                    <span className="block text-[10px] font-mono text-emerald-700 font-semibold mt-0.5">
                      CONFIRMED
                    </span>
                  </div>
                </div>
              </div>
            )}

            {customerProfileTab === 'DOCUMENTS' && (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="font-medium text-slate-700 text-xs">No documents attached</div>
                <p className="text-[11px] text-slate-400">
                  Upload MSA contracts, billing forms, or compliance certificates.
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Enterprise Account"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Account / Contact Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Acme Corp / Jane Doe"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="eleanor@acme.corp"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Acme Global Inc"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as 'LEAD' | 'ACTIVE' | 'INACTIVE',
                })
              }
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="LEAD">LEAD</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors btn-press text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50 shadow-xs btn-press text-xs"
            >
              {loading ? 'Creating...' : 'Save Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
