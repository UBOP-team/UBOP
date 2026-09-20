import React, { useState } from 'react';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Modal } from '../Modal';
import { Supplier, Warehouse } from '../../types';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  warehouses: Warehouse[];
  onConfirm: (payload: {
    supplier_id: number;
    warehouse_id: number;
    buyer_id: string;
    currency: string;
    tax_total: number;
    shipping_total: number;
    expected_delivery_date?: string;
    notes?: string;
    lines: Array<{
      product_reference: string;
      description_snapshot?: string;
      ordered_quantity: number;
      unit: string;
      unit_cost: number;
    }>;
  }) => Promise<void>;
}

interface DraftPOLine {
  product_reference: string;
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  warehouses,
  onConfirm,
}) => {
  const [supplierId, setSupplierId] = useState<number>(suppliers[0]?.id || 1);
  const [warehouseId, setWarehouseId] = useState<number>(warehouses[0]?.id || 1);
  const [buyerId, setBuyerId] = useState('lan_procurement');
  const [taxTotal, setTaxTotal] = useState<number>(0);
  const [shippingTotal, setShippingTotal] = useState<number>(0);
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lines, setLines] = useState<DraftPOLine[]>([
    {
      product_reference: 'SKU-MAT-01',
      description: 'Industrial Polyethylene Pellets',
      quantity: 500,
      unit: 'kg',
      unit_cost: 24000,
    },
  ]);

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);
  const isSupplierOnHold = selectedSupplier?.status === 'ON_HOLD';

  const addLine = () => {
    setLines([
      ...lines,
      {
        product_reference: '',
        description: '',
        quantity: 100,
        unit: 'pcs',
        unit_cost: 50000,
      },
    ]);
  };

  const removeLine = (idx: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== idx));
    }
  };

  const updateLine = (idx: number, field: keyof DraftPOLine, val: any) => {
    const next = [...lines];
    next[idx] = { ...next[idx], [field]: val };
    setLines(next);
  };

  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unit_cost, 0);
  const grandTotal = subtotal + taxTotal + shippingTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSupplierOnHold) {
      setError('Cannot issue purchase orders to suppliers on hold.');
      return;
    }
    for (const l of lines) {
      if (!l.product_reference.trim()) {
        setError('All purchase lines must have a valid SKU / Product Reference.');
        return;
      }
      if (l.quantity <= 0 || l.unit_cost < 0) {
        setError('Quantities and unit costs must be positive numbers.');
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      await onConfirm({
        supplier_id: supplierId,
        warehouse_id: warehouseId,
        buyer_id: buyerId,
        currency: 'VND',
        tax_total: taxTotal,
        shipping_total: shippingTotal,
        expected_delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
        notes: notes.trim() || undefined,
        lines: lines.map((l) => ({
          product_reference: l.product_reference.trim(),
          description_snapshot: l.description.trim() || undefined,
          ordered_quantity: l.quantity,
          unit: l.unit,
          unit_cost: l.unit_cost,
        })),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create purchase order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Draft Purchase Order" size="xl">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {isSupplierOnHold && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              <strong>Warning:</strong> Selected supplier is currently <strong>ON HOLD</strong>. PO creation is blocked until compliance review clears this supplier.
            </span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary PO Details */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Supplier *</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              {suppliers.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.name} ({sup.supplier_code}) {sup.status === 'ON_HOLD' ? '— [ON HOLD]' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Delivery Destination *</label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.code} — {wh.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Expected Delivery Date</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Buyer / Specialist</label>
            <input
              type="text"
              value={buyerId}
              onChange={(e) => setBuyerId(e.target.value)}
              placeholder="lan_procurement"
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Line Items Table */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-slate-700 font-semibold">Purchase Order Line Items *</label>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Line Item
            </button>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-[11px]">
                <tr>
                  <th className="py-2 px-3">SKU / Product *</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-2 text-right">Quantity</th>
                  <th className="py-2 px-2">Unit</th>
                  <th className="py-2 px-2 text-right">Unit Cost</th>
                  <th className="py-2 px-3 text-right">Line Total</th>
                  <th className="py-2 px-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        placeholder="e.g. SKU-MAT-01"
                        value={line.product_reference}
                        onChange={(e) => updateLine(idx, 'product_reference', e.target.value)}
                        className="w-full border border-slate-200 rounded px-2 py-1 font-mono font-medium text-slate-800 focus:outline-blue-500"
                        required
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        placeholder="Commercial description"
                        value={line.description}
                        onChange={(e) => updateLine(idx, 'description', e.target.value)}
                        className="w-full border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-blue-500"
                      />
                    </td>
                    <td className="py-2 px-2 text-right">
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-20 text-right border border-slate-200 rounded px-2 py-1 font-mono font-medium focus:outline-blue-500"
                        required
                      />
                    </td>
                    <td className="py-2 px-2">
                      <select
                        value={line.unit}
                        onChange={(e) => updateLine(idx, 'unit', e.target.value)}
                        className="border border-slate-200 rounded px-1.5 py-1 bg-white"
                      >
                        <option value="pcs">pcs</option>
                        <option value="kg">kg</option>
                        <option value="liters">liters</option>
                        <option value="boxes">boxes</option>
                      </select>
                    </td>
                    <td className="py-2 px-2 text-right">
                      <input
                        type="number"
                        min="0"
                        value={line.unit_cost}
                        onChange={(e) => updateLine(idx, 'unit_cost', parseFloat(e.target.value) || 0)}
                        className="w-24 text-right border border-slate-200 rounded px-2 py-1 font-mono font-medium focus:outline-blue-500"
                        required
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-slate-800">
                      ₫{(line.quantity * line.unit_cost).toLocaleString()}
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

        {/* Commercial Total Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Commercial Notes & Delivery Terms</label>
            <textarea
              rows={3}
              placeholder="e.g., CIF Hai Phong Port, Payment Net 30, Packaging standards..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Lines Subtotal</span>
              <span className="font-mono font-medium">₫{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>VAT / Tax Total</span>
              <input
                type="number"
                min="0"
                value={taxTotal}
                onChange={(e) => setTaxTotal(parseFloat(e.target.value) || 0)}
                className="w-28 text-right border border-slate-300 rounded px-2 py-0.5 font-mono text-xs"
              />
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Freight / Shipping Total</span>
              <input
                type="number"
                min="0"
                value={shippingTotal}
                onChange={(e) => setShippingTotal(parseFloat(e.target.value) || 0)}
                className="w-28 text-right border border-slate-300 rounded px-2 py-0.5 font-mono text-xs"
              />
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
              <span>Grand Total</span>
              <span className="font-mono text-blue-700">₫{grandTotal.toLocaleString()}</span>
            </div>
          </div>
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
            disabled={loading || isSupplierOnHold}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Creating...' : 'Create Draft Purchase Order'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
