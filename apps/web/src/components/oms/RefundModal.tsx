import React, { useState } from 'react';
import { DollarSign, AlertCircle, ShieldAlert } from 'lucide-react';
import { Order } from '../../types';
import { Modal } from '../Modal';

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onSubmit: (payload: {
    amount: number;
    reason: string;
    return_id?: number;
    refund_method: string;
  }) => Promise<void>;
}

export const RefundModal: React.FC<RefundModalProps> = ({
  isOpen,
  onClose,
  order,
  onSubmit,
}) => {
  const transactions = order.transactions || [];
  const totalPaid = transactions
    .filter((t) => t.status === 'SUCCESS' && ['SALE', 'CAPTURE', 'MANUAL_PAYMENT'].includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRefunded = transactions
    .filter((t) => t.status === 'SUCCESS' && t.type === 'REFUND')
    .reduce((sum, t) => sum + t.amount, 0);

  const maxRefundable = Math.max(0, totalPaid - totalRefunded);

  const [refundAmount, setRefundAmount] = useState<number>(maxRefundable);
  const [reason, setReason] = useState('Customer dissatisfaction / damaged goods');
  const [refundMethod, setRefundMethod] = useState('ORIGINAL_PAYMENT');
  const [selectedReturnId, setSelectedReturnId] = useState<number | undefined>(
    order.returns && order.returns.length > 0 ? order.returns[0].id : undefined
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (refundAmount <= 0) {
      setErrorMsg('Refund amount must be greater than 0.');
      return;
    }
    if (refundAmount > maxRefundable) {
      setErrorMsg(`Refund amount cannot exceed remaining net paid balance of ${order.currency || 'VND'} ${maxRefundable.toLocaleString()}.`);
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    try {
      await onSubmit({
        amount: refundAmount,
        reason,
        return_id: selectedReturnId,
        refund_method: refundMethod,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to issue refund.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Issue Refund — Order #${order.order_number}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Financial balance breakdown */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
          <div className="flex justify-between text-slate-600">
            <span>Total Captured:</span>
            <span className="font-medium text-slate-800 font-mono">
              {order.currency || 'VND'} {totalPaid.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Already Refunded:</span>
            <span className="font-medium text-purple-700 font-mono">
              - {order.currency || 'VND'} {totalRefunded.toLocaleString()}
            </span>
          </div>
          <div className="border-t border-slate-200/80 pt-1.5 flex justify-between font-bold text-slate-900">
            <span>Max Refundable:</span>
            <span className="text-emerald-700 font-mono">
              {order.currency || 'VND'} {maxRefundable.toLocaleString()}
            </span>
          </div>
        </div>

        {maxRefundable <= 0 ? (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>This order has no refundable balance remaining.</span>
          </div>
        ) : (
          <>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-slate-700">Refund Amount ({order.currency || 'VND'})</label>
                <button
                  type="button"
                  onClick={() => setRefundAmount(maxRefundable)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                >
                  Set Maximum ({maxRefundable.toLocaleString()})
                </button>
              </div>
              <input
                type="number"
                min="1"
                max={maxRefundable}
                step="any"
                value={refundAmount}
                onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-semibold font-mono focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Refund Method</label>
              <select
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ORIGINAL_PAYMENT">Original Payment Gateway (Stripe/Bank)</option>
                <option value="MANUAL_BANK_TRANSFER">Manual Wire Transfer</option>
                <option value="STORE_CREDIT">Store Credit Voucher</option>
              </select>
            </div>

            {order.returns && order.returns.length > 0 && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Link to Return Case (Optional)</label>
                <select
                  value={selectedReturnId || ''}
                  onChange={(e) => setSelectedReturnId(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                >
                  <option value="">None (Standalone Adjustment)</option>
                  {order.returns.map((ret) => (
                    <option key={ret.id} value={ret.id}>
                      {ret.return_number} — {ret.status}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Refund Reason *</label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Return inspection confirmed damaged unit"
                className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

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
                disabled={loading || refundAmount <= 0}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-md shadow-xs transition-colors inline-flex items-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                {loading ? 'Processing Refund...' : `Confirm Refund (${refundAmount.toLocaleString()} ${order.currency || 'VND'})`}
              </button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};
