import React, { useState } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { Order, OrderItem, OrderReturn } from '../../types';
import { Modal } from '../Modal';

interface CreateReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onSubmit: (payload: {
    reason_summary: string;
    items: Array<{ order_line_id: number; quantity: number; reason: string }>;
  }) => Promise<void>;
}

export const CreateReturnModal: React.FC<CreateReturnModalProps> = ({
  isOpen,
  onClose,
  order,
  onSubmit,
}) => {
  const [reasonSummary, setReasonSummary] = useState('Customer reported product issue');
  const [returnReason, setReturnReason] = useState('DAMAGED');
  const [loading, setLoading] = useState(false);

  const orderLines = order.lines || order.items || [];
  const eligibleLines = orderLines.filter((l) => (l.fulfilled_quantity || 0) - (l.returned_quantity || 0) > 0);

  const [returnQtys, setReturnQtys] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    eligibleLines.forEach((l) => {
      init[l.id || 0] = 1;
    });
    return init;
  });

  const totalReturnQty = Object.values(returnQtys).reduce((a, b) => a + b, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalReturnQty <= 0) return;

    setLoading(true);
    try {
      const items = Object.entries(returnQtys)
        .filter(([_, q]) => q > 0)
        .map(([id, q]) => ({
          order_line_id: parseInt(id, 10),
          quantity: q,
          reason: returnReason,
        }));

      await onSubmit({
        reason_summary: reasonSummary,
        items,
      });
      onClose();
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Create Return — Order #${order.order_number}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {eligibleLines.length === 0 ? (
          <div className="p-4 bg-amber-50 rounded-lg text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">No Eligible Items for Return</p>
              <p className="text-xs text-amber-700 mt-1">
                Returns can only be created for items that have already been physically fulfilled and have not yet been returned.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Return Reason Category</label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="DAMAGED">Damaged / Defective Goods</option>
                <option value="WRONG_ITEM">Wrong Item Received</option>
                <option value="NOT_AS_EXPECTED">Item Not as Expected / Described</option>
                <option value="SIZE_OR_VARIANT">Incorrect Size or Specification</option>
                <option value="CUSTOMER_CHANGED_MIND">Customer Changed Mind</option>
                <option value="OTHER">Other Reason</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Summary / Note</label>
              <input
                type="text"
                value={reasonSummary}
                onChange={(e) => setReasonSummary(e.target.value)}
                placeholder="e.g. Broken seal on container lid"
                className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-2">Select Items & Quantities to Return</label>
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
                {eligibleLines.map((line: OrderItem) => {
                  const fulfilled = line.fulfilled_quantity || 0;
                  const alreadyReturned = line.returned_quantity || 0;
                  const maxReturnable = fulfilled - alreadyReturned;

                  return (
                    <div key={line.id} className="p-3 flex items-center justify-between gap-3 bg-white">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-slate-900 truncate">
                          {line.product_name || line.sku || 'Commercial SKU'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Fulfilled: {fulfilled} · Already returned: {alreadyReturned} · Eligible: {maxReturnable}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Return:</span>
                        <input
                          type="number"
                          min="0"
                          max={maxReturnable}
                          value={returnQtys[line.id || 0] || 0}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(parseInt(e.target.value, 10) || 0, maxReturnable));
                            setReturnQtys((prev) => ({ ...prev, [line.id || 0]: val }));
                          }}
                          className="w-16 px-2 py-1 border border-slate-300 rounded text-center font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="text-slate-400">/ {maxReturnable}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || totalReturnQty <= 0}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium rounded-md shadow-xs transition-colors inline-flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {loading ? 'Submitting...' : `Create Return (${totalReturnQty} items)`}
              </button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};

interface ProcessReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  returnRecord: OrderReturn;
  onApprove?: () => Promise<void>;
  onDecline?: (reason: string) => Promise<void>;
  onReceiveAndInspect: (items: Array<{ return_line_id: number; condition: string; restock_disposition: string }>) => Promise<void>;
}

export const ProcessReturnModal: React.FC<ProcessReturnModalProps> = ({
  isOpen,
  onClose,
  returnRecord,
  onApprove,
  onDecline,
  onReceiveAndInspect,
}) => {
  const [loading, setLoading] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclinePrompt, setShowDeclinePrompt] = useState(false);

  const [dispositions, setDispositions] = useState<Record<number, { condition: string; disposition: string }>>(() => {
    const init: Record<number, { condition: string; disposition: string }> = {};
    returnRecord.lines.forEach((l) => {
      init[l.id] = { condition: 'GOOD', disposition: 'RESTOCK' };
    });
    return init;
  });

  const handleInspect = async () => {
    setLoading(true);
    try {
      const items = returnRecord.lines.map((l) => ({
        return_line_id: l.id,
        condition: dispositions[l.id]?.condition || 'GOOD',
        restock_disposition: dispositions[l.id]?.disposition || 'RESTOCK',
      }));
      await onReceiveAndInspect(items);
      onClose();
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Process Return #${returnRecord.return_number}`}
    >
      <div className="space-y-4 text-xs">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="flex justify-between pb-1 border-b border-slate-200/60 font-mono">
            <span className="text-slate-500">Return Number:</span>
            <span className="font-semibold text-slate-900">{returnRecord.return_number}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Status:</span>
            <span className="font-semibold text-amber-700">{returnRecord.status}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-slate-500">Reason:</span>
            <span className="font-medium text-slate-800">{returnRecord.reason_summary || 'Not specified'}</span>
          </div>
        </div>

        {/* Inspection disposition */}
        <div>
          <label className="block font-semibold text-slate-700 mb-2">Item Inspection & Restock Disposition</label>
          <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
            {returnRecord.lines.map((l) => (
              <div key={l.id} className="p-3 bg-white space-y-2">
                <div className="flex justify-between items-center font-medium text-slate-800">
                  <span>Line Item #{l.order_line_id}</span>
                  <span className="font-bold text-blue-600">{l.quantity} units</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-0.5">Condition</label>
                    <select
                      value={dispositions[l.id]?.condition || 'GOOD'}
                      onChange={(e) =>
                        setDispositions((prev) => ({
                          ...prev,
                          [l.id]: { ...(prev[l.id] || { disposition: 'RESTOCK' }), condition: e.target.value },
                        }))
                      }
                      className="w-full p-1.5 border border-slate-300 rounded text-xs"
                    >
                      <option value="GOOD">Good / Resalable</option>
                      <option value="DAMAGED">Damaged / Defective</option>
                      <option value="OTHER">Other Inspection</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-0.5">Disposition</label>
                    <select
                      value={dispositions[l.id]?.disposition || 'RESTOCK'}
                      onChange={(e) =>
                        setDispositions((prev) => ({
                          ...prev,
                          [l.id]: { ...(prev[l.id] || { condition: 'GOOD' }), disposition: e.target.value },
                        }))
                      }
                      className="w-full p-1.5 border border-slate-300 rounded text-xs"
                    >
                      <option value="RESTOCK">Restock into Inventory</option>
                      <option value="DO_NOT_RESTOCK">Do Not Restock / Discard</option>
                      <option value="INSPECTION_REQUIRED">Further Audit Required</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showDeclinePrompt ? (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
            <label className="block text-xs font-semibold text-rose-800">Decline Reason</label>
            <input
              type="text"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g. Warranty period expired"
              className="w-full p-2 border border-rose-300 rounded text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeclinePrompt(false)}
                className="px-2.5 py-1 text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!onDecline) return;
                  setLoading(true);
                  await onDecline(declineReason);
                  setLoading(false);
                  onClose();
                }}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <div>
              {onDecline && returnRecord.status === 'REQUESTED' && (
                <button
                  type="button"
                  onClick={() => setShowDeclinePrompt(true)}
                  className="px-3 py-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded"
                >
                  Decline Return
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {onApprove && returnRecord.status === 'REQUESTED' && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    await onApprove();
                    setLoading(false);
                    onClose();
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-xs"
                >
                  Approve Return
                </button>
              )}
              <button
                type="button"
                disabled={loading}
                onClick={handleInspect}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md shadow-xs"
              >
                {loading ? 'Processing...' : 'Complete Physical Inspection'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
