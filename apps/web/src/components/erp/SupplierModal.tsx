import React, { useState } from 'react';
import { Modal } from '../Modal';
import { Supplier } from '../../types';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSupplier: (supplier: Partial<Supplier>) => Promise<void>;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  onCreateSupplier,
}) => {
  const [supplierCode, setSupplierCode] = useState('');
  const [name, setName] = useState('');
  const [taxIdentifier, setTaxIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('NET_30');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !supplierCode.trim()) {
      setError('Supplier Code and Legal Name are required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onCreateSupplier({
        supplier_code: supplierCode.trim().toUpperCase(),
        name: name.trim(),
        tax_identifier: taxIdentifier.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        payment_terms: paymentTerms,
        currency,
        status: 'ACTIVE',
        sync_status: 'SYNCED',
      });
      onClose();
      // Reset
      setSupplierCode('');
      setName('');
      setTaxIdentifier('');
      setEmail('');
      setPhone('');
      setAddress('');
      setPaymentTerms('NET_30');
    } catch (err: any) {
      setError(err?.message || 'Failed to create supplier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register New Strategic Supplier" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Supplier Code *</label>
            <input
              type="text"
              required
              value={supplierCode}
              onChange={(e) => setSupplierCode(e.target.value.toUpperCase())}
              placeholder="e.g., SUP-VND-005"
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 font-mono uppercase"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Company / Vendor Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Foxconn Precision Components Ltd"
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Tax / VAT Identifier</label>
            <input
              type="text"
              value={taxIdentifier}
              onChange={(e) => setTaxIdentifier(e.target.value)}
              placeholder="e.g., VN-0102938475"
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="chen.wei@foxconn.com"
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+84 241 382 9900"
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-1">Factory / HQ Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Que Vo Industrial Zone, Bac Ninh Province, Vietnam"
            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Commercial Payment Terms</label>
            <select
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
            >
              <option value="NET_15">Net 15 Days</option>
              <option value="NET_30">Net 30 Days (Standard Enterprise)</option>
              <option value="NET_60">Net 60 Days</option>
              <option value="NET_90">Net 90 Days</option>
              <option value="PREPAYMENT">100% Prepayment Required</option>
              <option value="COD">Cash On Delivery (COD)</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Settlement Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 font-mono"
            >
              <option value="USD">USD ($ - US Dollar)</option>
              <option value="VND">VND (₫ - Vietnamese Dong)</option>
              <option value="EUR">EUR (€ - Euro)</option>
              <option value="SGD">SGD (S$ - Singapore Dollar)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded border border-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Registering...' : 'Register Supplier'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
