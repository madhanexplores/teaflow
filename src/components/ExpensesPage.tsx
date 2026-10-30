import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DateFilterPreset, CategorySummary } from '../types';
import {
  formatRupee,
  formatDisplayDate,
  formatFullDate,
  getTodayDateString,
  getDateRangeForPreset,
  isDateInRange,
} from '../utils/dateUtils';
import {
  Receipt,
  PlusCircle,
  Tag,
  Calendar,
  Search,
  Edit2,
  Trash2,
  PieChart,
  FileSpreadsheet,
  Plus,
} from 'lucide-react';
import { exportExpensesToCsv } from '../utils/exportCsv';

export const ExpensesPage: React.FC = () => {
  const {
    expenses,
    categories,
    addExpense,
    setEditingExpense,
    setIsAddExpenseOpen,
    todayExpensesTotal,
    thisWeekExpensesTotal,
    thisMonthExpensesTotal,
    addCustomCategory,
  } = useApp();

  // Fast inline expense state
  const [nameInput, setNameInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [categoryInput, setCategoryInput] = useState(categories[0] || 'Milk');
  const [dateInput, setDateInput] = useState(getTodayDateString());
  const [descInput, setDescInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [inlineMsg, setInlineMsg] = useState<string | null>(null);

  // Filters
  const [filterPreset, setFilterPreset] = useState<DateFilterPreset>('thisMonth');
  const [customStart, setCustomStart] = useState(getTodayDateString());
  const [customEnd, setCustomEnd] = useState(getTodayDateString());
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { startDate, endDate, label: rangeLabel } = useMemo(() => {
    return getDateRangeForPreset(filterPreset, customStart, customEnd);
  }, [filterPreset, customStart, customEnd]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const inDate = isDateInRange(item.date, startDate, endDate);
      if (!inDate) return false;
      if (selectedCategoryFilter !== 'all' && item.category !== selectedCategoryFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        String(item.amount).includes(q)
      );
    });
  }, [expenses, startDate, endDate, selectedCategoryFilter, searchQuery]);

  // Filtered total
  const filteredExpensesTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  // Category Spend Breakdown (for the filtered period)
  const categoryBreakdown: CategorySummary[] = useMemo(() => {
    const map = new Map<string, { amount: number; count: number }>();
    filteredExpenses.forEach((exp) => {
      const current = map.get(exp.category) || { amount: 0, count: 0 };
      current.amount += exp.amount;
      current.count += 1;
      map.set(exp.category, current);
    });

    const total = filteredExpensesTotal || 1;
    const summaries: CategorySummary[] = [];
    map.forEach((value, key) => {
      summaries.push({
        category: key,
        amount: value.amount,
        count: value.count,
        percentage: Math.round((value.amount / total) * 100),
      });
    });

    return summaries.sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, filteredExpensesTotal]);

  const handleInlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amountInput);
    if (!nameInput.trim()) {
      setInlineMsg('Please enter expense name');
      return;
    }
    if (isNaN(num) || num <= 0) {
      setInlineMsg('Please enter valid amount');
      return;
    }
    if (!categoryInput) {
      setInlineMsg('Please select a category');
      return;
    }

    try {
      setIsSaving(true);
      await addExpense(nameInput, num, categoryInput, dateInput, descInput);
      setNameInput('');
      setAmountInput('');
      setDescInput('');
      setInlineMsg('Expense saved successfully!');
      setTimeout(() => setInlineMsg(null), 3000);
    } catch (err: any) {
      setInlineMsg(err?.message || 'Failed to save expense');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-extrabold text-[#2B1810] dark:text-[#F3ECE1]">
            Expense Tracker
          </h2>
          <p className="text-xs sm:text-sm text-[#7A533E] dark:text-[#A8907E]">
            Monitor milk, tea powder, gas cylinders, paper cups, shop rent, and staff salary
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => exportExpensesToCsv(filteredExpenses)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D8C7B5] dark:border-[#382E26] bg-[#FAF7F2] dark:bg-[#1C1612] text-xs font-semibold text-[#4A2E1E] dark:text-[#D5C2B1] hover:bg-[#EAE1D5] transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#854D0E]" />
            <span>Export Expenses CSV</span>
          </button>
          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#854D0E] hover:bg-[#713F12] text-white text-xs font-bold shadow-md shadow-amber-900/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ New Expense</span>
          </button>
        </div>
      </div>

      {/* THREE REQUIRED EXPENSE TOTAL STAT CARDS: Today, This Week, This Month */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Today's Total Expenses */}
        <div className="bg-[#FAF7F2] dark:bg-[#1C1612] p-4 lg:p-5 rounded-2xl border border-[#E8DFD3] dark:border-[#2C231B] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E]">
            Today's Total Expenses
          </span>
          <div className="mt-1 text-2xl font-extrabold text-[#854D0E] dark:text-amber-400">
            {formatRupee(todayExpensesTotal)}
          </div>
          <p className="text-[11px] text-[#7A533E] dark:text-[#A8907E] mt-0.5">
            Expenses recorded today
          </p>
        </div>

        {/* This Week's Total Expenses */}
        <div className="bg-[#FAF7F2] dark:bg-[#1C1612] p-4 lg:p-5 rounded-2xl border border-[#E8DFD3] dark:border-[#2C231B] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E]">
            This Week's Total Expenses
          </span>
          <div className="mt-1 text-2xl font-extrabold text-[#2B1810] dark:text-[#F3ECE1]">
            {formatRupee(thisWeekExpensesTotal)}
          </div>
          <p className="text-[11px] text-[#7A533E] dark:text-[#A8907E] mt-0.5">
            Past 7 days running expenses
          </p>
        </div>

        {/* This Month's Total Expenses */}
        <div className="bg-[#FAF7F2] dark:bg-[#1C1612] p-4 lg:p-5 rounded-2xl border border-[#E8DFD3] dark:border-[#2C231B] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E]">
            This Month's Total Expenses
          </span>
          <div className="mt-1 text-2xl font-extrabold text-[#854D0E] dark:text-amber-400">
            {formatRupee(thisMonthExpensesTotal)}
          </div>
          <p className="text-[11px] text-[#7A533E] dark:text-[#A8907E] mt-0.5">
            Total for current month
          </p>
        </div>
      </div>

      {/* FAST INLINE EXPENSE RECORDING FORM */}
      <div className="bg-gradient-to-br from-[#FAF7F2] to-[#F3ECE1] dark:from-[#1C1612] dark:to-[#221A15] rounded-3xl border-2 border-amber-800/30 dark:border-amber-600/20 p-5 lg:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#854D0E] text-white">
              <Receipt className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#2B1810] dark:text-[#F3ECE1]">
              Quick Expense Entry
            </h3>
          </div>
          {inlineMsg && (
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-400 animate-pulse">
              {inlineMsg}
            </span>
          )}
        </div>

        <form onSubmit={handleInlineSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-[#7A533E] dark:text-[#A8907E] mb-1">
              Expense Item *
            </label>
            <input
              type="text"
              placeholder="e.g. Milk 10L, Gas cylinder"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] focus:border-[#854D0E] rounded-xl text-sm font-semibold text-[#2B1810] dark:text-[#F3ECE1] outline-none"
              required
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-[#7A533E] dark:text-[#A8907E] mb-1">
              Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-bold text-[#854D0E] dark:text-amber-400">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="500"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full pl-7 pr-3 py-2 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] focus:border-[#854D0E] rounded-xl text-sm font-bold text-[#2B1810] dark:text-[#F3ECE1] outline-none"
                required
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-[#7A533E] dark:text-[#A8907E] mb-1">
              Category *
            </label>
            <select
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] focus:border-[#854D0E] rounded-xl text-xs font-medium text-[#2B1810] dark:text-[#F3ECE1] outline-none cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#7A533E] dark:text-[#A8907E] mb-1">
              Date *
            </label>
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="w-full px-2.5 py-2 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] focus:border-[#854D0E] rounded-xl text-xs text-[#2B1810] dark:text-[#F3ECE1] outline-none"
              required
            />
          </div>

          <div className="sm:col-span-1">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2 px-3 rounded-xl bg-[#854D0E] hover:bg-[#713F12] text-white text-xs font-bold shadow-md shadow-amber-900/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? '...' : '+ Add'}
            </button>
          </div>
        </form>
      </div>

      {/* EXPENSE TOTALS BY CATEGORY (Progress Bars & Percentages) */}
      <div className="bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#854D0E] dark:text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#2B1810] dark:text-[#F3ECE1]">
              Expense Totals by Category ({rangeLabel})
            </h3>
          </div>
          <span className="text-xs text-[#7A533E] dark:text-[#A8907E]">
            Total: {formatRupee(filteredExpensesTotal)}
          </span>
        </div>

        {categoryBreakdown.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#7A533E] dark:text-[#A8907E]">
            No expense records in this time frame.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryBreakdown.map((cat) => (
              <div
                key={cat.category}
                onClick={() =>
                  setSelectedCategoryFilter(
                    selectedCategoryFilter === cat.category ? 'all' : cat.category
                  )
                }
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  selectedCategoryFilter === cat.category
                    ? 'bg-amber-100/70 dark:bg-amber-950/40 border-[#854D0E] dark:border-amber-600'
                    : 'bg-white dark:bg-[#17120E] border-[#E8DFD3] dark:border-[#2C231B] hover:border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#2B1810] dark:text-[#F3ECE1]">
                  <span>{cat.category}</span>
                  <span className="text-[#854D0E] dark:text-amber-400 font-extrabold">
                    {formatRupee(cat.amount)}
                  </span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full bg-[#EFE8DD] dark:bg-[#251D17] h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-[#854D0E] dark:bg-amber-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(4, cat.percentage))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#7A533E] dark:text-[#A8907E] mt-1.5 font-medium">
                  <span>{cat.count} items recorded</span>
                  <span>{cat.percentage}% of total</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* COMPLETE EXPENSE HISTORY LIST */}
      <div className="bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] p-4 lg:p-5 shadow-xs space-y-4">
        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'last7days', label: 'Last 7 Days' },
                { id: 'thisMonth', label: 'This Month' },
                { id: 'previousMonth', label: 'Prev Month' },
                { id: 'custom', label: 'Custom Range' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => setFilterPreset(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterPreset === p.id
                    ? 'bg-[#854D0E] text-white shadow-xs'
                    : 'bg-[#EFE8DD] dark:bg-[#251D17] text-[#4A2E1E] dark:text-[#D5C2B1] hover:bg-[#E2D6C6]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#7A533E] dark:text-[#A8907E]">
              Category:
            </span>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] rounded-xl text-xs text-[#2B1810] dark:text-[#F3ECE1] outline-none cursor-pointer"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Range Picker */}
        {filterPreset === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#E8DFD3] dark:border-[#2C231B]">
            <span className="text-xs font-semibold text-[#7A533E] dark:text-[#A8907E]">
              Custom Range:
            </span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] rounded-xl text-xs text-[#2B1810] dark:text-[#F3ECE1]"
            />
            <span className="text-xs text-[#7A533E]">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] rounded-xl text-xs text-[#2B1810] dark:text-[#F3ECE1]"
            />
          </div>
        )}

        {/* Search & Total Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#7A533E]" />
            <input
              type="text"
              placeholder="Search expenses by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] rounded-xl text-xs text-[#2B1810] dark:text-[#F3ECE1] outline-none"
            />
          </div>

          <div className="text-right">
            <span className="text-xs text-[#7A533E] dark:text-[#A8907E]">
              Filtered Total ({filteredExpenses.length} items):{' '}
            </span>
            <span className="text-base font-extrabold text-[#854D0E] dark:text-amber-400">
              {formatRupee(filteredExpensesTotal)}
            </span>
          </div>
        </div>

        {/* Expenses List */}
        <div className="divide-y divide-[#E8DFD3]/60 dark:divide-[#2C231B]/60 border-t border-[#E8DFD3] dark:border-[#2C231B] pt-2">
          {filteredExpenses.length === 0 ? (
            <div className="py-10 text-center text-[#7A533E] dark:text-[#A8907E] text-xs">
              No expenses recorded for this filter.
            </div>
          ) : (
            filteredExpenses.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between py-3 px-2 hover:bg-[#F3ECE1]/40 dark:hover:bg-[#251D17]/40 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-[#854D0E] dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#2B1810] dark:text-[#F3ECE1]">
                        {exp.name}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#EAE1D5] dark:bg-[#2A221C] text-[#4A2E1E] dark:text-[#C5B3A2]">
                        <Tag className="w-2.5 h-2.5" />
                        {exp.category}
                      </span>
                    </div>
                    <div className="text-xs text-[#7A533E] dark:text-[#A8907E] flex items-center gap-2 mt-0.5">
                      <span>{formatDisplayDate(exp.date)}</span>
                      {exp.description && (
                        <span className="text-[11px] opacity-75">· {exp.description}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-base font-extrabold text-[#854D0E] dark:text-amber-400">
                    {formatRupee(exp.amount)}
                  </span>
                  <button
                    onClick={() => setEditingExpense(exp)}
                    className="p-1.5 rounded-lg text-[#7A533E] hover:bg-[#EAE1D5] dark:hover:bg-[#251D17] transition-colors cursor-pointer"
                    title="Edit expense"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
