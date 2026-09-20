import React, { useState } from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Modal } from '../Modal';
import { Warehouse, StorageLocation } from '../../types';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  productRef: string;
  productName?: string;
  currentOnHand: number;
  reservedQty?: number;
  blockedQty?: number;
  warehouses: Warehouse[];
  onConfirm: (payload: {
    product_reference: string;
    warehouse_id: number;
    storage_location_id?: number;
    adjustment_type: 'INCREASE' | 'DECREASE';
    quantity: number;
    reason_code: string;
    note?: string;
  }) => Promise<void>;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  productRef,
  productName,
  currentOnHand,
  reservedQty = 0,
  blockedQty = 0,
  warehouses,
  onConfirm,
}) => {
  const [warehouseId, setWarehouseId] = useState<number>(warehouses[0]?.id || 1);
  const [storageLocationId, setStorageLocationId] = useState<number | undefined>(undefined);
  const [adjustmentType, setAdjustmentType] = useState<'INCREASE' | 'DECREASE'>('INCREASE');
  const [quantity, setQuantity] = useState<number>(10);
  const [reasonCode, setReasonCode] = useState<string>('CYCLE_COUNT');
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);
  const locations: StorageLocation[] = selectedWarehouse?.storage_locations || [];

  const delta = adjustmentType === 'INCREASE' ? quantity : -quantity;
  const newOnHand = currentOnHand + delta;
  const isNegative = newOnHand < 0;
  const violatesProtectedStock = newOnHand < (reservedQty + blockedQty);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setError('Adjustment quantity must be greater than zero.');
      return;
    }
    if (isNegative) {
      setError('Inventory invariant violation: on-hand quantity cannot be negative.');
      return;
    }
    if (violatesProtectedStock) {
      setError('Inventory invariant violation: on-hand cannot fall below reserved + blocked stock.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onConfirm({
        product_reference: productRef,
        warehouse_id: warehouseId,
        storage_location_id: storageLocationId,
        adjustment_type: adjustmentType,
        quantity,
        reason_code: reasonCode,
        note: note.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to post stock adjustment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Post Stock Adjustment — ${productRef}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {productName && (
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <span className="text-slate-500 font-medium block">Target Material:</span>
            <strong className="text-sm text-slate-800 font-semibold">{productName}</strong>
            <span className="text-slate-400 font-mono ml-2">({productRef})</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Target Warehouse *</label>
            <select
              value={warehouseId}
              onChange={(e) => {
                setWarehouseId(Number(e.target.value));
                setStorageLocationId(undefined);
              }}
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
            <label className="block text-slate-700 font-medium mb-1">Storage Location</label>
            <select
              value={storageLocationId || ''}
              onChange={(e) => setStorageLocationId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">General Area / Default</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.code} — {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Adjustment Type *</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('INCREASE')}
                className={`flex-1 py-1.5 rounded font-medium border text-center transition-colors cursor-pointer ${
                  adjustmentType === 'INCREASE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                + Increase Stock
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('DECREASE')}
                className={`flex-1 py-1.5 rounded font-medium border text-center transition-colors cursor-pointer ${
                  adjustmentType === 'DECREASE'
                    ? 'bg-rose-50 text-rose-700 border-rose-300 font-semibold'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                - Decrease Stock
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Quantity Delta *</label>
            <input
              type="number"
              min="0.01"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-1">Reason Code *</label>
          <select
            value={reasonCode}
            onChange={(e) => setReasonCode(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="CYCLE_COUNT">Physical Cycle Count Audit (Kiểm kê định kỳ)</option>
            <option value="DAMAGED_GOODS">Damaged / Expired Goods Scrap (Hàng hư hỏng / quá hạn)</option>
            <option value="RECEIPT_POSTING">Inbound Discrepancy Correction (Điều chỉnh sau kiểm nhận)</option>
            <option value="RESTOCK">Manual Procurement Intake (Bổ sung nhập kho thủ công)</option>
            <option value="SCRAP">Scrapped Materials (Tiêu hủy phế phẩm)</option>
            <option value="OTHER">Other Operational Variance (Lý do vận hành khác)</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-1">Operator Notes</label>
          <input
            type="text"
            placeholder="Audit notes or transaction reference..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Dynamic Before & After Impact Review Strip (Section 10) */}
        <div className="bg-slate-100 rounded-lg p-3.5 border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block mb-2">
            Inventory Impact Preview
          </span>
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block">Current On Hand</span>
              <span className="font-mono font-bold text-slate-800 text-sm">{currentOnHand}</span>
            </div>

            <div className="text-slate-400 flex items-center gap-1">
              <span className={`font-bold font-mono ${adjustmentType === 'INCREASE' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {adjustmentType === 'INCREASE' ? `+${quantity}` : `-${quantity}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </div>

            <div>
              <span className="text-slate-400 block">Projected On Hand</span>
              <span className={`font-mono font-bold text-sm ${isNegative ? 'text-rose-600' : 'text-emerald-700'}`}>
                {newOnHand}
              </span>
            </div>
          </div>

          {(reservedQty > 0 || blockedQty > 0) && (
            <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between">
              <span>Protected Stock (Reserved: {reservedQty}, Blocked: {blockedQty})</span>
              <span className="font-semibold text-slate-700">Total: {reservedQty + blockedQty}</span>
            </div>
          )}
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
            disabled={loading || isNegative || violatesProtectedStock}
            className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Posting...' : 'Post Stock Adjustment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
