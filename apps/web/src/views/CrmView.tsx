import React, { useState } from 'react';
import {
  Plus,
  Building,
  Mail,
  Phone,
  Tag,
  Search,
  ChevronRight,
  ShoppingCart,
  Calendar,
  Send,
} from 'lucide-react';
import { Customer } from '../types';
import { Modal } from '../components/Modal';
import { Drawer } from '../components/Drawer';
import { useToast } from '../components/Toast';

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
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'ACTIVE' as const,
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Customer Relationship (CRM)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise account directory, buyer lifecycle tracking, and Customer 360 engagement.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-semibold px-4 py-2 rounded-xl text-xs transition-all shadow-lg shadow-teal-500/10 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80">
        {/* Status Pills */}
        <div className="flex items-center gap-1">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === tab
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, company..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Customer / Account</th>
                <th className="px-6 py-3.5">Contact Channels</th>
                <th className="px-6 py-3.5">Lifecycle Status</th>
                <th className="px-6 py-3.5">Registered</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No customers match the current filter.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className="hover:bg-slate-900/50 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center font-bold text-teal-400 text-xs shadow-inner">
                          {getInitials(c.name)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 group-hover:text-teal-400 transition-colors">
                            {c.name}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Building className="w-3 h-3 text-slate-500" />
                            {c.company || 'Enterprise Account'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Mail className="w-3 h-3 text-slate-500" /> {c.email}
                      </div>
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-slate-500 mt-0.5 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-500" /> {c.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold uppercase ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : c.status === 'LEAD'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/30'
                        }`}
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-slate-500 group-hover:text-teal-400 transition-colors inline-flex items-center gap-1 text-[11px]">
                        Details <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer 360 Slide-over Drawer */}
      <Drawer
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer ? selectedCustomer.name : 'Customer Profile'}
        subtitle="Customer 360 overview, orders, and interaction timeline."
        width="lg"
      >
        {selectedCustomer && (
          <div className="space-y-6 text-xs">
            {/* Account Card */}
            <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 font-bold text-sm flex items-center justify-center">
                  {getInitials(selectedCustomer.name)}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-100">{selectedCustomer.name}</h4>
                  <div className="text-slate-400 text-xs mt-0.5">
                    {selectedCustomer.company || 'Enterprise Account'}
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-xs font-semibold">
                {selectedCustomer.status}
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-center">
                <div className="text-[10px] text-slate-500 uppercase font-medium">Lifetime Value</div>
                <div className="text-base font-bold text-teal-400 mt-1">$10,850.00</div>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-center">
                <div className="text-[10px] text-slate-500 uppercase font-medium">Orders Placed</div>
                <div className="text-base font-bold text-slate-100 mt-1">2 Orders</div>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-center">
                <div className="text-[10px] text-slate-500 uppercase font-medium">Payment Health</div>
                <div className="text-base font-bold text-emerald-400 mt-1">Prompt</div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2.5">
              <span className="font-semibold text-slate-200 block mb-1">Communication Records</span>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email:
                </span>
                <span className="font-mono">{selectedCustomer.email}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Phone:
                </span>
                <span>{selectedCustomer.phone || 'None provided'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Account Since:
                </span>
                <span>{new Date(selectedCustomer.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Engagement Timeline */}
            <div>
              <span className="font-semibold text-slate-200 block mb-3">Activity Stream</span>
              <div className="space-y-3 pl-2 border-l-2 border-slate-800">
                <div className="relative pl-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-400 absolute -left-[18px] top-1 ring-4 ring-slate-900" />
                  <div className="font-medium text-slate-200">Order Confirmed (ORD-2026-0919-02)</div>
                  <div className="text-slate-400 text-[11px]">Total: $13,200.00 via Stripe Provider</div>
                  <div className="text-slate-500 text-[10px] font-mono mt-0.5">Today at 18:30</div>
                </div>
                <div className="relative pl-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-400 absolute -left-[18px] top-1 ring-4 ring-slate-900" />
                  <div className="font-medium text-slate-200">Welcome Notification Sent</div>
                  <div className="text-slate-400 text-[11px]">Dispatched via SendGrid Provider</div>
                  <div className="text-slate-500 text-[10px] font-mono mt-0.5">Yesterday</div>
                </div>
                <div className="relative pl-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -left-[18px] top-1 ring-4 ring-slate-900" />
                  <div className="font-medium text-slate-200">Account Created</div>
                  <div className="text-slate-400 text-[11px]">Registered via CRM API Endpoint</div>
                  <div className="text-slate-500 text-[10px] font-mono mt-0.5">
                    {new Date(selectedCustomer.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  toast.info('Message Dispatched', `Notification sent to ${selectedCustomer.email}`);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium transition-colors"
              >
                <Send className="w-3.5 h-3.5" /> Send Notice
              </button>
              <button
                onClick={() => {
                  if (onSelectCustomerForOrder) {
                    onSelectCustomerForOrder(selectedCustomer.id);
                  }
                  setSelectedCustomer(null);
                  toast.info('Redirecting', 'Navigated to OMS order creation.');
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold transition-colors shadow-lg shadow-teal-500/10"
              >
                <ShoppingCart className="w-3.5 h-3.5" /> New Order
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Modal: Add Customer */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Customer">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Customer / Contact Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Sarah Jenkins"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Work Email Address *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="sarah@globaltech.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="GlobalTech Inc"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1-555-0123"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Lifecycle Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="LEAD">LEAD</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
