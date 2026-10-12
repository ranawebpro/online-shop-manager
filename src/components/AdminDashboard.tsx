import React, { useState, useMemo } from 'react';
import { Order, ExpenseEntry } from '../types';
import { TrendingUp, ShoppingBag, CheckCircle, Clock, RotateCcw, DollarSign, Truck, Calendar } from 'lucide-react';

interface AdminDashboardProps {
  orders: Order[];
  expenses: ExpenseEntry[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ orders, expenses }) => {
  const [dateFilter, setDateFilter] = useState<'today' | 'month' | 'year' | 'custom'>('month');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [groupBy, setGroupBy] = useState<'day' | 'month' | 'year'>('day');

  const handleQuickFilter = (type: 'today' | 'month' | 'year') => {
    const today = new Date().toISOString().slice(0, 10);
    setDateFilter(type);
    if (type === 'today') {
      setStartDate(today);
      setEndDate(today);
      setGroupBy('day');
    } else if (type === 'month') {
      const d = new Date();
      setStartDate(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10));
      setEndDate(today);
      setGroupBy('day');
    } else if (type === 'year') {
      const d = new Date();
      setStartDate(new Date(d.getFullYear(), 0, 1).toISOString().slice(0, 10));
      setEndDate(today);
      setGroupBy('month');
    }
  };

  // Filtered orders & expenses
  const filteredData = useMemo(() => {
    const filteredOrders = orders.filter(o => {
      const k = o.dateKey;
      if (!k) return false;
      return k >= startDate && k <= endDate;
    });

    const filteredExpenses = expenses.filter(e => {
      return e.date >= startDate && e.date <= endDate;
    });

    // Summary calculations
    let totalOrders = 0;
    let deliveredCount = 0;
    let pendingCount = 0;
    let returnCount = 0;
    let exchangeCount = 0;
    let awaitingApprovalCount = 0;

    let productSales = 0;
    let discountGiven = 0;
    let productCost = 0;
    let freeDeliveryCost = 0;
    let freeOrdersCount = 0;
    let deliveryCollected = 0;
    let totalCashCollected = 0;

    filteredOrders.forEach(o => {
      totalOrders++;
      if (o.approval) awaitingApprovalCount++;

      if (o.status === 'Delivered') {
        deliveredCount++;
        const disc = o.discountAmount || 0;
        const ps = (o.subTotal || 0) - disc;
        productSales += ps;
        discountGiven += disc;
        totalCashCollected += o.grandTotal || 0;

        if (o.freeDelivery) {
          freeOrdersCount++;
          freeDeliveryCost += o.deliveryCost || 0;
        } else {
          deliveryCollected += o.delCharge || 0;
        }

        // Product buying costs
        o.items.forEach(it => {
          const buy = it.buyPrice || 0;
          const extra = it.extraCost || 0;
          productCost += (buy + extra) * it.qty;
        });
      } else if (o.status === 'Pending') {
        pendingCount++;
      } else if (o.status === 'Return') {
        returnCount++;
      } else if (o.status === 'Exchange') {
        exchangeCount++;
      }
    });

    const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const grossProfit = productSales - productCost - freeDeliveryCost;
    const netProfit = grossProfit - totalExpenseAmount;

    // Grouping rows
    const groups: Record<string, {
      key: string;
      orders: number;
      delivered: number;
      productSales: number;
      cost: number;
      freeCost: number;
      expense: number;
      netProfit: number;
    }> = {};

    const getGroupKey = (dStr: string) => {
      if (groupBy === 'month') return dStr.slice(0, 7);
      if (groupBy === 'year') return dStr.slice(0, 4);
      return dStr;
    };

    filteredOrders.forEach(o => {
      const gk = getGroupKey(o.dateKey);
      if (!groups[gk]) {
        groups[gk] = { key: gk, orders: 0, delivered: 0, productSales: 0, cost: 0, freeCost: 0, expense: 0, netProfit: 0 };
      }
      groups[gk].orders++;
      if (o.status === 'Delivered') {
        groups[gk].delivered++;
        const ps = (o.subTotal || 0) - (o.discountAmount || 0);
        groups[gk].productSales += ps;
        if (o.freeDelivery) groups[gk].freeCost += o.deliveryCost || 0;
        o.items.forEach(it => {
          groups[gk].cost += ((it.buyPrice || 0) + (it.extraCost || 0)) * it.qty;
        });
      }
    });

    filteredExpenses.forEach(e => {
      const gk = getGroupKey(e.date);
      if (!groups[gk]) {
        groups[gk] = { key: gk, orders: 0, delivered: 0, productSales: 0, cost: 0, freeCost: 0, expense: 0, netProfit: 0 };
      }
      groups[gk].expense += e.amount;
    });

    const rows = Object.values(groups).map(g => {
      g.netProfit = g.productSales - g.cost - g.freeCost - g.expense;
      return g;
    }).sort((a, b) => b.key.localeCompare(a.key));

    return {
      totals: {
        totalOrders,
        deliveredCount,
        pendingCount,
        returnCount,
        exchangeCount,
        awaitingApprovalCount,
        productSales,
        discountGiven,
        productCost,
        freeDeliveryCost,
        freeOrdersCount,
        deliveryCollected,
        totalCashCollected,
        totalExpenseAmount,
        grossProfit,
        netProfit
      },
      rows
    };
  }, [orders, expenses, startDate, endDate, groupBy]);

  const { totals, rows } = filteredData;

  return (
    <div className="space-y-6">
      {/* Date & Period Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-800">Business Report &amp; Analytics</h2>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => handleQuickFilter('today')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                dateFilter === 'today' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              আজ
            </button>
            <button
              onClick={() => handleQuickFilter('month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                dateFilter === 'month' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              এই মাস
            </button>
            <button
              onClick={() => handleQuickFilter('year')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                dateFilter === 'year' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              এই বছর
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setDateFilter('custom'); }}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => { setEndDate(e.target.value); setDateFilter('custom'); }}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Group By</label>
            <select
              value={groupBy}
              onChange={e => setGroupBy(e.target.value as any)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white"
            >
              <option value="day">Daily</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </div>
          <div className="flex items-end">
            <div className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-600 font-medium text-center">
              Active: {startDate} &rarr; {endDate}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {/* Net Profit */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="text-xs font-medium text-slate-500">Net Profit (সব খরচ বাদে)</div>
          <div className={`text-xl sm:text-2xl font-bold mt-1 font-mono tabular-nums ${totals.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {totals.netProfit.toFixed(2)} <span className="text-xs font-semibold">QR</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Gross: {totals.grossProfit.toFixed(2)} QR
          </div>
        </div>

        {/* Product Sales */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Product Sales (Delivered)</div>
          <div className="text-xl sm:text-2xl font-bold mt-1 font-mono tabular-nums text-slate-900">
            {totals.productSales.toFixed(2)} <span className="text-xs font-semibold text-slate-500">QR</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Discount: -{totals.discountGiven.toFixed(2)} QR
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Shop Expenses (খরচ)</div>
          <div className="text-xl sm:text-2xl font-bold mt-1 font-mono tabular-nums text-red-600">
            {totals.totalExpenseAmount.toFixed(2)} <span className="text-xs font-semibold">QR</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Buying Cost: {totals.productCost.toFixed(2)} QR
          </div>
        </div>

        {/* Cash Collected COD */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Total COD Collected</div>
          <div className="text-xl sm:text-2xl font-bold mt-1 font-mono tabular-nums text-indigo-600">
            {totals.totalCashCollected.toFixed(2)} <span className="text-xs font-semibold">QR</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Deliv Fee: {totals.deliveryCollected.toFixed(2)} QR
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Total Orders</div>
          <div className="text-xl sm:text-2xl font-bold mt-1 font-mono tabular-nums text-slate-800">
            {totals.totalOrders}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            In Range
          </div>
        </div>

        {/* Delivered Approved */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Delivered (Approved)</div>
          <div className="text-xl sm:text-2xl font-bold mt-1 font-mono tabular-nums text-emerald-600">
            {totals.deliveredCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totals.totalOrders ? `${Math.round((totals.deliveredCount / totals.totalOrders) * 100)}% Success` : '0%'}
          </div>
        </div>

        {/* Awaiting Approvals */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500">⏳ Awaiting Approval</div>
          <div className="text-xl sm:text-2xl font-bold mt-1 font-mono tabular-nums text-amber-600">
            {totals.awaitingApprovalCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Pending Admin Action
          </div>
        </div>

        {/* Free Delivery Orders & Cost */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Free Delivery Cost</div>
          <div className="text-xl sm:text-2xl font-bold mt-1 font-mono tabular-nums text-amber-700">
            {totals.freeDeliveryCost.toFixed(2)} <span className="text-xs font-semibold">QR</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totals.freeOrdersCount} Orders (Shop Paid)
          </div>
        </div>
      </div>

      {/* Ledger Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">লাভ-ক্ষতির হিসাব (Periodic Profit &amp; Loss Breakdown)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Net Profit = Product Sales (after discount) &minus; Product Cost &minus; Free Delivery Cost &minus; Expenses
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">{groupBy === 'year' ? 'Year' : groupBy === 'month' ? 'Month' : 'Date'}</th>
                <th className="py-3 px-3 text-right">Orders</th>
                <th className="py-3 px-3 text-right">Delivered</th>
                <th className="py-3 px-3 text-right">Product Sales</th>
                <th className="py-3 px-3 text-right">Product Cost</th>
                <th className="py-3 px-3 text-right">Free Delivery</th>
                <th className="py-3 px-3 text-right">Expenses</th>
                <th className="py-3 px-4 text-right">Net Profit / Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    এই সময়ের মধ্যে কোনো রেকর্ড পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                rows.map(row => (
                  <tr key={row.key} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800 font-mono">{row.key}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">{row.orders}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-600 font-semibold">{row.delivered}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800">{row.productSales.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">{row.cost.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-amber-700">{row.freeCost.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-red-600">{row.expense.toFixed(2)}</td>
                    <td className={`py-3 px-4 text-right font-mono tabular-nums font-bold ${
                      row.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {row.netProfit.toFixed(2)} QR
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                <tr>
                  <td className="py-3 px-4 text-slate-800">Total</td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums">{totals.totalOrders}</td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-600">{totals.deliveredCount}</td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums">{totals.productSales.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums">{totals.productCost.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums">{totals.freeDeliveryCost.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-red-600">{totals.totalExpenseAmount.toFixed(2)}</td>
                  <td className={`py-3 px-4 text-right font-mono tabular-nums ${
                    totals.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {totals.netProfit.toFixed(2)} QR
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
