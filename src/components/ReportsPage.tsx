import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DateFilterPreset, DailySummary, CategorySummary } from '../types';
import {
  formatRupee,
  formatDisplayDate,
  formatFullDate,
  getTodayDateString,
  getDateRangeForPreset,
  isDateInRange,
} from '../utils/dateUtils';
import {
  BarChart3,
  TrendingUp,
  Receipt,
  PiggyBank,
  AlertTriangle,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
} from 'lucide-react';
import {
  exportFinancialSummaryToCsv,
  exportSalesToCsv,
  exportExpensesToCsv,
} from '../utils/exportCsv';

export const ReportsPage: React.FC = () => {
  const { sales, expenses } = useApp();

  const [preset, setPreset] = useState<DateFilterPreset>('thisMonth');
  const [customStart, setCustomStart] = useState(getTodayDateString());
  const [customEnd, setCustomEnd] = useState(getTodayDateString());

  const { startDate, endDate, label: rangeLabel } = useMemo(() => {
    return getDateRangeForPreset(preset, customStart, customEnd);
  }, [preset, customStart, customEnd]);

  // Filter sales and expenses in period
  const periodSales = useMemo(() => {
    return sales.filter((s) => isDateInRange(s.date, startDate, endDate));
  }, [sales, startDate, endDate]);

  const periodExpenses = useMemo(() => {
    return expenses.filter((e) => isDateInRange(e.date, startDate, endDate));
  }, [expenses, startDate, endDate]);

  const totalSales = useMemo(() => {
    return periodSales.reduce((sum, s) => sum + s.amount, 0);
  }, [periodSales]);

  const totalExpenses = useMemo(() => {
    return periodExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [periodExpenses]);

  const estimatedProfit = totalSales - totalExpenses;
  const isLoss = estimatedProfit < 0;
  const marginPercent = totalSales > 0 ? Math.round((estimatedProfit / totalSales) * 100) : 0;

  // Daily aggregations for charts
  const dailySeries: DailySummary[] = useMemo(() => {
    const map = new Map<string, DailySummary>();

    periodSales.forEach((s) => {
      const existing = map.get(s.date) || {
        date: s.date,
        totalSales: 0,
        salesCount: 0,
        totalExpenses: 0,
        expenseCount: 0,
        estimatedProfit: 0,
        isLoss: false,
      };
      existing.totalSales += s.amount;
      existing.salesCount += 1;
      map.set(s.date, existing);
    });

    periodExpenses.forEach((e) => {
      const existing = map.get(e.date) || {
        date: e.date,
        totalSales: 0,
        salesCount: 0,
        totalExpenses: 0,
        expenseCount: 0,
        estimatedProfit: 0,
        isLoss: false,
      };
      existing.totalExpenses += e.amount;
      existing.expenseCount += 1;
      map.set(e.date, existing);
    });

    const list: DailySummary[] = [];
    map.forEach((item) => {
      item.estimatedProfit = item.totalSales - item.totalExpenses;
      item.isLoss = item.estimatedProfit < 0;
      list.push(item);
    });

    // Chronological order for charts
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [periodSales, periodExpenses]);

  // Max value for chart scaling
  const maxBarValue = useMemo(() => {
    let max = 1000;
    dailySeries.forEach((d) => {
      if (d.totalSales > max) max = d.totalSales;
      if (d.totalExpenses > max) max = d.totalExpenses;
    });
    return max * 1.15; // 15% headroom
  }, [dailySeries]);

  // Category breakdown
  const categorySummary: CategorySummary[] = useMemo(() => {
    const map = new Map<string, number>();
    periodExpenses.forEach((e) => {
      map.set(e.category, (map.get(e.category) || 0) + e.amount);
    });
    const total = totalExpenses || 1;
    const list: CategorySummary[] = [];
    map.forEach((amount, cat) => {
      list.push({
        category: cat,
        amount,
        count: periodExpenses.filter((e) => e.category === cat).length,
        percentage: Math.round((amount / total) * 100),
      });
    });
    return list.sort((a, b) => b.amount - a.amount);
  }, [periodExpenses, totalExpenses]);

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Title & CSV Export Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#1E5E3A] text-white">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-xl lg:text-2xl font-extrabold text-[#2B1810] dark:text-[#F3ECE1]">
              Business Reports & Charts
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#7A533E] dark:text-[#A8907E] mt-1">
            Visual breakdown of sales, expenses, and profit trends with one-click CSV export
          </p>
        </div>

        {/* CSV Export Dropdown or Button Group */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => exportFinancialSummaryToCsv(dailySeries, rangeLabel)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1E5E3A] hover:bg-[#16492C] text-white text-xs font-bold shadow-md shadow-[#1E5E3A]/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report CSV</span>
          </button>
          <button
            onClick={() => exportSalesToCsv(periodSales)}
            className="px-3 py-2 rounded-xl border border-[#D8C7B5] dark:border-[#382E26] bg-[#FAF7F2] dark:bg-[#1C1612] text-[#4A2E1E] dark:text-[#D5C2B1] text-xs font-semibold hover:bg-[#EAE1D5] transition-colors cursor-pointer"
          >
            Sales CSV
          </button>
          <button
            onClick={() => exportExpensesToCsv(periodExpenses)}
            className="px-3 py-2 rounded-xl border border-[#D8C7B5] dark:border-[#382E26] bg-[#FAF7F2] dark:bg-[#1C1612] text-[#4A2E1E] dark:text-[#D5C2B1] text-xs font-semibold hover:bg-[#EAE1D5] transition-colors cursor-pointer"
          >
            Expenses CSV
          </button>
        </div>
      </div>

      {/* Date Range Selector: Daily, Weekly, Monthly, Custom */}
      <div className="bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] p-4 lg:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E]">
            Choose Timeframe:
          </span>
          <span className="text-xs font-semibold text-[#1E5E3A] dark:text-emerald-400">
            {startDate} to {endDate}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'today', label: 'Daily (Today)' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'last7days', label: 'Weekly (Last 7 Days)' },
              { id: 'thisMonth', label: 'Monthly (This Month)' },
              { id: 'previousMonth', label: 'Previous Month' },
              { id: 'custom', label: 'Custom Range' },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                preset === p.id
                  ? 'bg-[#1E5E3A] text-white shadow-xs'
                  : 'bg-[#EFE8DD] dark:bg-[#251D17] text-[#4A2E1E] dark:text-[#D5C2B1] hover:bg-[#E2D6C6]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#E8DFD3] dark:border-[#2C231B]">
            <span className="text-xs font-semibold text-[#7A533E]">Start:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-[#14100D] border border-[#D8C7B5] rounded-xl text-xs"
            />
            <span className="text-xs font-semibold text-[#7A533E]">End:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-[#14100D] border border-[#D8C7B5] rounded-xl text-xs"
            />
          </div>
        )}
      </div>

      {/* CORE FINANCIAL TOTALS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Sales */}
        <div className="bg-[#FAF7F2] dark:bg-[#1C1612] p-5 rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E]">
              Total Sales
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-[#1E5E3A] dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#1E5E3A] dark:text-emerald-400">
            {formatRupee(totalSales)}
          </div>
          <p className="text-xs text-[#7A533E] dark:text-[#A8907E] mt-1">
            {periodSales.length} total sales entries
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-[#FAF7F2] dark:bg-[#1C1612] p-5 rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E]">
              Total Expenses
            </span>
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-[#854D0E] dark:text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#854D0E] dark:text-amber-400">
            {formatRupee(totalExpenses)}
          </div>
          <p className="text-xs text-[#7A533E] dark:text-[#A8907E] mt-1">
            {periodExpenses.length} total expense entries
          </p>
        </div>

        {/* Estimated Profit or Loss */}
        <div
          className={`p-5 rounded-3xl border shadow-xs ${
            isLoss
              ? 'bg-red-50/90 dark:bg-red-950/30 border-red-200 dark:border-red-900/50'
              : 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E]">
              Estimated Profit / Loss
            </span>
            <div
              className={`p-2 rounded-xl ${
                isLoss
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
              }`}
            >
              {isLoss ? <AlertTriangle className="w-5 h-5" /> : <PiggyBank className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-3xl font-extrabold ${
                isLoss ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {formatRupee(estimatedProfit)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isLoss
                    ? 'bg-red-200 text-red-800 dark:bg-red-900/60 dark:text-red-200'
                    : 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                }`}
              >
                {isLoss ? 'Net Business Loss' : `Estimated Net Profit (${marginPercent}%)`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CHART 1: DAILY SALES & EXPENSES COMPARISON CHART (SVG Responsive) */}
      <div className="bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] p-5 lg:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#2B1810] dark:text-[#F3ECE1]">
              Daily Sales vs Expenses Comparison
            </h3>
            <p className="text-xs text-[#7A533E] dark:text-[#A8907E]">
              Green bars represent Sales revenue, Amber bars represent Expenses
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#1E5E3A] inline-block" />
              <span className="text-[#1E5E3A] dark:text-emerald-400">Sales</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#B45309] inline-block" />
              <span className="text-[#854D0E] dark:text-amber-400">Expenses</span>
            </div>
          </div>
        </div>

        {dailySeries.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#7A533E] dark:text-[#A8907E]">
            No activity records for this period.
          </div>
        ) : (
          <div className="pt-4 overflow-x-auto">
            <div className="min-w-[480px] h-64 flex items-end gap-3 sm:gap-5 pb-8 pt-4 px-2 border-b border-[#E8DFD3] dark:border-[#2C231B] relative">
              {dailySeries.map((day) => {
                const salesHeight = Math.max(4, Math.round((day.totalSales / maxBarValue) * 100));
                const expHeight = Math.max(4, Math.round((day.totalExpenses / maxBarValue) * 100));

                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Hover Tooltip */}
                    <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-[#2B1810] text-[#FAF7F2] text-[10px] p-2 rounded-xl pointer-events-none z-20 whitespace-nowrap shadow-lg">
                      <div className="font-bold">{formatDisplayDate(day.date)}</div>
                      <div>Sales: ₹{day.totalSales.toLocaleString('en-IN')}</div>
                      <div>Expenses: ₹{day.totalExpenses.toLocaleString('en-IN')}</div>
                    </div>

                    {/* Bars pair */}
                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      {/* Sales Bar */}
                      <div
                        className="w-1/2 max-w-[20px] bg-[#1E5E3A] hover:bg-[#16492C] rounded-t-md transition-all duration-300 relative"
                        style={{ height: `${salesHeight}%` }}
                        title={`Sales: ₹${day.totalSales}`}
                      />
                      {/* Expense Bar */}
                      <div
                        className="w-1/2 max-w-[20px] bg-[#B45309] hover:bg-[#92400E] rounded-t-md transition-all duration-300 relative"
                        style={{ height: `${expHeight}%` }}
                        title={`Expenses: ₹${day.totalExpenses}`}
                      />
                    </div>

                    {/* Date label underneath */}
                    <div className="absolute -bottom-6 text-[10px] font-semibold text-[#7A533E] dark:text-[#A8907E] whitespace-nowrap">
                      {day.date.substring(8, 10)} {new Date(day.date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* CHART 2: PROFIT TREND CHART (Green for Profit, Red for Loss) */}
      <div className="bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] p-5 lg:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#2B1810] dark:text-[#F3ECE1]">
              Estimated Profit / Loss Trajectory Trend
            </h3>
            <p className="text-xs text-[#7A533E] dark:text-[#A8907E]">
              Daily net profit (Sales − Expenses). Loss days clearly indicated in red.
            </p>
          </div>
        </div>

        {dailySeries.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#7A533E]">No data available.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
            {dailySeries.map((day) => (
              <div
                key={day.date}
                className={`p-3.5 rounded-2xl border transition-all ${
                  day.isLoss
                    ? 'bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-900/40'
                    : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#2B1810] dark:text-[#F3ECE1]">
                    {formatDisplayDate(day.date)}
                  </span>
                  <span
                    className={`font-bold text-[10px] px-1.5 py-0.5 rounded-md ${
                      day.isLoss
                        ? 'bg-red-200 text-red-800 dark:bg-red-900/60 dark:text-red-200'
                        : 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                    }`}
                  >
                    {day.isLoss ? 'Loss' : 'Profit'}
                  </span>
                </div>
                <div
                  className={`mt-2 text-lg font-extrabold ${
                    day.isLoss
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {formatRupee(day.estimatedProfit)}
                </div>
                <div className="text-[10px] text-[#7A533E] dark:text-[#A8907E] mt-1 flex justify-between">
                  <span>Sales: ₹{day.totalSales}</span>
                  <span>Exp: ₹{day.totalExpenses}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CATEGORY SPEND DISTRIBUTION */}
      <div className="bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <PieChart className="w-4 h-4 text-[#854D0E] dark:text-amber-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#2B1810] dark:text-[#F3ECE1]">
            Expense Category Distribution ({rangeLabel})
          </h3>
        </div>

        {categorySummary.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#7A533E]">No expense records.</div>
        ) : (
          <div className="space-y-3">
            {categorySummary.map((item) => (
              <div key={item.category} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#2B1810] dark:text-[#F3ECE1]">{item.category}</span>
                  <span className="text-[#854D0E] dark:text-amber-400 font-bold">
                    {formatRupee(item.amount)} ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-[#EFE8DD] dark:bg-[#251D17] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#854D0E] dark:bg-amber-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(3, item.percentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
