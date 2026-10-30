import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DateFilterPreset, DailySummary } from '../types';
import {
  formatRupee,
  formatDisplayDate,
  formatFullDate,
  getTodayDateString,
  getDateRangeForPreset,
  isDateInRange,
} from '../utils/dateUtils';
import {
  Calculator,
  TrendingUp,
  Receipt,
  PiggyBank,
  AlertTriangle,
  Calendar,
  Info,
  CheckCircle2,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { exportFinancialSummaryToCsv } from '../utils/exportCsv';

export const ProfitCalculator: React.FC = () => {
  const { sales, expenses, setEditingSale, setEditingExpense } = useApp();

  const [preset, setPreset] = useState<DateFilterPreset>('thisMonth');
  const [customStart, setCustomStart] = useState(getTodayDateString());
  const [customEnd, setCustomEnd] = useState(getTodayDateString());

  const { startDate, endDate, label: rangeLabel } = useMemo(() => {
    return getDateRangeForPreset(preset, customStart, customEnd);
  }, [preset, customStart, customEnd]);

  // Filter sales and expenses strictly within the chosen date range
  const periodSales = useMemo(() => {
    return sales.filter((s) => isDateInRange(s.date, startDate, endDate));
  }, [sales, startDate, endDate]);

  const periodExpenses = useMemo(() => {
    return expenses.filter((e) => isDateInRange(e.date, startDate, endDate));
  }, [expenses, startDate, endDate]);

  // Aggregated totals for the selected period
  const totalSales = useMemo(() => {
    return periodSales.reduce((acc, curr) => acc + curr.amount, 0);
  }, [periodSales]);

  const totalExpenses = useMemo(() => {
    return periodExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [periodExpenses]);

  // FORMULA: Total Profit = Total Sales - Total Expenses
  const estimatedProfit = totalSales - totalExpenses;
  const isLoss = estimatedProfit < 0;

  // Margin percentage
  const profitMarginPercent = totalSales > 0
    ? Math.round((estimatedProfit / totalSales) * 100)
    : 0;

  // Daily breakdown within the period (never counting records twice)
  const dailyBreakdown = useMemo(() => {
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

    // Sort descending by date
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [periodSales, periodExpenses]);

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Page Title & Explanation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#1E5E3A] text-white">
              <Calculator className="w-5 h-5" />
            </div>
            <h2 className="text-xl lg:text-2xl font-extrabold text-[#2B1810] dark:text-[#F3ECE1]">
              Automatic Profit Calculator
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#7A533E] dark:text-[#A8907E] mt-1">
            Real-time calculation: Total Profit = Total Sales − Total Expenses
          </p>
        </div>

        <button
          onClick={() => exportFinancialSummaryToCsv(dailyBreakdown, rangeLabel)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D8C7B5] dark:border-[#382E26] bg-[#FAF7F2] dark:bg-[#1C1612] text-xs font-semibold text-[#4A2E1E] dark:text-[#D5C2B1] hover:bg-[#EAE1D5] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-[#1E5E3A]" />
          <span>Download Summary CSV</span>
        </button>
      </div>

      {/* Date Period Selector */}
      <div className="bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] p-4 lg:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E]">
            Select Period for Calculation:
          </span>
          <span className="text-xs font-medium text-[#1E5E3A] dark:text-emerald-400">
            {startDate} to {endDate}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'today', label: 'Today (Daily)' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'last7days', label: 'Last 7 Days (Weekly)' },
              { id: 'thisMonth', label: 'This Month (Monthly)' },
              { id: 'previousMonth', label: 'Previous Month' },
              { id: 'custom', label: 'Custom Range' },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                preset === p.id
                  ? 'bg-[#1E5E3A] text-white shadow-sm'
                  : 'bg-[#EFE8DD] dark:bg-[#251D17] text-[#4A2E1E] dark:text-[#D5C2B1] hover:bg-[#E2D6C6]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#E8DFD3] dark:border-[#2C231B]">
            <span className="text-xs font-semibold text-[#7A533E] dark:text-[#A8907E]">
              Custom Start:
            </span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] rounded-xl text-xs text-[#2B1810] dark:text-[#F3ECE1]"
            />
            <span className="text-xs font-semibold text-[#7A533E] dark:text-[#A8907E]">End:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] rounded-xl text-xs text-[#2B1810] dark:text-[#F3ECE1]"
            />
          </div>
        )}
      </div>

      {/* CORE FINANCIAL CALCULATION DISPLAY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Sales */}
        <div className="bg-[#FAF7F2] dark:bg-[#1C1612] p-5 rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E]">
              Total Sales ({rangeLabel})
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-[#1E5E3A] dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#1E5E3A] dark:text-emerald-400 tracking-tight">
            {formatRupee(totalSales)}
          </div>
          <p className="text-xs text-[#7A533E] dark:text-[#A8907E] mt-1 font-medium">
            From {periodSales.length} recorded sales entries
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-[#FAF7F2] dark:bg-[#1C1612] p-5 rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E]">
              Total Expenses ({rangeLabel})
            </span>
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-[#854D0E] dark:text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#854D0E] dark:text-amber-400 tracking-tight">
            {formatRupee(totalExpenses)}
          </div>
          <p className="text-xs text-[#7A533E] dark:text-[#A8907E] mt-1 font-medium">
            From {periodExpenses.length} recorded expense entries
          </p>
        </div>

        {/* Estimated Profit or Loss */}
        <div
          className={`p-5 rounded-3xl border shadow-sm transition-all ${
            isLoss
              ? 'bg-red-50/90 dark:bg-red-950/40 border-red-200 dark:border-red-900/60'
              : 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E]">
              Estimated Profit ({rangeLabel})
            </span>
            <div
              className={`p-2 rounded-xl ${
                isLoss
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
              }`}
            >
              {isLoss ? <AlertTriangle className="w-5 h-5" /> : <PiggyBank className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-3xl font-extrabold tracking-tight ${
                isLoss
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {formatRupee(estimatedProfit)}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                  isLoss
                    ? 'bg-red-200 text-red-900 dark:bg-red-900/70 dark:text-red-100'
                    : 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900/70 dark:text-emerald-100'
                }`}
              >
                {isLoss ? (
                  <>
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>Net Loss: {formatRupee(Math.abs(estimatedProfit))}</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Net Profit ({profitMarginPercent}% Margin)</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ESTIMATED PROFIT DISCLAIMER & FORMULA NOTE (as mandated by Section 5) */}
      <div className="p-4 rounded-2xl bg-[#EFE8DD] dark:bg-[#221A15] border border-[#E0D5C7] dark:border-[#382E26] flex items-start gap-3">
        <Info className="w-5 h-5 text-[#854D0E] dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-[#4A2E1E] dark:text-[#D5C2B1] space-y-1">
          <p className="font-bold">
            Formula Applied: Total Profit = Total Sales (₹{totalSales.toLocaleString('en-IN')}) − Total Expenses (₹{totalExpenses.toLocaleString('en-IN')}) = {formatRupee(estimatedProfit)}
          </p>
          <p className="opacity-80">
            Note: This figure is labeled as <strong>Estimated Profit</strong> because the exact calculation depends on all operational expenses recorded by the shop owner for the selected period.
          </p>
        </div>
      </div>

      {/* DAILY PROFIT BREAKDOWN TABLE */}
      <div className="bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8DFD3] dark:border-[#2C231B]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#1E5E3A] dark:text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#2B1810] dark:text-[#F3ECE1]">
              Daily Profit or Loss Breakdown ({dailyBreakdown.length} active days)
            </h3>
          </div>
        </div>

        {dailyBreakdown.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#7A533E] dark:text-[#A8907E]">
            No sales or expenses found for this time period.
          </div>
        ) : (
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E8DFD3] dark:border-[#2C231B] text-[#7A533E] dark:text-[#A8907E] uppercase font-bold">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Sales (INR)</th>
                  <th className="py-2.5 px-3">Expenses (INR)</th>
                  <th className="py-2.5 px-3">Estimated Profit / Loss</th>
                  <th className="py-2.5 px-3 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFD3]/60 dark:divide-[#2C231B]/60">
                {dailyBreakdown.map((row) => (
                  <tr
                    key={row.date}
                    className="hover:bg-[#F3ECE1]/40 dark:hover:bg-[#251D17]/40 transition-colors"
                  >
                    <td className="py-3 px-3 font-semibold text-[#2B1810] dark:text-[#F3ECE1]">
                      {formatFullDate(row.date)}
                    </td>
                    <td className="py-3 px-3 font-bold text-[#1E5E3A] dark:text-emerald-400">
                      {formatRupee(row.totalSales)}
                      <span className="text-[10px] text-[#7A533E] dark:text-[#A8907E] font-normal ml-1">
                        ({row.salesCount})
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-[#854D0E] dark:text-amber-400">
                      {formatRupee(row.totalExpenses)}
                      <span className="text-[10px] text-[#7A533E] dark:text-[#A8907E] font-normal ml-1">
                        ({row.expenseCount})
                      </span>
                    </td>
                    <td
                      className={`py-3 px-3 font-extrabold ${
                        row.isLoss
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {formatRupee(row.estimatedProfit)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.isLoss
                            ? 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-200'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200'
                        }`}
                      >
                        {row.isLoss ? 'Loss' : 'Profit'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
