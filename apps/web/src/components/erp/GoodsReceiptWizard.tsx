import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Modal } from '../Modal';
import { PurchaseOrder, StorageLocation } from '../../types';

interface GoodsReceiptWizardProps {
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrder;
  storageLocations?: StorageLocation[];
  onConfirm: (payload: {
    purchase_order_id: number;
    warehouse_id: number;
    received_by: string;
    supplier_delivery_reference?: string;
    note?: string;
    lines: Array<{
      purchase_order_line_id: number;
      product_reference: string;
      expected_quantity: number;
      received_quantity: number;
      accepted_quantity: number;
      blocked_quantity: number;
      damaged_quantity: number;
      unit: string;
      storage_location_id?: number;
      note?: string;
    }>;
  }) => Promise<void>;
}

interface LineReceiptState {
  lineId: number;
  productRef: string;
  ordered: number;
  previouslyReceived: number;
  remaining: number;
  receivedQty: number;
  acceptedQty: number;
  blockedQty: number;
  damagedQty: number;
  locationId?: number;
}

export const GoodsReceiptWizard: React.FC<GoodsReceiptWizardProps> = ({
  isOpen,
  onClose,
  order,
  storageLocations = [],
  onConfirm,
}) => {
  const [deliveryRef, setDeliveryRef] = useState('');
  const [receivedBy, setReceivedBy] = useState('warehouse_clerk');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize line states
  const [lineStates, setLineStates] = useState<LineReceiptState[]>(() =>
    order.lines.map((l) => {
      const remaining = Math.max(0, l.ordered_quantity - l.received_quantity);
      return {
        lineId: l.id,
        productRef: l.product_reference,
        ordered: l.ordered_quantity,
        previouslyReceived: l.received_quantity,
        remaining,
        receivedQty: remaining,
        acceptedQty: remaining,
        blockedQty: 0,
        damagedQty: 0,
        locationId: undefined,
      };
    })
  );

  const handleQtyChange = (
    idx: number,
    field: 'receivedQty' | 'acceptedQty' | 'blockedQty' | 'damagedQty',
    val: number
  ) => {
    const next = [...lineStates];
    const curr = { ...next[idx], [field]: Math.max(0, val) };

    // Auto-adjust accepted if total received changed
    if (field === 'receivedQty') {
      curr.acceptedQty = Math.max(0, curr.receivedQty - curr.blockedQty - curr.damagedQty);
    }
    next[idx] = curr;
    setLineStates(next);
  };

  const handleLocationChange = (idx: number, locId?: number) => {
    const next = [...lineStates];
    next[idx] = { ...next[idx], locationId: locId };
    setLineStates(next);
  };

  const validate = (): string | null => {
    let hasReceiving = false;
    for (const l of lineStates) {
      if (l.receivedQty > 0) hasReceiving = true;
      if (l.receivedQty > l.remaining) {
        return `Over-receipt blocked for ${l.productRef}: received ${l.receivedQty} exceeds remaining ${l.remaining}.`;
      }
      const sum = l.acceptedQty + l.blockedQty + l.damagedQty;
      if (Math.abs(sum - l.receivedQty) > 0.001) {
        return `Reconciliation mismatch for ${l.productRef}: Accepted (${l.acceptedQty}) + Blocked (${l.blockedQty}) + Damaged (${l.damagedQty}) must equal Received (${l.receivedQty}).`;
      }
    }
    if (!hasReceiving) {
      return 'Please enter at least one received quantity greater than 0.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valErr = validate();
    if (valErr) {
      setError(valErr);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onConfirm({
        purchase_order_id: order.id,
        warehouse_id: order.warehouse_id,
        received_by: receivedBy,
        supplier_delivery_reference: deliveryRef.trim() || undefined,
        note: note.trim() || undefined,
        lines: lineStates
          .filter((l) => l.receivedQty > 0)
          .map((l) => ({
            purchase_order_line_id: l.lineId,
            product_reference: l.productRef,
            expected_quantity: l.remaining,
            received_quantity: l.receivedQty,
            accepted_quantity: l.acceptedQty,
            blocked_quantity: l.blockedQty,
            damaged_quantity: l.damagedQty,
            unit: 'pcs',
            storage_location_id: l.locationId,
          })),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to post goods receipt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Post Goods Receipt — ${order.po_number}`} size="xl">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Header Facts */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-slate-400 block text-[11px]">Purchase Order</span>
            <strong className="text-slate-900 font-mono font-semibold">{order.po_number}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Supplier</span>
            <strong className="text-slate-800 font-medium">{order.supplier?.name || 'Commercial Supplier'}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Destination Warehouse</span>
            <span className="text-slate-700 font-medium">Warehouse #{order.warehouse_id}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Current PO Status</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 font-semibold uppercase">
              {order.status}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Metadata Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Supplier Delivery Reference / BOL</label>
            <input
              type="text"
              placeholder="e.g. BOL-88921 or Waybill #"
              value={deliveryRef}
              onChange={(e) => setDeliveryRef(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Received By (Operator ID) *</label>
            <input
              type="text"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
              required
            />
          </div>
        </div>

        {/* Line Items Table with Classification (Accepted / Blocked / Damaged) */}
        <div>
          <label className="block text-slate-700 font-semibold mb-1.5">
            PO Lines & Quality Inspection Breakdown *
          </label>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-[11px]">
                <tr>
                  <th className="py-2 px-3">Item / SKU</th>
                  <th className="py-2 px-2 text-center">Remaining</th>
                  <th className="py-2 px-2 text-center">Receive Qty</th>
                  <th className="py-2 px-2 text-center text-emerald-700 font-semibold">Accepted</th>
                  <th className="py-2 px-2 text-center text-amber-700">Blocked</th>
                  <th className="py-2 px-2 text-center text-rose-700">Damaged</th>
                  <th className="py-2 px-3">Storage Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lineStates.map((line, idx) => {
                  const sumClassified = line.acceptedQty + line.blockedQty + line.damagedQty;
                  const isMismatched = Math.abs(sumClassified - line.receivedQty) > 0.001;

                  return (
                    <tr key={line.lineId} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800 block">{line.productRef}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Ordered: {line.ordered} · Prev Recv: {line.previouslyReceived}
                        </span>
                      </td>

                      <td className="py-2.5 px-2 text-center font-mono font-medium text-slate-600">
                        {line.remaining}
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          min="0"
                          max={line.remaining}
                          step="any"
                          value={line.receivedQty}
                          onChange={(e) =>
                            handleQtyChange(idx, 'receivedQty', parseFloat(e.target.value) || 0)
                          }
                          className="w-16 text-center border border-slate-300 rounded px-1.5 py-1 font-mono font-semibold text-slate-900 focus:outline-blue-500"
                        />
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={line.acceptedQty}
                          onChange={(e) =>
                            handleQtyChange(idx, 'acceptedQty', parseFloat(e.target.value) || 0)
                          }
                          className="w-16 text-center border border-emerald-300 rounded px-1.5 py-1 font-mono text-emerald-700 font-semibold bg-emerald-50/50 focus:outline-emerald-500"
                        />
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={line.blockedQty}
                          onChange={(e) =>
                            handleQtyChange(idx, 'blockedQty', parseFloat(e.target.value) || 0)
                          }
                          className="w-14 text-center border border-amber-300 rounded px-1.5 py-1 font-mono text-amber-700 bg-amber-50/50 focus:outline-amber-500"
                        />
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={line.damagedQty}
                          onChange={(e) =>
                            handleQtyChange(idx, 'damagedQty', parseFloat(e.target.value) || 0)
                          }
                          className="w-14 text-center border border-rose-300 rounded px-1.5 py-1 font-mono text-rose-700 bg-rose-50/50 focus:outline-rose-500"
                        />
                      </td>

                      <td className="py-2.5 px-3">
                        <select
                          value={line.locationId || ''}
                          onChange={(e) =>
                            handleLocationChange(idx, e.target.value ? Number(e.target.value) : undefined)
                          }
                          className="w-full border border-slate-300 rounded px-2 py-1 text-[11px] bg-white"
                        >
                          <option value="">General Main Storage</option>
                          {storageLocations.map((loc) => (
                            <option key={loc.id} value={loc.id}>
                              {loc.code} ({loc.type})
                            </option>
                          ))}
                        </select>
                        {isMismatched && (
                          <span className="text-[10px] text-rose-600 font-medium block mt-0.5">
                            ≠ Sum mismatch!
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-1">Receiving Remarks / Notes</label>
          <input
            type="text"
            placeholder="Condition notes, seal numbers, or carrier observations..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
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
            className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            {loading ? 'Posting...' : 'Post Goods Receipt'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
