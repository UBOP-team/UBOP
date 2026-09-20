import React, { useState } from 'react';
import {
  PackageCheck,
  Building2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Order, OrderItem } from '../../types';
import { Modal } from '../Modal';

interface FulfillmentWizardProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onConfirmFulfillment: (payload: {
    location_reference: string;
    carrier: string;
    tracking_number?: string;
    tracking_url?: string;
    items: Array<{ order_line_id: number; quantity: number }>;
  }) => Promise<void>;
}

export const FulfillmentWizard: React.FC<FulfillmentWizardProps> = ({
  isOpen,
  onClose,
  order,
  onConfirmFulfillment,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Location
  const [location, setLocation] = useState('MAIN');

  // Step 2: Line quantities
  const orderLines = order.lines || order.items || [];
  const [selectedQuantities, setSelectedQuantities] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    orderLines.forEach((line) => {
      const remaining = line.quantity - (line.fulfilled_quantity || 0);
      initial[line.id || 0] = Math.max(0, remaining);
    });
    return initial;
  });

  // Step 3: Carrier & Tracking
  const [carrier, setCarrier] = useState('FedEx Priority Ground');
  const [trackingNumber, setTrackingNumber] = useState(`TRK-${Date.now().toString().slice(-6)}`);
  const [trackingUrl, setTrackingUrl] = useState('https://www.fedex.com/fedextrack/');

  const handleQtyChange = (lineId: number, qty: number, maxQty: number) => {
    const safeQty = Math.max(0, Math.min(qty, maxQty));
    setSelectedQuantities((prev) => ({ ...prev, [lineId]: safeQty }));
  };

  const totalFulfillingQty = Object.values(selectedQuantities).reduce((acc, q) => acc + q, 0);

  const handleFinish = async () => {
    if (totalFulfillingQty <= 0) return;
    setLoading(true);
    try {
      const itemsToFulfill = Object.entries(selectedQuantities)
        .filter(([_, qty]) => qty > 0)
        .map(([lineId, qty]) => ({
          order_line_id: parseInt(lineId, 10),
          quantity: qty,
        }));

      await onConfirmFulfillment({
        location_reference: location,
        carrier,
        tracking_number: trackingNumber,
        tracking_url: trackingUrl,
        items: itemsToFulfill,
      });
      onClose();
      setStep(1);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Fulfill Items — Order #${order.order_number}`}
    >
      <div className="space-y-5">
        {/* Wizard Stepper */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs">
          {[
            { num: 1, label: 'Location' },
            { num: 2, label: 'Select Items' },
            { num: 3, label: 'Shipment & Tracking' },
            { num: 4, label: 'Review' },
          ].map((s) => (
            <div
              key={s.num}
              className={`flex items-center gap-1.5 font-medium ${
                step === s.num
                  ? 'text-blue-600'
                  : step > s.num
                  ? 'text-emerald-600'
                  : 'text-slate-400'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                  step === s.num
                    ? 'bg-blue-600 text-white'
                    : step > s.num
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {step > s.num ? <Check className="w-3 h-3" /> : s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Location */}
        {step === 1 && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Select Fulfillment Origin Location
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'MAIN', name: 'Main DC (Chicago)', desc: 'Primary Automated Hub' },
                { id: 'NORTH', name: 'North Annex Hub', desc: 'Regional Logistics Center' },
                { id: 'DIGITAL', name: 'Digital Delivery Vault', desc: 'Software & Electronic Keys' },
              ].map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setLocation(loc.id)}
                  className={`p-3 text-left rounded-lg border text-xs transition-all ${
                    location === loc.id
                      ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    {loc.name}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{loc.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-xs transition-colors"
              >
                Next: Select Items
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Line Items */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Specify Quantities to Fulfill</span>
              <span className="text-xs text-slate-500">
                Total items to dispatch: <strong className="text-slate-800">{totalFulfillingQty}</strong>
              </span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs">
              {orderLines.map((line: OrderItem) => {
                const fulfilled = line.fulfilled_quantity || 0;
                const remaining = Math.max(0, line.quantity - fulfilled);
                const isFullyDone = remaining === 0;

                return (
                  <div
                    key={line.id}
                    className={`p-3 flex items-center justify-between gap-3 ${
                      isFullyDone ? 'bg-slate-50 opacity-60' : 'bg-white'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-900 truncate">
                        {line.product_name || line.name || 'Commercial SKU Item'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        SKU: {line.sku || 'GENERAL-SKU'} · Ordered: {line.quantity} · Already fulfilled: {fulfilled}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Fulfill now:</span>
                      <input
                        type="number"
                        min="0"
                        max={remaining}
                        disabled={isFullyDone}
                        value={selectedQuantities[line.id || 0] || 0}
                        onChange={(e) =>
                          handleQtyChange(line.id || 0, parseInt(e.target.value, 10) || 0, remaining)
                        }
                        className="w-16 px-2 py-1 border border-slate-300 rounded text-center text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                      />
                      <span className="text-slate-400">/ {remaining}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalFulfillingQty <= 0 && (
              <p className="text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Please select at least 1 item to fulfill.
              </p>
            )}

            <div className="flex justify-between pt-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                Back
              </button>
              <button
                type="button"
                disabled={totalFulfillingQty <= 0}
                onClick={() => setStep(3)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-md shadow-xs transition-colors"
              >
                Next: Shipment & Tracking
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Carrier & Tracking */}
        {step === 3 && (
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Shipping Carrier</label>
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="FedEx Priority Ground">FedEx Priority Ground</option>
                <option value="UPS WorldShip Express">UPS WorldShip Express</option>
                <option value="DHL Express Commercial">DHL Express Commercial</option>
                <option value="USPS Priority Mail">USPS Priority Mail</option>
                <option value="VNPOST Express Courier">VNPOST Express Courier</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Tracking Number</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. TRK-889123-US"
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-xs focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Tracking URL (Optional)</label>
              <input
                type="text"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex justify-between pt-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-xs transition-colors"
              >
                Next: Review & Confirm
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Target Order:</span>
                <span className="font-semibold text-slate-900 font-mono">#{order.order_number}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Fulfill from Location:</span>
                <span className="font-medium text-slate-900">{location}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Carrier & Tracking:</span>
                <span className="font-medium text-slate-900 font-mono">
                  {carrier} · {trackingNumber || 'No tracking'}
                </span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-slate-500">Items Dispatched:</span>
                <span className="font-bold text-blue-600">{totalFulfillingQty} total items</span>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleFinish}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors inline-flex items-center gap-2"
              >
                <PackageCheck className="w-4 h-4" />
                {loading ? 'Confirming Dispatch...' : 'Confirm Fulfillment'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
