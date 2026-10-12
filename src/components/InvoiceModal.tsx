import React from 'react';
import { Order, BusinessPage, ShopInfo } from '../types';
import { Printer, X } from 'lucide-react';

interface InvoiceModalProps {
  orders: Order[];
  pages: BusinessPage[];
  shopInfo: ShopInfo;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  orders,
  pages,
  shopInfo,
  onClose
}) => {
  if (orders.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="font-bold text-sm flex items-center gap-2">
            <Printer className="w-4 h-4 text-indigo-400" />
            <span>Invoice Preview ({orders.length} Invoice{orders.length > 1 ? 's' : ''})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print Invoice
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoices Body */}
        <div className="p-6 overflow-y-auto space-y-8 bg-slate-50 print:bg-white print:p-0 print:space-y-0">
          {orders.map((o, idx) => {
            const page = pages.find(p => p.code === o.pageCode);
            const headerName = page ? page.name : shopInfo.name;
            const headerMobile = page?.mobile || shopInfo.phone;
            const headerAddress = page?.address || shopInfo.address;

            const addressTokens = [];
            if (o.buildingNo || o.zoneNo || o.streetNo) {
              addressTokens.push(`Building ${o.buildingNo || '-'}, Zone ${o.zoneNo || '-'}, Street ${o.streetNo || '-'}`);
            }
            if (o.zoneName) addressTokens.push(o.zoneName);
            if (o.zone) addressTokens.push(o.zone);

            return (
              <div
                key={o.id}
                className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-8 print:m-0 print:break-after-page text-slate-800 text-xs font-sans"
              >
                {/* Header Top */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4 gap-4">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">{headerName}</h1>
                    {headerMobile && <div className="text-slate-600 font-mono mt-0.5">Mobile: {headerMobile}</div>}
                    {headerAddress && <div className="text-slate-500 mt-0.5">{headerAddress}</div>}
                    {page && (
                      <div className="text-[11px] text-slate-500 space-x-2 mt-1">
                        {page.facebook && <span>FB: {page.facebook}</span>}
                        {page.instagram && <span>IG: {page.instagram}</span>}
                        {page.tiktok && <span>TikTok: {page.tiktok}</span>}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-extrabold text-slate-900 tracking-wider">INVOICE</div>
                    <div className="text-sm font-bold font-mono text-indigo-700 mt-0.5">#{o.id}</div>
                    <div className="text-slate-500 font-mono mt-0.5">{o.date}</div>
                    <div className="mt-1">
                      Status: <span className="font-bold uppercase text-slate-800">{o.status}</span>
                    </div>
                  </div>
                </div>

                {/* Bill To & Delivery */}
                <div className="grid grid-cols-2 gap-4 pb-4 mb-4 border-b border-slate-100 text-xs">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Bill To</div>
                    <div className="font-bold text-slate-900 text-sm">{o.name}</div>
                    <div className="font-mono text-slate-700 mt-0.5">{o.phone}</div>
                    {o.whatsapp && o.whatsapp !== o.phone && (
                      <div className="font-mono text-emerald-700">WA: {o.whatsapp}</div>
                    )}
                    <div className="text-slate-600 mt-1">{addressTokens.join(', ')}</div>
                    {o.addressExtra && (
                      <div className="text-indigo-700 mt-0.5 font-medium">Extra: {o.addressExtra}</div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Delivery Info</div>
                    <div>Delivery Man: <span className="font-semibold text-slate-900">{o.driver || '—'}</span></div>
                    <div className="mt-0.5">Zone: <span className="font-medium text-slate-800">{o.zone}</span></div>
                    <div className="mt-0.5">Payment Method: <span className="font-bold text-slate-900">{o.payment || 'COD (Cash on Delivery)'}</span></div>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-left text-xs mb-4">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="py-2 px-3 w-8">#</th>
                      <th className="py-2 px-3">Item Description</th>
                      <th className="py-2 px-3 text-right">Qty</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {o.items.map((it, i) => (
                      <tr key={i}>
                        <td className="py-2.5 px-3 text-slate-400 font-mono">{i + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">
                            {it.name || it.sku} {it.variation && <span className="font-normal text-slate-500">({it.variation})</span>}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{it.sku}</div>
                          {it.note && <div className="text-[10px] text-slate-500">Note: {it.note}</div>}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium">{it.qty}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">{it.lineTotal.toFixed(2)} QR</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Order Note */}
                {o.note && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 mb-4">
                    <b>Special Note:</b> {o.note}
                  </div>
                )}

                {/* Financial Summary */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-mono">{o.subTotal.toFixed(2)} QR</span>
                    </div>

                    {o.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Discount {o.couponCode && `(${o.couponCode})`}:</span>
                        <span className="font-mono">&minus; {o.discountAmount.toFixed(2)} QR</span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-600">
                      <span>Delivery Fee:</span>
                      <span className="font-mono">
                        {o.freeDelivery ? <b className="text-teal-600">FREE</b> : `${o.delCharge.toFixed(2)} QR`}
                      </span>
                    </div>

                    <div className="border-t-2 border-slate-900 pt-2 flex justify-between font-bold text-sm text-slate-900">
                      <span>Grand Total:</span>
                      <span className="font-mono text-indigo-700">{o.grandTotal.toFixed(2)} QR</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center text-slate-400 text-[11px] pt-8 mt-8 border-t border-slate-100">
                  {shopInfo.footer || 'Thanks For Shopping With Us!'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
