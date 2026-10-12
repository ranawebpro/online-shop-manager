import React, { useState, useMemo } from 'react';
import { ExpenseEntry, UserSession } from '../types';
import { DollarSign, Plus, Trash2, Edit, Calendar, PieChart, Tag } from 'lucide-react';

interface ExpensesViewProps {
  expenses: ExpenseEntry[];
  categories: string[];
  session: UserSession;
  onSaveExpense: (expense: ExpenseEntry) => void;
  onDeleteExpense: (id: string) => void;
  onAddCategory: (category: string) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  categories,
  session,
  onSaveExpense,
  onDeleteExpense,
  onAddCategory
}) => {
  const [expenseDate, setExpenseDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [expenseCategory, setExpenseCategory] = useState<string>(categories[0] || 'Other');
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseNote, setExpenseNote] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filter
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (e.date < startDate || e.date > endDate) return false;
      if (filterCategory !== 'all' && e.category !== filterCategory) return false;
      return true;
    });
  }, [expenses, startDate, endDate, filterCategory]);

  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  // Breakdown by category
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).map(([cat, total]) => ({
      category: cat,
      total,
      percentage: totalFilteredAmount ? ((total / totalFilteredAmount) * 100).toFixed(1) : '0'
    })).sort((a, b) => b.total - a.total);
  }, [filteredExpenses, totalFilteredAmount]);

  const handleAddCategoryPrompt = () => {
    const name = window.prompt('নতুন Expense Category এর নাম লিখুন:');
    if (name && name.trim()) {
      onAddCategory(name.trim());
      setExpenseCategory(name.trim());
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount);
    if (!amt || amt <= 0) {
      alert('সঠিক Amount দিন (0 এর বেশি)');
      return;
    }

    const payload: ExpenseEntry = {
      id: editingId || `EX${Date.now().toString(36).toUpperCase()}`,
      date: expenseDate,
      category: expenseCategory,
      amount: amt,
      note: expenseNote.trim(),
      createdBy: session.name,
      createdAt: new Date().toLocaleString()
    };

    onSaveExpense(payload);
    setExpenseAmount('');
    setExpenseNote('');
    setEditingId(null);
  };

  const startEdit = (entry: ExpenseEntry) => {
    setEditingId(entry.id);
    setExpenseDate(entry.date);
    setExpenseCategory(entry.category);
    setExpenseAmount(String(entry.amount));
    setExpenseNote(entry.note);
  };

  return (
    <div className="space-y-6">
      {/* Form: Add Expense */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-red-500" />
            {editingId ? 'খরচ এডিট করুন (Edit Expense)' : 'নতুন খরচ যোগ করুন (Add Expense)'}
          </h2>

          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setExpenseAmount('');
                setExpenseNote('');
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date *</label>
              <input
                type="date"
                value={expenseDate}
                onChange={e => setExpenseDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-600">Category *</label>
                <button
                  type="button"
                  onClick={handleAddCategoryPrompt}
                  className="text-[11px] text-indigo-600 font-semibold hover:underline"
                >
                  + New
                </button>
              </div>
              <select
                value={expenseCategory}
                onChange={e => setExpenseCategory(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none bg-white font-medium"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Amount (QR) *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={expenseAmount}
                onChange={e => setExpenseAmount(e.target.value)}
                placeholder="0.00"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Note / বিবরণ</label>
              <input
                type="text"
                value={expenseNote}
                onChange={e => setExpenseNote(e.target.value)}
                placeholder="ex: Packaging materials - 50 boxes"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs tracking-wide transition-colors"
            >
              {editingId ? 'Update Expense' : 'Save Expense (খরচ সেভ করুন)'}
            </button>
          </div>
        </form>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Category Filter</label>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none bg-white font-medium"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
            <div className="text-xs text-slate-500 font-medium">মোট খরচ (Filtered Expenses)</div>
            <div className="text-xl font-bold font-mono text-red-600 mt-0.5">
              {totalFilteredAmount.toFixed(2)} QR
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
            <div className="text-xs text-slate-500 font-medium">এন্ট্রি সংখ্যা (Entries)</div>
            <div className="text-xl font-bold font-mono text-slate-800 mt-0.5">
              {filteredExpenses.length} Entries
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown & Recent Entries Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 h-fit">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-indigo-600" /> ক্যাটাগরিভিত্তিক খরচ
          </h3>
          <div className="space-y-2">
            {categoryBreakdown.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-6">কোনো খরচ নেই</div>
            ) : (
              categoryBreakdown.map(c => (
                <div key={c.category} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
                  <div className="flex justify-between font-medium text-slate-800">
                    <span className="truncate pr-2">{c.category}</span>
                    <span className="font-mono font-bold">{c.total.toFixed(2)} QR</span>
                  </div>
                  <div className="text-[10px] text-slate-400 text-right mt-0.5">{c.percentage}% of total</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expenses Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">খরচের তালিকা (Expense Log)</h3>
            <span className="text-xs text-slate-400">{filteredExpenses.length} টি খরচ</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Note / বিবরণ</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3">By</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      কোনো খরচ পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">{e.date}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{e.category}</td>
                      <td className="py-3 px-3 text-slate-600">{e.note || '—'}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-red-600">{e.amount.toFixed(2)} QR</td>
                      <td className="py-3 px-3 text-slate-500">{e.createdBy}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEdit(e)}
                            className="p-1 rounded-lg text-indigo-600 hover:bg-indigo-50"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('এই খরচটি মুছে ফেলবেন? এটি লাভ-ক্ষতির হিসাব থেকেও বাদ যাবে।')) {
                                onDeleteExpense(e.id);
                              }
                            }}
                            className="p-1 rounded-lg text-red-500 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
