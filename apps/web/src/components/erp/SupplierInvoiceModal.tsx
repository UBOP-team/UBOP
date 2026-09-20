import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Modal } from '../Modal';
import { Supplier, PurchaseOrder, SupplierInvoice } from '../../types';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  onConfirm: (payload: {
    supplier_id: number;
    purchase_order_id?: number;
    subtotal: number;
    tax_total: number;
    due_date?: string;
    currency: string;
  }) => Promise<void>;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  purchaseOrders,
  onConfirm,
}) => {
  const [supplierId, setSupplierId] = useState<number>(suppliers[0]?.id || 1);
  const [poId, setPoId] = useState<number | undefined>(purchaseOrders[0]?.id);
  const [subtotal, setSubtotal] = useState<number>(10000000);
  const [taxTotal, setTaxTotal] = useState<number>(1000000);
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill subtotal from selected PO if available
  const handlePoChange = (val: string) => {
    const pId = val ? Number(val) : undefined;
    setPoId(pId);
    if (pId) {
      const selectedPo = purchaseOrders.find((p) => p.id === pId);
      if (selectedPo) {
        setSupplierId(selectedPo.supplier_id);
        setSubtotal(selectedPo.subtotal);
        setTaxTotal(selectedPo.tax_total);
      }
    }
  };

  const grandTotal = subtotal + taxTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subtotal <= 0) {
      setError('Subtotal must be greater than zero.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onConfirm({
        supplier_id: supplierId,
        purchase_order_id: poId,
        subtotal,
        tax_total: taxTotal,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        currency: 'VND',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create supplier invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register Supplier Inbound Invoice" size="md">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-slate-700 font-medium mb-1">Match Purchase Order (Optional for 3-Way Match)</label>
          <select
            value={poId || ''}
            onChange={(e) => handlePoChange(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Direct Invoice (No PO)</option>
            {purchaseOrders.map((po) => (
              <option key={po.id} value={po.id}>
                {po.po_number} — ₫{po.grand_total.toLocaleString()} ({po.supplier?.name || 'Supplier'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-1">Supplier *</label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(Number(e.target.value))}
            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            {suppliers.map((sup) => (
              <option key={sup.id} value={sup.id}>
                {sup.name} ({sup.supplier_code})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Subtotal Amount *</label>
            <input
              type="number"
              min="0"
              value={subtotal}
              onChange={(e) => setSubtotal(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">VAT / Tax Total</label>
            <input
              type="number"
              min="0"
              value={taxTotal}
              onChange={(e) => setTaxTotal(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-1">Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-600 font-medium">Payable Grand Total</span>
          <span className="font-mono font-bold text-sm text-blue-700">₫{grandTotal.toLocaleString()}</span>
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
            {loading ? 'Creating...' : 'Register Invoice'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

interface InvoiceMatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: SupplierInvoice | null;
  purchaseOrder?: PurchaseOrder;
  onResolve: (action: string, note: string) => Promise<void>;
  onApprove: () => Promise<void>;
}

export const InvoiceMatchDialog: React.FC<InvoiceMatchDialogProps> = ({
  isOpen,
  onClose,
  invoice,
  purchaseOrder,
  onResolve,
  onApprove,
}) => {
  const [resolutionAction, setResolutionAction] = useState<string>('ACCEPT_VARIANCE');
  const [resolutionNote, setResolutionNote] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !invoice) return null;

  const poTotal = purchaseOrder?.grand_total ?? 0;
  const invTotal = invoice.grand_total;
  const variance = invTotal - poTotal;
  const isMismatch = invoice.status === 'MISMATCH' || invoice.match_status !== 'MATCHED';

  const handleResolveSubmit = async () => {
    if (!resolutionNote.trim()) {
      setError('Please provide an audit justification note for mismatch resolution.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await onResolve(resolutionAction, resolutionNote.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to resolve mismatch');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      await onApprove();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to approve invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`3-Way Match Review — ${invoice.invoice_number}`} size="lg">
      <div className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 3-Way Match Verification Card */}
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
          <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider flex items-center justify-between">
            <span>3-Way Matching Comparison</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                invoice.match_status === 'MATCHED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {invoice.match_status}
            </span>
          </h4>

          <div className="grid grid-cols-3 gap-3 text-center pt-2">
            <div className="bg-white p-3 rounded border border-slate-200">
              <span className="text-[11px] text-slate-400 block">Purchase Order</span>
              <strong className="text-slate-800 font-mono text-sm">
                ₫{poTotal.toLocaleString()}
              </strong>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {purchaseOrder?.po_number || 'Direct'}
              </span>
            </div>

            <div className="bg-white p-3 rounded border border-slate-200">
              <span className="text-[11px] text-slate-400 block">Supplier Invoice</span>
              <strong className="text-slate-800 font-mono text-sm">
                ₫{invTotal.toLocaleString()}
              </strong>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {invoice.invoice_number}
              </span>
            </div>

            <div
              className={`p-3 rounded border ${
                Math.abs(variance) < 0.01
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-700'
                  : 'bg-rose-50/50 border-rose-200 text-rose-700'
              }`}
            >
              <span className="text-[11px] block">Variance Amount</span>
              <strong className="font-mono text-sm block">
                {variance > 0 ? `+₫${variance.toLocaleString()}` : `₫${variance.toLocaleString()}`}
              </strong>
              <span className="text-[10px] block mt-0.5 font-medium">
                {Math.abs(variance) < 0.01 ? 'Fully Balanced' : 'Discrepancy Detected'}
              </span>
            </div>
          </div>
        </div>

        {/* Resolution Options if Mismatched */}
        {isMismatch && (
          <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-amber-900 text-xs flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Mismatch Resolution Decision (Section 26)
            </h4>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="resolutionAction"
                  value="ACCEPT_VARIANCE"
                  checked={resolutionAction === 'ACCEPT_VARIANCE'}
                  onChange={(e) => setResolutionAction(e.target.value)}
                  className="text-blue-600"
                />
                <span className="text-slate-800 font-medium">
                  Accept variance (Authorized operational tolerance override)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="resolutionAction"
                  value="CORRECT_INVOICE"
                  checked={resolutionAction === 'CORRECT_INVOICE'}
                  onChange={(e) => setResolutionAction(e.target.value)}
                  className="text-blue-600"
                />
                <span className="text-slate-800 font-medium">
                  Correct invoice data (Request amended invoice from supplier)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="resolutionAction"
                  value="RETURN_TO_SUPPLIER"
                  checked={resolutionAction === 'RETURN_TO_SUPPLIER'}
                  onChange={(e) => setResolutionAction(e.target.value)}
                  className="text-blue-600"
                />
                <span className="text-slate-800 font-medium">
                  Reject & Return invoice to supplier
                </span>
              </label>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Resolution Justification Note *
              </label>
              <input
                type="text"
                placeholder="Required approval authorization (e.g. Approved by CFO as freight surcharge)..."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleResolveSubmit}
                disabled={loading}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded shadow-xs cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Resolving...' : 'Confirm Resolution'}
              </button>
            </div>
          </div>
        )}

        {/* Existing Resolution Note if present */}
        {invoice.resolution_note && (
          <div className="p-3 bg-slate-100 rounded text-slate-700 text-[11px]">
            <strong>Audit Record:</strong> {invoice.resolution_note}
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer"
          >
            Close
          </button>

          {!isMismatch && invoice.status !== 'APPROVED' && (
            <button
              type="button"
              onClick={handleApproveSubmit}
              disabled={loading}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {loading ? 'Approving...' : 'Approve for Payment'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
