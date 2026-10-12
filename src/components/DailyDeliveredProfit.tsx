import React, { useState, useMemo } from 'react';
import { Order } from '../types';
import { Calculator, CheckSquare, Square, RefreshCw } from 'lucide-react';

interface DailyDeliveredProfitProps {
  orders: Order[];
}

export const DailyDeliveredProfit: React.FC<DailyDeliveredProfitProps> = ({ orders }) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  // Filter delivered orders on the chosen delivery date
  const deliveredOrders = useMemo(() => {
    return orders.filter(o => {
      if (o.status !== 'Delivered') return false;
      // Prefer deliveredAt date or fallback to dateKey
      const dateStr = o.deliveredAt ? o.deliveredAt.slice(0, 10) : o.dateKey;
      // Check if matches or if dateKey matches
      return o.dateKey === selectedDate || dateStr === selectedDate;
    });
  }, [orders, selectedDate]);

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(new Set(deliveredOrders.map(o => o.id)));
    } else {
      setSelectedOrderIds(new Set());
    }
  };

  const toggleOrder = (id: string) => {
    const next = new Set(selectedOrderIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedOrderIds(next);
  };

  // Order calculation details
  const calculatedRows = useMemo(() => {
    return deliveredOrders.map(o => {
      const productSales = (o.subTotal || 0) - (o.discountAmount || 0);
      let productCost = 0;
      let totalQty = 0;

      o.items.forEach(it => {
        const buy = it.buyPrice || 0;
        const extra = it.extraCost || 0;
        productCost += (buy + extra) * it.qty;
        totalQty += it.qty;
      });

      const freeDeliveryCost = o.freeDelivery ? (o.deliveryCost || 0) : 0;
      const grossProfit = productSales - productCost;
      const netProfit = grossProfit - freeDeliveryCost;

      return {
        order: o,
        totalQty,
        productSales,
        productCost,
        freeDeliveryCost,
        grossProfit,
        netProfit
      };
    });
  }, [deliveredOrders]);

  // Overall totals
  const overallTotals = useMemo(() => {
    let sales = 0;
    let cost = 0;
    let freeCost = 0;
    let gross = 0;
    let net = 0;

    calculatedRows.forEach(r => {
      sales += r.productSales;
      cost += r.productCost;
      freeCost += r.freeDeliveryCost;
      gross += r.grossProfit;
      net += r.netProfit;
    });

    return { count: calculatedRows.length, sales, cost, freeCost, gross, net };
  }, [calculatedRows]);

  // Selected totals
  const selectedTotals = useMemo(() => {
    let count = 0;
    let sales = 0;
    let cost = 0;
    let freeCost = 0;
    let gross = 0;
    let net = 0;

    calculatedRows.forEach(r => {
      if (selectedOrderIds.has(r.order.id)) {
        count++;
        sales += r.productSales;
        cost += r.productCost;
        freeCost += r.freeDeliveryCost;
        gross += r.grossProfit;
        net += r.netProfit;
      }
    });

    return { count, sales, cost, freeCost, gross, net };
  }, [calculatedRows, selectedOrderIds]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-800">Daily Delivered Order Profit</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              শুধু Admin-final Delivered order দেখায়। Profit = Product Sales &minus; Buying Cost &minus; Free Delivery Cost.
            </p>
          </div>

          <button
            onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
          >
            আজকে সেট করুন
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Delivery Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => toggleSelectAll(true)}
              className="flex-1 text-xs py-2 px-3 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl text-slate-700 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={() => toggleSelectAll(false)}
              className="flex-1 text-xs py-2 px-3 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl text-slate-700 transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="sm:col-span-2 text-right">
            <div className="text-xs text-slate-500">Delivered Orders on this date:</div>
            <div className="text-lg font-bold font-mono text-emerald-600">{deliveredOrders.length} Orders</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs text-slate-500">Delivered Orders</div>
          <div className="text-lg font-bold mt-1 font-mono text-slate-900">{overallTotals.count}</div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs text-slate-500">Product Sales</div>
          <div className="text-lg font-bold mt-1 font-mono text-slate-900">{overallTotals.sales.toFixed(2)} QR</div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs text-slate-500">Buying Cost</div>
          <div className="text-lg font-bold mt-1 font-mono text-slate-600">{overallTotals.cost.toFixed(2)} QR</div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs text-slate-500">Free Delivery Cost</div>
          <div className="text-lg font-bold mt-1 font-mono text-amber-700">{overallTotals.freeCost.toFixed(2)} QR</div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs text-slate-500">Gross Profit</div>
          <div className="text-lg font-bold mt-1 font-mono text-indigo-600">{overallTotals.gross.toFixed(2)} QR</div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs text-slate-500">Day Net Profit</div>
          <div className={`text-lg font-bold mt-1 font-mono ${overallTotals.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {overallTotals.net.toFixed(2)} QR
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800">
            Delivered Order Records ({calculatedRows.length})
          </div>
          <div className="text-xs font-semibold text-indigo-600">
            {selectedOrderIds.size} Selected
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={calculatedRows.length > 0 && selectedOrderIds.size === calculatedRows.length}
                    onChange={e => toggleSelectAll(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
                <th className="py-3 px-3">Order ID / Date</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Driver / Zone</th>
                <th className="py-3 px-3 text-right">Qty</th>
                <th className="py-3 px-3 text-right">Product Sales</th>
                <th className="py-3 px-3 text-right">Buying Cost</th>
                <th className="py-3 px-3 text-right">Free Delivery</th>
                <th className="py-3 px-3 text-right">Gross Profit</th>
                <th className="py-3 px-4 text-right">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calculatedRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    এই তারিখে কোনো Delivered order নেই
                  </td>
                </tr>
              ) : (
                calculatedRows.map(r => {
                  const isChecked = selectedOrderIds.has(r.order.id);
                  return (
                    <tr key={r.order.id} className={`hover:bg-slate-50/60 transition-colors ${isChecked ? 'bg-emerald-50/40' : ''}`}>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOrder(r.order.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold font-mono text-slate-800">{r.order.id}</div>
                        <div className="text-[11px] text-slate-400">{r.order.deliveredAt || r.order.date}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{r.order.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{r.order.phone}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-800">{r.order.driver}</div>
                        <div className="text-[11px] text-slate-500">{r.order.zone}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">{r.totalQty}</td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-900">{r.productSales.toFixed(2)} QR</td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">{r.productCost.toFixed(2)} QR</td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-amber-700">
                        {r.order.freeDelivery ? `-${r.freeDeliveryCost.toFixed(2)} QR` : '0.00 QR'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-indigo-600 font-medium">
                        {r.grossProfit.toFixed(2)} QR
                      </td>
                      <td className={`py-3 px-4 text-right font-mono tabular-nums font-bold ${
                        r.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {r.netProfit.toFixed(2)} QR
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sticky Bottom Bar for Selected Profit */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md text-white border-t border-slate-800 py-3 px-4 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-sm">
              &radic;
            </div>
            <div>
              <div className="text-xs text-slate-300">Selected Orders Calculation</div>
              <div className="text-sm font-semibold text-white">
                {selectedTotals.count} of {calculatedRows.length} Orders Selected
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-slate-400">Selected Sales:</span>{' '}
              <span className="font-mono font-bold text-white">{selectedTotals.sales.toFixed(2)} QR</span>
            </div>
            <div>
              <span className="text-slate-400">Selected Cost:</span>{' '}
              <span className="font-mono font-bold text-slate-300">{selectedTotals.cost.toFixed(2)} QR</span>
            </div>
            <div className="border-l border-slate-700 pl-4">
              <span className="text-slate-400">Selected Profit:</span>{' '}
              <span className={`text-base font-bold font-mono ${selectedTotals.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {selectedTotals.net.toFixed(2)} QR
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
