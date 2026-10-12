import React from 'react';
import { Order } from '../types';
import { CheckCheck, X, Check, Eye, AlertCircle } from 'lucide-react';

interface ApprovalsViewProps {
  orders: Order[];
  onApproveOrder: (orderId: string) => void;
  onRejectOrder: (orderId: string, note?: string) => void;
  onApproveAll: (orderIds: string[]) => void;
  onOpenInvoice: (order: Order) => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  orders,
  onApproveOrder,
  onRejectOrder,
  onApproveAll,
  onOpenInvoice
}) => {
  const awaitingOrders = orders.filter(o => o.approval);

  const handleRejectPrompt = (orderId: string) => {
    const reason = window.prompt('Reject করার কারণ লিখুন (driver কে জানানো হবে):');
    if (reason !== null) {
      onRejectOrder(orderId, reason);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <h2 className="text-base font-bold text-slate-800">Driver Status Approvals</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Approve না করা পর্যন্ত status final হয় না, report এবং stock এ ধরা হয় না।
          </p>
        </div>

        <button
          onClick={() => onApproveAll(awaitingOrders.map(o => o.id))}
          disabled={awaitingOrders.length === 0}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <CheckCheck className="w-4 h-4" /> Approve All ({awaitingOrders.length})
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {awaitingOrders.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">কোনো approval বাকি নেই!</h3>
            <p className="text-xs text-slate-500 mt-1">সব ড্রাইভার স্ট্যাটাস আপডেট প্রক্রিয়াধীন সম্পন্ন হয়েছে।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Order ID / Date</th>
                  <th className="py-3 px-4">Customer &amp; Items</th>
                  <th className="py-3 px-4">Driver</th>
                  <th className="py-3 px-4">Driver Submitted Status</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {awaitingOrders.map(o => {
                  const itemsSummary = o.items.map(it => `${it.sku}×${it.qty}`).join(', ');
                  return (
                    <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold font-mono text-slate-900">{o.id}</div>
                        <div className="text-[11px] text-slate-400">{o.date}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{o.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{o.phone}</div>
                        <div className="text-[11px] text-slate-600 mt-0.5">{itemsSummary}</div>
                        <div className="font-bold font-mono text-indigo-600 mt-1">{o.grandTotal.toFixed(2)} QR</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{o.driver}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{o.driverAt}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-amber-50 text-amber-800 border border-amber-200">
                          {o.driverStatus}
                        </span>
                        {o.driverReason && (
                          <div className="text-[11px] text-red-600 mt-1 font-medium">
                            কারণ: {o.driverReason}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-slate-100 text-slate-700">
                          {o.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenInvoice(o)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            title="Invoice Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onApproveOrder(o.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>

                          <button
                            onClick={() => handleRejectPrompt(o.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
