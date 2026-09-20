import React, { useState } from 'react';
import { CreditCard, AlertCircle } from 'lucide-react';
import { Order } from '../../types';
import { Modal } from '../Modal';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onSubmit: (payload: {
    amount: number;
    payment_method: string;
    reference?: string;
    note?: string;
  }) => Promise<void>;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  order,
  onSubmit,
}) => {
  const transactions = order.transactions || [];
  const totalPaid = transactions
    .filter((t) => t.status === 'SUCCESS' && ['SALE', 'CAPTURE', 'MANUAL_PAYMENT'].includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);

  const amountDue = Math.max(0, (order.grand_total || order.total_amount) - totalPaid);

  const [amount, setAmount] = useState<number>(amountDue);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [reference, setReference] = useState(`WIRE-${Date.now().toString().slice(-6)}`);
  const [note, setNote] = useState('Manual payment confirmed by accounts receivable');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setErrorMsg('Payment amount must be greater than 0.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    try {
      await onSubmit({
        amount,
        payment_method: paymentMethod,
        reference,
        note,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to record payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payment — Order #${order.order_number}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Financial Context */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
          <div className="flex justify-between text-slate-600">
            <span>Order Grand Total:</span>
            <span className="font-mono font-medium text-slate-800">
              {order.currency || 'VND'} {(order.grand_total || order.total_amount).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Already Received:</span>
            <span className="font-mono font-medium text-emerald-700">
              {order.currency || 'VND'} {totalPaid.toLocaleString()}
            </span>
          </div>
          <div className="border-t border-slate-200/80 pt-1 flex justify-between font-bold text-slate-900">
            <span>Outstanding Due:</span>
            <span className="font-mono text-amber-700">
              {order.currency || 'VND'} {amountDue.toLocaleString()}
            </span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="font-semibold text-slate-700">Amount Received ({order.currency || 'VND'})</label>
            <button
              type="button"
              onClick={() => setAmount(amountDue)}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
            >
              Pay Full Balance ({amountDue.toLocaleString()})
            </button>
          </div>
          <input
            type="number"
            min="1"
            step="any"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-sm font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Payment Channel / Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="BANK_TRANSFER">Direct Commercial Bank Wire Transfer</option>
            <option value="CREDIT_CARD">Corporate Credit Card (Stripe Terminal)</option>
            <option value="MANUAL_CASH">Cash on Delivery (COD)</option>
            <option value="CHECK">Commercial Bank Check / Letter of Credit</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Reference / Transaction Voucher Number</label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. WIRE-881923"
            className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Accounting Note (Optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Net-30 payment cleared by treasury"
            className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || amount <= 0}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-md shadow-xs inline-flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            {loading ? 'Recording...' : `Confirm Payment (${amount.toLocaleString()} ${order.currency || 'VND'})`}
          </button>
        </div>
      </form>
    </Modal>
  );
};
