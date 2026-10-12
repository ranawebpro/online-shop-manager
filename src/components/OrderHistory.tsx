import React, { useState, useMemo } from 'react';
import { Order, Employee, OrderStatus, UserSession } from '../types';
import { Search, Printer, UserCheck, Eye, Edit, Trash2, ArrowUpDown, Filter, Check } from 'lucide-react';

interface OrderHistoryProps {
  orders: Order[];
  drivers: Employee[];
  session: UserSession;
  onOpenInvoice: (order: Order) => void;
  onPrintMultiple: (orders: Order[]) => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string, restock: boolean) => void;
  onChangeStatus: (orderId: string, status: OrderStatus, reason?: string) => void;
  onAssignDriver: (orderIds: string[], driverName: string) => void;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({
  orders,
  drivers,
  session,
  onOpenInvoice,
  onPrintMultiple,
  onEditOrder,
  onDeleteOrder,
  onChangeStatus,
  onAssignDriver
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [assignDriverModalOpen, setAssignDriverModalOpen] = useState<boolean>(false);
  const [targetDriver, setTargetDriver] = useState<string>('');

  const [statusModalOrder, setStatusModalOrder] = useState<Order | null>(null);
  const [newStatusValue, setNewStatusValue] = useState<OrderStatus>('Delivered');
  const [statusReason, setStatusReason] = useState<string>('');

  const [deleteModalOrder, setDeleteModalOrder] = useState<Order | null>(null);
  const [restockOnDelete, setRestockOnDelete] = useState<boolean>(true);

  const isAdmin = session.role === 'Admin';

  const handleQuickDate = (type: 'today' | 'month' | 'year') => {
    const today = new Date().toISOString().slice(0, 10);
    if (type === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (type === 'month') {
      const d = new Date();
      setStartDate(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10));
      setEndDate(today);
    } else if (type === 'year') {
      const d = new Date();
      setStartDate(new Date(d.getFullYear(), 0, 1).toISOString().slice(0, 10));
      setEndDate(today);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Date filter
      if (o.dateKey && (o.dateKey < startDate || o.dateKey > endDate)) return false;

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'AWAITING') {
          if (!o.approval) return false;
        } else if (o.status !== statusFilter) {
          return false;
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const hay = [
          o.id,
          o.name,
          o.phone,
          o.whatsapp,
          o.driver,
          o.zone,
          o.note,
          o.reason,
          o.pageCode,
          o.source
        ].join(' ').toLowerCase();
        if (!hay.includes(term)) return false;
      }

      return true;
    });
  }, [orders, startDate, endDate, statusFilter, searchTerm]);

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredOrders.map(o => o.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleOrderSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkPrint = () => {
    const selected = orders.filter(o => selectedIds.has(o.id));
    if (selected.length === 0) return;
    onPrintMultiple(selected);
  };

  const handleBulkAssign = () => {
    if (selectedIds.size === 0 || !targetDriver) return;
    onAssignDriver(Array.from(selectedIds), targetDriver);
    setAssignDriverModalOpen(false);
    setSelectedIds(new Set());
  };

  const statusBadge = (o: Order) => {
    const s = o.status;
    let color = 'bg-slate-100 text-slate-700';
    if (s === 'Delivered') color = 'bg-emerald-50 text-emerald-700 border border-emerald-200/60';
    else if (s === 'Pending') color = 'bg-amber-50 text-amber-700 border border-amber-200/60';
    else if (s === 'Return') color = 'bg-red-50 text-red-700 border border-red-200/60';
    else if (s === 'Exchange') color = 'bg-sky-50 text-sky-700 border border-sky-200/60';

    return (
      <div className="space-y-1">
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${color}`}>
          {s}
        </span>
        {o.approval && (
          <div className="text-[10px] font-semibold text-amber-600 bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-200/50">
            ⏳ {o.driverStatus} অপেক্ষায়
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls & Search */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
        {/* Quick Date Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-800">Order History &amp; Actions</h2>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => handleQuickDate('today')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
            >
              আজ
            </button>
            <button
              onClick={() => handleQuickDate('month')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
            >
              এই মাস
            </button>
            <button
              onClick={() => handleQuickDate('year')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
            >
              এই বছর
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Status Filter</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white outline-none font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Delivered">Delivered</option>
              <option value="Return">Return</option>
              <option value="Exchange">Exchange</option>
              <option value="AWAITING">⏳ Awaiting Approval</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Search Orders</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="ID, customer, phone, driver, zone, note..."
                className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="text-xs font-semibold text-slate-600">
            {filteredOrders.length} Orders Found {selectedIds.size > 0 && `(${selectedIds.size} Selected)`}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkPrint}
              disabled={selectedIds.size === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print ({selectedIds.size})
            </button>

            {isAdmin && (
              <button
                onClick={() => setAssignDriverModalOpen(true)}
                disabled={selectedIds.size === 0}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5" /> Assign Driver ({selectedIds.size})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredOrders.length > 0 && selectedIds.size === filteredOrders.length}
                    onChange={e => toggleSelectAll(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                </th>
                <th className="py-3 px-3">Order ID / Date</th>
                <th className="py-3 px-3">Customer Details</th>
                <th className="py-3 px-3">Delivery Zone</th>
                <th className="py-3 px-3 text-right">Grand Total</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Driver</th>
                <th className="py-3 px-3">Notes &amp; Items</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    কোনো অর্ডার পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredOrders.map(o => {
                  const isChecked = selectedIds.has(o.id);
                  const itemsSummary = o.items.map(it => `${it.sku}×${it.qty}`).join(', ');
                  return (
                    <tr key={o.id} className={`hover:bg-slate-50/60 transition-colors ${isChecked ? 'bg-indigo-50/40' : ''}`}>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOrderSelect(o.id)}
                          className="rounded text-indigo-600"
                        />
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold font-mono text-slate-900">{o.id}</div>
                        <div className="text-[11px] text-slate-400">{o.date}</div>
                        <div className="text-[10px] text-slate-400 uppercase mt-0.5">
                          {o.source} &middot; {o.pageCode}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{o.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{o.phone}</div>
                        {o.whatsapp && o.whatsapp !== o.phone && (
                          <div className="text-[10px] text-emerald-600 font-mono">WA: {o.whatsapp}</div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-slate-800 font-medium">{o.zone}</div>
                        <div className="text-[11px] text-slate-500">
                          {o.freeDelivery ? (
                            <span className="font-semibold text-teal-600">Free Delivery</span>
                          ) : (
                            `${o.delCharge} QR fee`
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="font-bold font-mono text-slate-900 text-sm">
                          {o.grandTotal.toFixed(2)} QR
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Sub: {o.subTotal.toFixed(2)} QR
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {statusBadge(o)}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">{o.driver || '—'}</div>
                      </td>

                      <td className="py-3 px-3 max-w-[200px]">
                        <div className="text-[11px] text-slate-600 truncate" title={itemsSummary}>
                          {itemsSummary}
                        </div>
                        {o.note && (
                          <div className="text-[11px] text-indigo-600 truncate mt-0.5" title={o.note}>
                            📝 {o.note}
                          </div>
                        )}
                        {o.reason && (
                          <div className="text-[10px] text-red-600 truncate mt-0.5" title={o.reason}>
                            ⚠️ {o.reason}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Invoice View */}
                          <button
                            onClick={() => onOpenInvoice(o)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="Invoice Preview & Print"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Admin Edit */}
                          {isAdmin && (
                            <button
                              onClick={() => onEditOrder(o)}
                              className="p-1.5 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors"
                              title="Edit Order"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Admin Change Status */}
                          {isAdmin && (
                            <button
                              onClick={() => {
                                setStatusModalOrder(o);
                                setNewStatusValue(o.status);
                                setStatusReason(o.reason || '');
                              }}
                              className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                              title="Change Status"
                            >
                              <ArrowUpDown className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Admin Delete */}
                          {isAdmin && (
                            <button
                              onClick={() => setDeleteModalOrder(o)}
                              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                              title="Delete Order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Assign Driver Modal */}
      {assignDriverModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800">
              Driver Assign করুন ({selectedIds.size} টি অর্ডার)
            </h3>
            <p className="text-xs text-slate-500">
              নির্বাচিত অর্ডারসমূহ নিচের ড্রাইভারকে এসাইন করা হবে:
            </p>

            <select
              value={targetDriver}
              onChange={e => setTargetDriver(e.target.value)}
              className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl outline-none font-medium bg-white"
            >
              <option value="">Select Driver...</option>
              {drivers.filter(d => d.role === 'Driver').map(d => (
                <option key={d.phone} value={d.name}>{d.name} {d.zone ? `(${d.zone})` : ''}</option>
              ))}
            </select>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setAssignDriverModalOpen(false)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAssign}
                disabled={!targetDriver}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white"
              >
                Confirm Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {statusModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800">
              অর্ডার স্ট্যাটাস পরিবর্তন: {statusModalOrder.id}
            </h3>
            <p className="text-xs text-slate-500">
              Admin এর পরিবর্তন সরাসরি final হবে। Delivered করলে stock কমবে।
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">New Status</label>
                <select
                  value={newStatusValue}
                  onChange={e => setNewStatusValue(e.target.value as OrderStatus)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none font-medium bg-white"
                >
                  <option value="Delivered">Delivered (সফল হয়েছে)</option>
                  <option value="Pending">Pending (দেরি হবে / অপেক্ষায়)</option>
                  <option value="Return">Return (কাস্টমার নেয়নি)</option>
                  <option value="Exchange">Exchange (বদল হবে)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Reason / Note</label>
                <input
                  type="text"
                  value={statusReason}
                  onChange={e => setStatusReason(e.target.value)}
                  placeholder="কারণ বা বিবরণ লিখুন (optional)"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStatusModalOrder(null)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onChangeStatus(statusModalOrder.id, newStatusValue, statusReason);
                  setStatusModalOrder(null);
                }}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-red-600">
              অর্ডার মুছে ফেলবেন? ({deleteModalOrder.id})
            </h3>
            <p className="text-xs text-slate-600">
              এটি চিরতরে মুছে যাবে।
            </p>

            {deleteModalOrder.status === 'Delivered' && (
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={restockOnDelete}
                  onChange={e => setRestockOnDelete(e.target.checked)}
                  className="rounded text-amber-600"
                />
                <span>Stock ফেরত দিন (Delivered অর্ডারের product আবার stock এ যোগ হবে)</span>
              </label>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteModalOrder(null)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteOrder(deleteModalOrder.id, restockOnDelete);
                  setDeleteModalOrder(null);
                }}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-500 text-white"
              >
                Yes, Delete Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
