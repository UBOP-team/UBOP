import React, { useState } from 'react';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Modal } from '../Modal';
import { Supplier } from '../../types';

interface PurchaseRequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  onConfirm: (payload: {
    requester_id: string;
    needed_by?: string;
    reason?: string;
    lines: Array<{
      product_reference: string;
      description_snapshot?: string;
      quantity: number;
      unit: string;
      estimated_unit_cost: number;
      preferred_supplier_id?: number;
    }>;
  }) => Promise<void>;
}

interface DraftPRLine {
  product_reference: string;
  description: string;
  quantity: number;
  unit: string;
  estimated_unit_cost: number;
  preferred_supplier_id?: number;
}

export const PurchaseRequisitionModal: React.FC<PurchaseRequisitionModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  onConfirm,
}) => {
  const [requesterId, setRequesterId] = useState('huy_ops_engineer');
  const [neededBy, setNeededBy] = useState('');
  const [reason, setReason] = useState('Factory replenishment & spare parts');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lines, setLines] = useState<DraftPRLine[]>([
    {
      product_reference: 'SKU-MAT-02',
      description: 'Secondary Additive Batch',
      quantity: 200,
      unit: 'kg',
      estimated_unit_cost: 35000,
      preferred_supplier_id: suppliers[0]?.id,
    },
  ]);

  const addLine = () => {
    setLines([
      ...lines,
      {
        product_reference: '',
        description: '',
        quantity: 50,
        unit: 'pcs',
        estimated_unit_cost: 50000,
      },
    ]);
  };

  const removeLine = (idx: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== idx));
    }
  };

  const updateLine = (idx: number, field: keyof DraftPRLine, val: any) => {
    const next = [...lines];
    next[idx] = { ...next[idx], [field]: val };
    setLines(next);
  };

  const totalEstimatedValue = lines.reduce((sum, l) => sum + l.quantity * l.estimated_unit_cost, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const l of lines) {
      if (!l.product_reference.trim()) {
        setError('All requisition lines must have a valid SKU / Product Reference.');
        return;
      }
      if (l.quantity <= 0) {
        setError('Quantities must be positive numbers.');
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      await onConfirm({
        requester_id: requesterId,
        needed_by: neededBy ? new Date(neededBy).toISOString() : undefined,
        reason: reason.trim() || undefined,
        lines: lines.map((l) => ({
          product_reference: l.product_reference.trim(),
          description_snapshot: l.description.trim() || undefined,
          quantity: l.quantity,
          unit: l.unit,
          estimated_unit_cost: l.estimated_unit_cost,
          preferred_supplier_id: l.preferred_supplier_id,
        })),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit requisition');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit Purchase Requisition" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Requester ID *</label>
            <input
              type="text"
              value={requesterId}
              onChange={(e) => setRequesterId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Date Needed By</label>
            <input
              type="date"
              value={neededBy}
              onChange={(e) => setNeededBy(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-1">Business Justification / Reason *</label>
          <input
            type="text"
            placeholder="Operational purpose or project code..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        {/* Lines */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-slate-700 font-semibold">Requisition Items *</label>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </button>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-[11px]">
                <tr>
                  <th className="py-2 px-3">Item / SKU *</th>
                  <th className="py-2 px-2 text-right">Quantity</th>
                  <th className="py-2 px-2">Unit</th>
                  <th className="py-2 px-2 text-right">Est. Unit Cost</th>
                  <th className="py-2 px-2">Preferred Supplier</th>
                  <th className="py-2 px-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        placeholder="SKU-..."
                        value={line.product_reference}
                        onChange={(e) => updateLine(idx, 'product_reference', e.target.value)}
                        className="w-full border border-slate-200 rounded px-2 py-1 font-mono text-slate-800 focus:outline-blue-500"
                        required
                      />
                    </td>
                    <td className="py-2 px-2 text-right">
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-16 text-right border border-slate-200 rounded px-1.5 py-1 font-mono focus:outline-blue-500"
                        required
                      />
                    </td>
                    <td className="py-2 px-2">
                      <select
                        value={line.unit}
                        onChange={(e) => updateLine(idx, 'unit', e.target.value)}
                        className="border border-slate-200 rounded px-1.5 py-1 bg-white text-[11px]"
                      >
                        <option value="pcs">pcs</option>
                        <option value="kg">kg</option>
                        <option value="liters">liters</option>
                      </select>
                    </td>
                    <td className="py-2 px-2 text-right">
                      <input
                        type="number"
                        min="0"
                        value={line.estimated_unit_cost}
                        onChange={(e) => updateLine(idx, 'estimated_unit_cost', parseFloat(e.target.value) || 0)}
                        className="w-24 text-right border border-slate-200 rounded px-1.5 py-1 font-mono focus:outline-blue-500"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <select
                        value={line.preferred_supplier_id || ''}
                        onChange={(e) =>
                          updateLine(
                            idx,
                            'preferred_supplier_id',
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                        className="w-full border border-slate-200 rounded px-1.5 py-1 bg-white text-[11px]"
                      >
                        <option value="">Any Approved Supplier</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        disabled={lines.length === 1}
                        className="text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-600 font-medium">Total Estimated Requisition Value</span>
          <span className="font-mono font-bold text-sm text-slate-900">
            ₫{totalEstimatedValue.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
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
            {loading ? 'Submitting...' : 'Submit Requisition'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
