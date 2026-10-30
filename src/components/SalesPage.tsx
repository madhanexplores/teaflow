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
  TrendingUp,
  PlusCircle,
  Calendar,
  Filter,
  Search,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Layers,
  CheckCircle,
} from 'lucide-react';
import { exportSalesToCsv } from '../utils/exportCsv';

export const SalesPage: React.FC = () => {
  const {
    sales,
    addSale,
    setEditingSale,
    deleteSale,
    setIsAddSaleOpen,
    thisMonthSalesTotal,
    todaySalesTotal,
  } = useApp();

  // Fast inline sales entry state
  const [amountInput, setAmountInput] = useState('');
  const [dateInput, setDateInput] = useState(getTodayDateString());
  const [noteInput, setNoteInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [inlineMessage, setInlineMessage] = useState<string | null>(null);

  // Filters
  const [filterPreset, setFilterPreset] = useState<DateFilterPreset>('thisMonth');
  const [customStart, setCustomStart] = useState(getTodayDateString());
  const [customEnd, setCustomEnd] = useState(getTodayDateString());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'dailyCombined' | 'allEntries'>('dailyCombined');

  const { startDate, endDate, label: rangeLabel } = useMemo(() => {
    return getDateRangeForPreset(filterPreset, customStart, customEnd);
  }, [filterPreset, customStart, customEnd]);

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((item) => {
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
  }, [sales, startDate, endDate, searchQuery]);

  // Combined daily sales summary (aggregates multiple entries on the same day as required by Section 3)
  const dailySalesCombined = useMemo(() => {
    const map = new Map<string, { date: string; totalAmount: number; count: number; notes: string[] }>();

    filteredSales.forEach((sale) => {
      const existing = map.get(sale.date) || {
        date: sale.date,
        totalAmount: 0,
        count: 0,
        notes: [],
      };
      existing.totalAmount += sale.amount;
      existing.count += 1;
      if (sale.note) {
        existing.notes.push(sale.note);
      }
      map.set(sale.date, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredSales]);

  // Summary Metrics
  const filteredSalesTotal = useMemo(() => {
    return filteredSales.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredSales]);

  // Weekly sales total (last 7 days)
  const last7DaysTotal = useMemo(() => {
    const range = getDateRangeForPreset('last7days');
    return sales
      .filter((s) => isDateInRange(s.date, range.startDate, range.endDate))
      .reduce((sum, s) => sum + s.amount, 0);
  }, [sales]);

  const handleInlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amountInput);
    if (isNaN(num) || num <= 0) {
      setInlineMessage('Please enter a valid amount');
      return;
    }
    if (!dateInput) {
      setInlineMessage('Please select a date');
      return;
    }

    try {
      setIsSaving(true);
      await addSale(num, dateInput, noteInput);
      setAmountInput('');
      setNoteInput('');
      setInlineMessage('Sales entry saved!');
      setTimeout(() => setInlineMessage(null), 3000);
    } catch (err: any) {
      setInlineMessage(err?.message || 'Error saving sale');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Banner / Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-extrabold text-[#2B1810] dark:text-[#F3ECE1]">
            Sales Management
          </h2>
          <p className="text-xs sm:text-sm text-[#7A533E] dark:text-[#A8907E]">
            Record daily tea and snack sales, view combined summaries, and track revenues
          </p>
        </div>

        <button
          onClick={() => exportSalesToCsv(filteredSales)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#D8C7B5] dark:border-[#382E26] bg-[#FAF7F2] dark:bg-[#1C1612] text-xs font-semibold text-[#4A2E1E] dark:text-[#D5C2B1] hover:bg-[#EAE1D5] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-[#1E5E3A]" />
          <span>Export Sales CSV</span>
        </button>
      </div>

      {/* Daily / Weekly / Monthly Sales Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FAF7F2] dark:bg-[#1C1612] p-4 lg:p-5 rounded-2xl border border-[#E8DFD3] dark:border-[#2C231B] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E]">
            Today's Sales
          </span>
          <div className="mt-1 text-2xl font-extrabold text-[#1E5E3A] dark:text-emerald-400">
            {formatRupee(todaySalesTotal)}
          </div>
          <p className="text-[11px] text-[#7A533E] dark:text-[#A8907E] mt-0.5">
            Updated continuously
          </p>
        </div>

        <div className="bg-[#FAF7F2] dark:bg-[#1C1612] p-4 lg:p-5 rounded-2xl border border-[#E8DFD3] dark:border-[#2C231B] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E]">
            Weekly Sales (Last 7 Days)
          </span>
          <div className="mt-1 text-2xl font-extrabold text-[#2B1810] dark:text-[#F3ECE1]">
            {formatRupee(last7DaysTotal)}
          </div>
          <p className="text-[11px] text-[#7A533E] dark:text-[#A8907E] mt-0.5">
            Rolling 7-day total
          </p>
        </div>

        <div className="bg-[#FAF7F2] dark:bg-[#1C1612] p-4 lg:p-5 rounded-2xl border border-[#E8DFD3] dark:border-[#2C231B] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E]">
            This Month's Sales
          </span>
          <div className="mt-1 text-2xl font-extrabold text-[#1E5E3A] dark:text-emerald-400">
            {formatRupee(thisMonthSalesTotal)}
          </div>
          <p className="text-[11px] text-[#7A533E] dark:text-[#A8907E] mt-0.5">
            Current calendar month
          </p>
        </div>
      </div>

      {/* QUICK INLINE SALES ENTRY FORM (Designed for instant 3-second recording) */}
      <div className="bg-gradient-to-br from-[#FAF7F2] to-[#F3ECE1] dark:from-[#1C1612] dark:to-[#221A15] rounded-3xl border-2 border-[#1E5E3A]/30 dark:border-emerald-500/20 p-5 lg:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#1E5E3A] text-white">
              <PlusCircle className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#2B1810] dark:text-[#F3ECE1]">
              Fast Sales Entry
            </h3>
          </div>
          {inlineMessage && (
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 animate-pulse">
              <CheckCircle className="w-3.5 h-3.5" />
              {inlineMessage}
            </span>
          )}
        </div>

        <form onSubmit={handleInlineSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-[#7A533E] dark:text-[#A8907E] mb-1">
              Sales Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-lg font-bold text-[#1E5E3A] dark:text-emerald-400">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 3500"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 bg-white dark:bg-[#14100D] border-2 border-[#D8C7B5] dark:border-[#382E26] focus:border-[#1E5E3A] rounded-xl text-lg font-bold text-[#2B1810] dark:text-[#F3ECE1] outline-none"
                required
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-[#7A533E] dark:text-[#A8907E] mb-1">
              Date *
            </label>
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] focus:border-[#1E5E3A] rounded-xl text-sm font-medium text-[#2B1810] dark:text-[#F3ECE1] outline-none"
              required
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-[#7A533E] dark:text-[#A8907E] mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Counter cash, UPI, Morning"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] focus:border-[#1E5E3A] rounded-xl text-sm text-[#2B1810] dark:text-[#F3ECE1] outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 px-4 rounded-xl bg-[#1E5E3A] hover:bg-[#16492C] text-white text-sm font-bold shadow-md shadow-[#1E5E3A]/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Saving...' : '+ Save'}
            </button>
          </div>
        </form>
      </div>

      {/* FILTER & VIEW CONTROLS */}
      <div className="bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] p-4 lg:p-5 shadow-xs space-y-4">
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
                    ? 'bg-[#1E5E3A] text-white shadow-xs'
                    : 'bg-[#EFE8DD] dark:bg-[#251D17] text-[#4A2E1E] dark:text-[#D5C2B1] hover:bg-[#E2D6C6]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Combined by Day vs Individual Entries */}
          <div className="flex items-center gap-1.5 p-1 bg-[#EFE8DD] dark:bg-[#251D17] rounded-xl self-start lg:self-auto">
            <button
              onClick={() => setViewMode('dailyCombined')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                viewMode === 'dailyCombined'
                  ? 'bg-white dark:bg-[#14100D] text-[#2B1810] dark:text-[#F3ECE1] shadow-xs'
                  : 'text-[#7A533E] dark:text-[#A8907E]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Daily Combined Totals</span>
            </button>
            <button
              onClick={() => setViewMode('allEntries')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                viewMode === 'allEntries'
                  ? 'bg-white dark:bg-[#14100D] text-[#2B1810] dark:text-[#F3ECE1] shadow-xs'
                  : 'text-[#7A533E] dark:text-[#A8907E]'
              }`}
            >
              <span>All Entries ({filteredSales.length})</span>
            </button>
          </div>
        </div>

        {/* Custom Date Pickers */}
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

        {/* Search Bar & Summary Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#7A533E]" />
            <input
              type="text"
              placeholder="Search by note, date or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] rounded-xl text-xs text-[#2B1810] dark:text-[#F3ECE1] outline-none"
            />
          </div>

          <div className="text-right">
            <span className="text-xs text-[#7A533E] dark:text-[#A8907E]">
              Total for {rangeLabel}:{' '}
            </span>
            <span className="text-base font-extrabold text-[#1E5E3A] dark:text-emerald-400">
              {formatRupee(filteredSalesTotal)}
            </span>
          </div>
        </div>

        {/* RECORDS LIST */}
        <div className="border-t border-[#E8DFD3] dark:border-[#2C231B] pt-3">
          {viewMode === 'dailyCombined' ? (
            /* DAILY COMBINED SUMMARY VIEW */
            <div className="space-y-3">
              {dailySalesCombined.length === 0 ? (
                <div className="py-10 text-center text-[#7A533E] dark:text-[#A8907E] text-xs">
                  No sales recorded for this period.
                </div>
              ) : (
                dailySalesCombined.map((day) => {
                  const dayEntries = filteredSales.filter((s) => s.date === day.date);
                  return (
                    <div
                      key={day.date}
                      className="p-4 rounded-2xl bg-white dark:bg-[#17120E] border border-[#E8DFD3] dark:border-[#2C231B] shadow-2xs hover:border-[#1E5E3A]/40 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#F0E6D8] dark:border-[#28201A]">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#1E5E3A] dark:text-emerald-400" />
                          <span className="text-sm font-bold text-[#2B1810] dark:text-[#F3ECE1]">
                            {formatFullDate(day.date)}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#EAE1D5] dark:bg-[#2A221C] text-[#4A2E1E] dark:text-[#C5B3A2] font-semibold">
                            {day.count} {day.count === 1 ? 'sale entry' : 'combined entries'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-[#7A533E] dark:text-[#A8907E] mr-2">
                            Day's Total:
                          </span>
                          <span className="text-lg font-extrabold text-[#1E5E3A] dark:text-emerald-400">
                            {formatRupee(day.totalAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Sub-entries breakdown for this day */}
                      <div className="pt-2 divide-y divide-[#F0E6D8]/50 dark:divide-[#28201A]/50">
                        {dayEntries.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between py-2 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-stone-400 font-mono text-[11px]">•</span>
                              <span className="font-medium text-[#2B1810] dark:text-[#F3ECE1]">
                                {sub.note || 'Counter tea sales'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-[#1E5E3A] dark:text-emerald-400">
                                {formatRupee(sub.amount)}
                              </span>
                              <button
                                onClick={() => setEditingSale(sub)}
                                className="p-1 rounded-md text-[#7A533E] hover:bg-[#EFE8DD] dark:hover:bg-[#251D17] transition-colors cursor-pointer"
                                title="Edit this entry"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* ALL INDIVIDUAL ENTRIES TABLE/LIST */
            <div className="divide-y divide-[#E8DFD3]/60 dark:divide-[#2C231B]/60">
              {filteredSales.length === 0 ? (
                <div className="py-10 text-center text-[#7A533E] dark:text-[#A8907E] text-xs">
                  No individual sales records found.
                </div>
              ) : (
                filteredSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between py-3 px-2 hover:bg-[#F3ECE1]/40 dark:hover:bg-[#251D17]/40 rounded-xl transition-colors"
                  >
                    <div>
                      <div className="text-sm font-bold text-[#2B1810] dark:text-[#F3ECE1]">
                        {sale.note || 'Tea Stall Sales'}
                      </div>
                      <div className="text-xs text-[#7A533E] dark:text-[#A8907E] mt-0.5">
                        {formatFullDate(sale.date)}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-base font-extrabold text-[#1E5E3A] dark:text-emerald-400">
                        {formatRupee(sale.amount)}
                      </span>
                      <button
                        onClick={() => setEditingSale(sale)}
                        className="p-1.5 rounded-lg text-[#7A533E] hover:bg-[#EAE1D5] dark:hover:bg-[#251D17] transition-colors cursor-pointer"
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
    </div>
  );
};
