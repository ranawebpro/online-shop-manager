import React, { useState, useMemo } from 'react';
import { Order, UserSession, OrderStatus } from '../types';
import { Phone, MessageCircle, MapPin, FileText, CheckCircle2, Clock, Wallet, DollarSign, Calendar } from 'lucide-react';

interface DriverPortalProps {
  session: UserSession;
  orders: Order[];
  onSubmitStatus: (orderId: string, status: OrderStatus, reason: string) => void;
  onOpenInvoice: (order: Order) => void;
}

export const DriverPortal: React.FC<DriverPortalProps> = ({
  session,
  orders,
  onSubmitStatus,
  onOpenInvoice
}) => {
  const [showAllOrders, setShowAllOrders] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  // Status modal state
  const [activeModalOrder, setActiveModalOrder] = useState<Order | null>(null);
  const [modalStatus, setModalStatus] = useState<OrderStatus>('Delivered');
  const [modalReason, setModalReason] = useState<string>('Customer not available');

  // WhatsApp modal
  const [whatsAppModalOrder, setWhatsAppModalOrder] = useState<Order | null>(null);

  // Driver orders
  const driverOrders = useMemo(() => {
    return orders.filter(o => o.driver === session.name);
  }, [orders, session.name]);

  // Today's summary (only Admin-approved delivered orders)
  const todaySummary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    let deliveredCount = 0;
    let earnings = 0;
    let cash = 0;

    driverOrders.forEach(o => {
      if (o.status === 'Delivered') {
        const dKey = o.dateKey;
        if (dKey === today) {
          deliveredCount++;
          earnings += o.delCharge || 0; // driver gets the delivery fee
          cash += o.grandTotal || 0;
        }
      }
    });

    return { deliveredCount, earnings, cash };
  }, [driverOrders]);

  // Orders to display
  const displayOrders = useMemo(() => {
    if (showAllOrders) return driverOrders;
    // Show pending or orders from last 3 days
    const cutoff = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
    return driverOrders.filter(o => o.status === 'Pending' || (o.dateKey && o.dateKey >= cutoff));
  }, [driverOrders, showAllOrders]);

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalOrder) return;
    const reasonToSubmit = (modalStatus === 'Pending' || modalStatus === 'Return') ? modalReason : '';
    onSubmitStatus(activeModalOrder.id, modalStatus, reasonToSubmit);
    setActiveModalOrder(null);
  };

  const getWaHref = (o: Order) => {
    const num = (o.whatsapp || o.phone || '').replace(/\D/g, '');
    const cleanNum = num.length === 8 ? `974${num}` : num;
    const msg = `Hello ${o.name} Sir / Mam. I have a parcel from ${o.pageCode} for you and Total Amount is ${o.grandTotal.toFixed(2)} QR. Should I come now to deliver your order?`;
    return {
      href: `https://wa.me/${cleanNum}?text=${encodeURIComponent(msg)}`,
      msg
    };
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Driver Welcome Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-indigo-400 font-semibold">
              Driver Dashboard &middot; ডেলিভারি ড্যাশবোর্ড
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mt-0.5">{session.name}</h1>
            <div className="text-xs text-slate-400 mt-1">
              Assigned Zone: <span className="text-slate-200 font-medium">{session.zone || 'All Qatar Zones'}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Active Duty
            </span>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mt-5 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/60 text-center">
            <div className="text-[11px] text-slate-400">আজ Delivered</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-0.5">
              {todaySummary.deliveredCount}
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/60 text-center">
            <div className="text-[11px] text-slate-400">আজকের কমিশন</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-400 mt-0.5">
              {todaySummary.earnings.toFixed(2)} <span className="text-xs font-normal">QR</span>
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/60 text-center">
            <div className="text-[11px] text-slate-400">আজ কালেক্ট (COD)</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-0.5">
              {todaySummary.cash.toFixed(2)} <span className="text-xs font-normal">QR</span>
            </div>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 text-center mt-3">
          * হিসাবে শুধু Admin-approved অর্ডার ধরা হয়।
        </div>
      </div>

      {/* Assigned Orders List Header */}
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-base font-bold text-slate-800">
          আমার অর্ডারের তালিকা ({displayOrders.length})
        </h2>

        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showAllOrders}
            onChange={e => setShowAllOrders(e.target.checked)}
            className="rounded text-indigo-600 w-4 h-4"
          />
          <span>সব অর্ডার দেখুন</span>
        </label>
      </div>

      {/* Orders Cards */}
      <div className="space-y-4">
        {displayOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200/80 shadow-sm text-slate-400">
            কোনো অর্ডার পাওয়া যায়নি
          </div>
        ) : (
          displayOrders.map(o => {
            const isFinal = o.status !== 'Pending';
            const itemsSummary = o.items.map(it => `${it.name || it.sku} (${it.variation || ''}) × ${it.qty}`).join(', ');
            const waInfo = getWaHref(o);

            return (
              <div
                key={o.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-3.5 hover:border-slate-300 transition-colors"
              >
                {/* Card Top */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
                    #{o.id}
                  </span>

                  <div className="flex items-center gap-2">
                    {o.freeDelivery && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60">
                        Free Delivery
                      </span>
                    )}
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      o.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      o.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      o.status === 'Return' ? 'bg-red-50 text-red-700 border border-red-200' :
                      'bg-sky-50 text-sky-700 border border-sky-200'
                    }`}>
                      {o.status}
                    </span>
                  </div>
                </div>

                {/* Customer Details */}
                <div>
                  <h3 className="font-bold text-base text-slate-900">{o.name}</h3>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    {o.phone} {o.whatsapp && o.whatsapp !== o.phone && `(WA: ${o.whatsapp})`}
                  </div>
                  <div className="text-xs text-slate-600 mt-1 flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>{o.zone}</span>
                  </div>
                </div>

                {/* Amount to Collect Callout */}
                <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-medium text-slate-500">টাকা নিবেন (Collect Cash):</div>
                    <div className="text-lg font-bold font-mono text-indigo-700">
                      {o.grandTotal.toFixed(2)} QR
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-500">
                    {o.freeDelivery ? 'ডেলিভারি চার্জ ফ্রি' : `ডেলিভারি: ${o.delCharge} QR`}
                  </div>
                </div>

                {/* Address info */}
                {(o.buildingNo || o.zoneNo || o.streetNo || o.addressExtra) && (
                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 space-y-0.5">
                    <div className="font-semibold text-slate-700">ঠিকানা:</div>
                    {(o.buildingNo || o.zoneNo || o.streetNo) && (
                      <div>Building {o.buildingNo}, Zone {o.zoneNo}, Street {o.streetNo} {o.zoneName && `(${o.zoneName})`}</div>
                    )}
                    {o.addressExtra && (
                      <div className="text-indigo-600 font-medium">অতিরিক্ত: {o.addressExtra}</div>
                    )}
                  </div>
                )}

                {/* Items & Notes */}
                {itemsSummary && (
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Items:</span> {itemsSummary}
                  </div>
                )}
                {o.note && (
                  <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200/60 text-xs text-amber-800 font-medium">
                    📝 Note: {o.note}
                  </div>
                )}

                {/* Awaiting Admin Approval Banner */}
                {o.approval && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium flex items-center gap-1.5">
                    <Clock className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>⏳ আপনি "{o.driverStatus}" জমা দিয়েছেন — Admin approval এর অপেক্ষায়</span>
                  </div>
                )}

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {/* Call */}
                  <a
                    href={`tel:${o.phone}`}
                    className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-indigo-600" />
                    <span>কল করুন</span>
                  </a>

                  {/* WhatsApp */}
                  <button
                    onClick={() => setWhatsAppModalOrder(o)}
                    className="py-2 px-3 rounded-xl border border-emerald-200 hover:bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </button>

                  {/* Maps */}
                  {o.mapLink ? (
                    <a
                      href={o.mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      <span>Google Map</span>
                    </a>
                  ) : (
                    <button
                      disabled
                      className="py-2 px-3 rounded-xl border border-slate-200 opacity-40 text-slate-400 text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Map নেই</span>
                    </button>
                  )}

                  {/* Invoice */}
                  <button
                    onClick={() => onOpenInvoice(o)}
                    className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                    <span>Invoice PDF</span>
                  </button>
                </div>

                {/* Status submission button */}
                <div className="pt-1">
                  {isFinal ? (
                    <div className="py-2 px-3 rounded-xl bg-slate-100 text-slate-500 text-xs font-semibold text-center border border-slate-200">
                      ✓ Final Status Approved ({o.status})
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveModalOrder(o);
                        setModalStatus((o.driverStatus as OrderStatus) || 'Delivered');
                        setModalReason(o.driverReason || 'Customer not available');
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-sm"
                    >
                      {o.approval ? 'Status পরিবর্তন করে আবার জমা দিন' : 'Status জমা দিন (Admin Approval)'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Driver Status Submit Modal */}
      {activeModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800">
              অর্ডার স্ট্যাটাস জমা দিন: {activeModalOrder.id}
            </h3>
            <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              আপনার জমা দেওয়া স্ট্যাটাস Admin যাচাই করে approve করার পর ফাইনাল হবে।
            </p>

            <form onSubmit={handleStatusSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                <select
                  value={modalStatus}
                  onChange={e => setModalStatus(e.target.value as OrderStatus)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none font-medium bg-white"
                >
                  <option value="Delivered">Delivered (সফল হয়েছে)</option>
                  <option value="Pending">Pending for Tomorrow (দেরি হবে / কাল দেবে)</option>
                  <option value="Return">Return (কাস্টমার নেয়নি / ফেরত)</option>
                  <option value="Exchange">Exchange (বদল হবে)</option>
                </select>
              </div>

              {(modalStatus === 'Pending' || modalStatus === 'Return') && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">কারণ (Reason)</label>
                  <select
                    value={modalReason}
                    onChange={e => setModalReason(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none font-medium bg-white"
                  >
                    <option value="Customer didn't answer">Customer didn't answer (ফোন ধরেনি)</option>
                    <option value="Customer not available">Customer not available (উপস্থিত নেই)</option>
                    <option value="Wrong Address / Location">Wrong Address / Location (ভুল ঠিকানা)</option>
                    <option value="Customer Cancelled">Customer Cancelled (বাতিল করেছে)</option>
                    <option value="Price/Item Issue">Price/Item Issue (দাম বা পণ্যে আপত্তি)</option>
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModalOrder(null)}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Admin এর কাছে পাঠান
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Preview Modal */}
      {whatsAppModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-600" /> WhatsApp Message Preview
            </h3>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono whitespace-pre-wrap text-slate-700">
              {getWaHref(whatsAppModalOrder).msg}
            </div>

            <p className="text-[11px] text-slate-400">
              * ইনভয়েস লিংক মেসেজের সাথে পাঠানো হবে না। কাস্টমার চাইলে আলাদাভাবে Invoice PDF শেয়ার করতে পারবেন।
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWhatsAppModalOrder(null)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Close
              </button>
              <a
                href={getWaHref(whatsAppModalOrder).href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setWhatsAppModalOrder(null)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-center"
              >
                Open WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
