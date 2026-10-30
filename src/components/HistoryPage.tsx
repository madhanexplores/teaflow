import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DateFilterPreset } from '../types';
import {
  formatRupee,
  formatDisplayDate,
  formatFullDate,
  getTodayDateString,
  getDateRangeForPreset,
  isDateInRange,
} from '../utils/dateUtils';
import {
  History,
  TrendingUp,
  Receipt,
  Search,
  Edit2,
  Trash2,
  Calendar,
  FileSpreadsheet,
  Tag,
} from 'lucide-react';
import { exportSalesToCsv, exportExpensesToCsv } from '../utils/exportCsv';

export const HistoryPage: React.FC = () => {
  const { sales, expenses, setEditingSale, setEditingExpense } = useApp();

  const [activeTab, setActiveTab] = useState<'sales' | 'expenses'>('sales');
  const [preset, setPreset] = useState<DateFilterPreset>('thisMonth');
  const [customStart, setCustomStart] = useState(getTodayDateString());
  const [customEnd, setCustomEnd] = useState(getTodayDateString());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest'>('newest');

  const { startDate, endDate, label: rangeLabel } = useMemo(() => {
    return getDateRangeForPreset(preset, customStart, customEnd);
  }, [preset, customStart, customEnd]);

  // Filter Sales
  const filteredSales = useMemo(() => {
    let list = sales.filter((item) => {
      const inDate = isDateInRange(item.date, startDate, endDate);
      if (!inDate) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.date.includes(q) ||
        (item.note && item.note.toLowerCase().includes(q)) ||
        String(item.amount).includes(q)
      );
    });

    if (sortOrder === 'newest') {
      list.sort((a, b) => b.date.localeCompare(a.date));
    } else if (sortOrder === 'oldest') {
      list.sort((a, b) => a.date.localeCompare(b.date));
    } else if (sortOrder === 'highest') {
      list.sort((a, b) => b.amount - a.amount);
    }
    return list;
  }, [sales, startDate, endDate, searchQuery, sortOrder]);

  // Filter Expenses
  const filteredExpenses = useMemo(() => {
    let list = expenses.filter((item) => {
      const inDate = isDateInRange(item.date, startDate, endDate);
      if (!inDate) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.date.includes(q) ||
        String(item.amount).includes(q)
      );
    });

    if (sortOrder === 'newest') {
      list.sort((a, b) => b.date.localeCompare(a.date));
    } else if (sortOrder === 'oldest') {
      list.sort((a, b) => a.date.localeCompare(b.date));
    } else if (sortOrder === 'highest') {
      list.sort((a, b) => b.amount - a.amount);
    }
    return list;
  }, [expenses, startDate, endDate, searchQuery, sortOrder]);

  const salesTotal = useMemo(() => {
    return filteredSales.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredSales]);

  const expensesTotal = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredExpenses]);

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#3D2517] text-amber-200">
              <History className="w-5 h-5" />
            </div>
            <h2 className="text-xl lg:text-2xl font-extrabold text-[#2B1810] dark:text-[#F3ECE1]">
              Record History & Logs
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#7A533E] dark:text-[#A8907E] mt-1">
            Browse, search, edit, or delete stored tea shop sales and expenses
          </p>
        </div>

        {/* Export Button */}
        {activeTab === 'sales' ? (
          <button
            onClick={() => exportSalesToCsv(filteredSales)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D8C7B5] dark:border-[#382E26] bg-[#FAF7F2] dark:bg-[#1C1612] text-xs font-semibold text-[#4A2E1E] dark:text-[#D5C2B1] hover:bg-[#EAE1D5] transition-colors cursor-pointer self-start sm:self-auto"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#1E5E3A]" />
            <span>Export Sales ({filteredSales.length})</span>
          </button>
        ) : (
          <button
            onClick={() => exportExpensesToCsv(filteredExpenses)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D8C7B5] dark:border-[#382E26] bg-[#FAF7F2] dark:bg-[#1C1612] text-xs font-semibold text-[#4A2E1E] dark:text-[#D5C2B1] hover:bg-[#EAE1D5] transition-colors cursor-pointer self-start sm:self-auto"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#854D0E]" />
            <span>Export Expenses ({filteredExpenses.length})</span>
          </button>
        )}
      </div>

      {/* TWO PRIMARY TABS (Sales History vs Expense History) */}
      <div className="flex items-center p-1.5 bg-[#EFE8DD] dark:bg-[#251D17] rounded-2xl w-full sm:w-fit">
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'sales'
              ? 'bg-[#1E5E3A] text-white shadow-md shadow-[#1E5E3A]/20'
              : 'text-[#4A2E1E] dark:text-[#D5C2B1] hover:bg-white/50 dark:hover:bg-black/20'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Sales History ({filteredSales.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'expenses'
              ? 'bg-[#854D0E] text-white shadow-md shadow-amber-900/20'
              : 'text-[#4A2E1E] dark:text-[#D5C2B1] hover:bg-white/50 dark:hover:bg-black/20'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Expense History ({filteredExpenses.length})</span>
        </button>
      </div>

      {/* FILTER BAR: Today, Yesterday, Last 7 days, This month, Prev month, Custom */}
      <div className="bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] p-4 lg:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'last7days', label: 'Last 7 Days' },
                { id: 'thisMonth', label: 'This Month' },
                { id: 'previousMonth', label: 'Prev Month' },
                { id: 'custom', label: 'Custom' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  preset === p.id
                    ? activeTab === 'sales'
                      ? 'bg-[#1E5E3A] text-white'
                      : 'bg-[#854D0E] text-white'
                    : 'bg-[#EFE8DD] dark:bg-[#251D17] text-[#4A2E1E] dark:text-[#D5C2B1]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#7A533E] dark:text-[#A8907E] font-medium">Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] rounded-xl text-xs text-[#2B1810] dark:text-[#F3ECE1] outline-none cursor-pointer"
            >
              <option value="newest">Newest Date</option>
              <option value="oldest">Oldest Date</option>
              <option value="highest">Highest Amount</option>
            </select>
          </div>
        </div>

        {/* Custom Date Pickers */}
        {preset === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#E8DFD3] dark:border-[#2C231B]">
            <span className="text-xs font-semibold text-[#7A533E] dark:text-[#A8907E]">Range:</span>
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

        {/* Search Bar & Total */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E8DFD3] dark:border-[#2C231B]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#7A533E]" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'sales' ? 'sales notes or amount' : 'expense names or categories'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] rounded-xl text-xs text-[#2B1810] dark:text-[#F3ECE1] outline-none"
            />
          </div>

          <div className="text-right">
            <span className="text-xs text-[#7A533E] dark:text-[#A8907E]">
              {rangeLabel} Total ({activeTab === 'sales' ? filteredSales.length : filteredExpenses.length} records):{' '}
            </span>
            <span
              className={`text-base font-extrabold ${
                activeTab === 'sales'
                  ? 'text-[#1E5E3A] dark:text-emerald-400'
                  : 'text-[#854D0E] dark:text-amber-400'
              }`}
            >
              {formatRupee(activeTab === 'sales' ? salesTotal : expensesTotal)}
            </span>
          </div>
        </div>

        {/* TAB 1: SALES HISTORY */}
        {activeTab === 'sales' && (
          <div className="divide-y divide-[#E8DFD3]/60 dark:divide-[#2C231B]/60 border-t border-[#E8DFD3] dark:border-[#2C231B] pt-2">
            {filteredSales.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#7A533E] dark:text-[#A8907E]">
                No sales records found for this period.
              </div>
            ) : (
              filteredSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between py-3 px-2 hover:bg-[#F3ECE1]/40 dark:hover:bg-[#251D17]/40 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-[#1E5E3A] dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#2B1810] dark:text-[#F3ECE1]">
                        {sale.note || 'Counter tea sales'}
                      </div>
                      <div className="text-xs text-[#7A533E] dark:text-[#A8907E] flex items-center gap-2 mt-0.5">
                        <span className="font-medium">{formatFullDate(sale.date)}</span>
                        {sale.note && (
                          <span className="text-[11px] opacity-75">· {sale.note}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-base font-extrabold text-[#1E5E3A] dark:text-emerald-400">
                      +{formatRupee(sale.amount)}
                    </span>
                    <button
                      onClick={() => setEditingSale(sale)}
                      className="p-1.5 rounded-lg text-[#7A533E] hover:bg-[#EAE1D5] dark:hover:bg-[#251D17] transition-colors cursor-pointer"
                      title="Edit or Delete"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: EXPENSE HISTORY */}
        {activeTab === 'expenses' && (
          <div className="divide-y divide-[#E8DFD3]/60 dark:divide-[#2C231B]/60 border-t border-[#E8DFD3] dark:border-[#2C231B] pt-2">
            {filteredExpenses.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#7A533E] dark:text-[#A8907E]">
                No expense records found for this period.
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
                        <span className="font-medium">{formatFullDate(exp.date)}</span>
                        {exp.description && (
                          <span className="text-[11px] opacity-75">· {exp.description}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-base font-extrabold text-[#854D0E] dark:text-amber-400">
                      -{formatRupee(exp.amount)}
                    </span>
                    <button
                      onClick={() => setEditingExpense(exp)}
                      className="p-1.5 rounded-lg text-[#7A533E] hover:bg-[#EAE1D5] dark:hover:bg-[#251D17] transition-colors cursor-pointer"
                      title="Edit or Delete"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
