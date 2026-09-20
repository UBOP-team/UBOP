import React, { useState } from 'react';
import { Modal } from '../Modal';
import { Warehouse } from '../../types';

interface WarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateWarehouse: (wh: Partial<Warehouse>) => Promise<void>;
}

export const WarehouseModal: React.FC<WarehouseModalProps> = ({
  isOpen,
  onClose,
  onCreateWarehouse,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError('Warehouse Code and Facility Name are required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onCreateWarehouse({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        address: address.trim() || undefined,
        timezone,
        status: 'ACTIVE',
        sync_status: 'SYNCED',
      });
      onClose();
      setCode('');
      setName('');
      setAddress('');
    } catch (err: any) {
      setError(err?.message || 'Failed to create warehouse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Commission New Warehouse Facility" size="md">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Facility Code *</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. SOUTH_DC"
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 font-mono uppercase"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
            >
              <option value="Asia/Ho_Chi_Minh">Asia/Ho Chi Minh (GMT+7)</option>
              <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
              <option value="UTC">UTC (Cloud DC)</option>
              <option value="America/New_York">America/New York (EST)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-1">Warehouse Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Southern Hub (Ho Chi Minh City)"
            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-1">Street Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Tan Thuan Export Processing Zone, Dist 7, HCMC"
            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
          />
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
            {loading ? 'Creating...' : 'Create Facility'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
