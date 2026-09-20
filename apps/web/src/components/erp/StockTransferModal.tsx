import React, { useState } from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Modal } from '../Modal';
import { Warehouse, InventoryPosition } from '../../types';

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouses: Warehouse[];
  inventoryPositions: InventoryPosition[];
  onConfirm: (payload: {
    from_warehouse_id: number;
    to_warehouse_id: number;
    created_by: string;
    notes?: string;
    lines: Array<{
      product_reference: string;
      requested_quantity: number;
      unit: string;
    }>;
  }) => Promise<void>;
}

export const StockTransferModal: React.FC<StockTransferModalProps> = ({
  isOpen,
  onClose,
  warehouses,
  inventoryPositions,
  onConfirm,
}) => {
  const [fromWarehouseId, setFromWarehouseId] = useState<number>(warehouses[0]?.id || 1);
  const [toWarehouseId, setToWarehouseId] = useState<number>(warehouses[1]?.id || warehouses[0]?.id || 1);
  const [selectedProductRef, setSelectedProductRef] = useState<string>(
    inventoryPositions[0]?.product_reference || 'SKU-SERV-01'
  );
  const [quantity, setQuantity] = useState<number>(10);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available source stock
  const sourcePos = inventoryPositions.find(
    (p) => p.warehouse_id === fromWarehouseId && p.product_reference === selectedProductRef
  );
  const sourceAvailable = sourcePos?.available_quantity ?? 0;
  const isSameWarehouse = fromWarehouseId === toWarehouseId;
  const isExceedingStock = quantity > sourceAvailable;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSameWarehouse) {
      setError('Source and destination warehouses cannot be the same.');
      return;
    }
    if (quantity <= 0) {
      setError('Transfer quantity must be greater than zero.');
      return;
    }
    if (isExceedingStock) {
      setError(`Cannot transfer more than available quantity (${sourceAvailable}).`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onConfirm({
        from_warehouse_id: fromWarehouseId,
        to_warehouse_id: toWarehouseId,
        created_by: 'inventory_manager',
        notes: notes.trim() || undefined,
        lines: [
          {
            product_reference: selectedProductRef,
            requested_quantity: quantity,
            unit: sourcePos?.unit || 'pcs',
          },
        ],
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to initiate stock transfer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Initiate Inter-Warehouse Stock Transfer" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Warehouse Route */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Source Warehouse (From) *</label>
            <select
              value={fromWarehouseId}
              onChange={(e) => setFromWarehouseId(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none font-medium text-slate-800"
            >
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.code} — {wh.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Destination Warehouse (To) *</label>
            <select
              value={toWarehouseId}
              onChange={(e) => setToWarehouseId(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none font-medium text-slate-800"
            >
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.code} — {wh.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Material & Quantity */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Select Material / SKU *</label>
            <input
              type="text"
              value={selectedProductRef}
              onChange={(e) => setSelectedProductRef(e.target.value)}
              placeholder="e.g. SKU-SERV-01"
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Transfer Quantity *</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Source Stock Preview */}
        <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-slate-500 block text-[11px]">Source Stock Position</span>
            <span className="font-mono font-medium text-slate-700">
              On Hand: {sourcePos?.on_hand_quantity ?? '—'} · Reserved: {sourcePos?.reserved_quantity ?? 0}
            </span>
          </div>

          <div className="text-right">
            <span className="text-slate-500 block text-[11px]">Transferable Availability</span>
            <span
              className={`font-mono font-bold text-sm ${
                isExceedingStock ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              {sourceAvailable} {sourcePos?.unit || 'pcs'}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-1">Transfer Notes & Carrier</label>
          <input
            type="text"
            placeholder="Transfer route, internal dispatch note, or vehicle info..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
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
            disabled={loading || isSameWarehouse || isExceedingStock}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            {loading ? 'Initiating...' : 'Create Stock Transfer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
