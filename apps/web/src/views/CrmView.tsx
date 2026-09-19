import React, { useState } from 'react';
import {
  Plus,
  Building,
  Mail,
  Phone,
  Search,
  ChevronRight,
  ShoppingCart,
  Calendar,
  Users,
  UserCheck,
  TrendingUp,
  DollarSign,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { Customer } from '../types';
import { Modal } from '../components/Modal';
import { Drawer } from '../components/Drawer';
import { useToast } from '../components/Toast';
import { MetricCard } from '../components/MetricCard';
import { Timeline, TimelineItem } from '../components/Timeline';

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

  const mockDocuments = [
    { name: 'Master Services Agreement (MSA).pdf', size: '2.4 MB', type: 'Contract' },
    { name: 'Enterprise SOC-2 Compliance Attestation.pdf', size: '1.8 MB', type: 'Security' },
    { name: 'Custom ERP Field Mapping Spec.xlsx', size: '420 KB', type: 'Technical' },
  ];

  const activityTimeline: TimelineItem[] = [
    {
      id: 'act_1',
      title: 'Updated deal (Enterprise Expansion)',
      description: 'Advanced deal stage to Proposal/Negotiation after VP technical review.',
      timestamp: 'Today at 15:30',
      actor: 'Sarah Jenkins (Account Lead)',
      status: 'COMPLETED',
      iconType: 'PAYMENT',
      badge: 'Sales Pipeline',
    },
    {
      id: 'act_2',
      title: 'Called customer (Discovery Session)',
      description: 'Discussed high-volume Shopify OMS order sync rate and multi-warehouse ATP requirements.',
      timestamp: 'Yesterday at 11:15',
      actor: 'David Chen (Solutions Architect)',
      status: 'COMPLETED',
      iconType: 'PHONE',
      badge: 'Outbound Call',
    },
    {
      id: 'act_3',
      title: 'Created lead',
      description: 'Lead ingested via Inbound Marketing Webhook from HubSpot connector.',
      timestamp: 'Sep 14, 2026',
      actor: 'System EventBus',
      status: 'COMPLETED',
      iconType: 'CHECK',
      badge: 'Inbound Hook',
    },
  ];

  const leadsCount = customers.filter((c) => c.status === 'LEAD').length;

  return (
    <div className="space-y-6 animate-smooth-fade">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer Relationship (CRM)</h2>
          <p className="text-xs text-slate-500 mt-1">
            Customer 360, pipeline governance, and omnichannel activity timelines.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-all shadow-xs shrink-0 btn-press"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* CRM Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Customers"
          value={customers.length}
          change={14.2}
          period="vs prior month"
          icon={Users}
          colorScheme="teal"
          sparklineData={[12, 14, 18, 22, 25, 29, customers.length]}
        />
        <MetricCard
          title="New Leads"
          value={leadsCount || 12}
          change={28.5}
          period="vs prior 30 days"
          icon={UserCheck}
          colorScheme="blue"
          sparklineData={[5, 8, 7, 10, 14, 18, 22]}
        />
        <MetricCard
          title="Conversion Rate"
          value="68.4%"
          change={4.1}
          target="70.0%"
          period="lead to customer"
          icon={TrendingUp}
          colorScheme="emerald"
        />
        <MetricCard
          title="Revenue Pipeline"
          value="$482,500"
          change={19.8}
          period="active opportunities"
          icon={DollarSign}
          colorScheme="indigo"
          sparklineData={[140, 180, 220, 310, 390, 482]}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs">
        {/* Status Pills */}
        <div className="flex items-center gap-1">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all btn-press ${
                statusFilter === tab
                  ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-xs'
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
                    onClick={() => {
                      setSelectedCustomer(c);
                      setCustomerProfileTab('OVERVIEW');
                    }}
                    className="hover:bg-slate-50/70 cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center font-bold text-teal-800 text-xs shadow-xs">
                          {getInitials(c.name)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
                            {c.name}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building className="w-3 h-3 text-slate-400" />
                            {c.company || 'Enterprise Account'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Mail className="w-3 h-3 text-slate-400" /> {c.email}
                      </div>
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-slate-500 mt-0.5 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" /> {c.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold uppercase ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : c.status === 'LEAD'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-teal-700 group-hover:text-teal-800 font-semibold inline-flex items-center gap-1 text-[11px]">
                        Profile 360 <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Profile 360 Slide-over Drawer */}
      <Drawer
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer ? selectedCustomer.name : 'Customer Profile'}
        subtitle="Salesforce Lightning Customer 360 Record"
        width="lg"
      >
        {selectedCustomer && (
          <div className="space-y-5 text-xs">
            {/* Header: Customer Information */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 font-bold text-sm flex items-center justify-center shadow-xs">
                  {getInitials(selectedCustomer.name)}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">{selectedCustomer.name}</h4>
                  <div className="text-slate-500 text-xs mt-0.5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    {selectedCustomer.company || 'Enterprise Account'}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-xs font-semibold">
                  {selectedCustomer.status}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ID: #{selectedCustomer.id}
                </span>
              </div>
            </div>

            {/* 5 Tabs: Overview | Activities | Deals | Orders | Documents */}
            <div className="flex items-center gap-1 border-b border-slate-200 pb-2 overflow-x-auto">
              {(
                [
                  { id: 'OVERVIEW', label: 'Overview' },
                  { id: 'ACTIVITIES', label: 'Activities' },
                  { id: 'DEALS', label: 'Deals' },
                  { id: 'ORDERS', label: 'Orders' },
                  { id: 'DOCUMENTS', label: 'Documents' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCustomerProfileTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap text-xs btn-press ${
                    customerProfileTab === tab.id
                      ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: OVERVIEW */}
            {customerProfileTab === 'OVERVIEW' && (
              <div className="space-y-4 animate-smooth-fade">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                    <div className="text-[10px] text-slate-500 uppercase font-medium">Lifetime Value</div>
                    <div className="text-base font-bold text-teal-700 mt-1">$28,450.00</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                    <div className="text-[10px] text-slate-500 uppercase font-medium">Orders Count</div>
                    <div className="text-base font-bold text-slate-900 mt-1">4 Orders</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                    <div className="text-[10px] text-slate-500 uppercase font-medium">Payment Health</div>
                    <div className="text-base font-bold text-emerald-700 mt-1">Tier-1 Prompt</div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <span className="font-semibold text-slate-800 block mb-1">Account Specifications</span>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address:
                    </span>
                    <span className="font-mono">{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number:
                    </span>
                    <span>{selectedCustomer.phone || '+1 (555) 234-5678'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Customer Since:
                    </span>
                    <span>{new Date(selectedCustomer.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {onSelectCustomerForOrder && (
                  <button
                    onClick={() => onSelectCustomerForOrder(selectedCustomer.id)}
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs btn-press"
                  >
                    <ShoppingCart className="w-4 h-4" /> Create Omnichannel Order in OMS
                  </button>
                )}
              </div>
            )}

            {/* TAB 2: ACTIVITIES */}
            {customerProfileTab === 'ACTIVITIES' && (
              <div className="space-y-3 animate-smooth-fade">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-700 text-xs font-semibold">Activity Timeline</span>
                  <button
                    type="button"
                    onClick={() => toast.info('Log Activity', 'Quick log call/meeting opened.')}
                    className="text-teal-700 hover:text-teal-800 text-xs font-semibold"
                  >
                    + Log Activity
                  </button>
                </div>
                <Timeline items={activityTimeline} mode="vertical" />
              </div>
            )}

            {/* TAB 3: DEALS */}
            {customerProfileTab === 'DEALS' && (
              <div className="space-y-3 animate-smooth-fade">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-700 text-xs font-semibold">Associated Deals & Pipeline</span>
                  <span className="font-mono text-teal-700 font-bold">$60,500 Total</span>
                </div>

                <div className="space-y-2.5">
                  {mockDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{deal.title}</span>
                        <span className="font-mono font-bold text-teal-700">{deal.value}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Stage: <span className="text-slate-700 font-medium">{deal.stage}</span></span>
                        <span>Prob: {deal.probability}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        Target Close: {deal.expectedClose}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: ORDERS */}
            {customerProfileTab === 'ORDERS' && (
              <div className="space-y-3 animate-smooth-fade">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-slate-800">ORD-2026-0919-01</span>
                    <div className="text-[11px] text-slate-500 mt-0.5">2 Items • Shopify Provider Route</div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-700">$10,850.00</span>
                    <span className="block text-[10px] text-slate-500 font-mono">DELIVERED</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-slate-800">ORD-2026-0919-02</span>
                    <div className="text-[11px] text-slate-500 mt-0.5">5 Items • Amazon Seller Central</div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-teal-700">$17,600.00</span>
                    <span className="block text-[10px] text-teal-700 font-mono">SHIPPED</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: DOCUMENTS */}
            {customerProfileTab === 'DOCUMENTS' && (
              <div className="space-y-2.5 animate-smooth-fade">
                {mockDocuments.map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                      <div>
                        <div className="font-medium text-slate-800">{doc.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {doc.type} • {doc.size}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toast.info('Downloading Document', `Fetching ${doc.name}...`)}
                      className="p-1.5 text-slate-400 hover:text-teal-700"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Modal: Add Customer */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Customer Account"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Eleanor Vance"
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
              className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors btn-press"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-xs btn-press"
            >
              {loading ? 'Creating...' : 'Save Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
