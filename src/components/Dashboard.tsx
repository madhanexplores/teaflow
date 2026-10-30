import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupee, formatDisplayDate, getTodayDateString } from '../utils/dateUtils';
import {
  TrendingUp,
  Receipt,
  PiggyBank,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  ArrowRight,
  Clock,
  Sparkles,
  Tag,
  Edit2,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    todaySalesTotal,
    todayExpensesTotal,
    todayEstimatedProfit,
    thisMonthSalesTotal,
    thisMonthExpensesTotal,
    thisMonthEstimatedProfit,
    sales,
    expenses,
    setIsAddSaleOpen,
    setIsAddExpenseOpen,
    setEditingSale,
    setEditingExpense,
    setActiveTab,
  } = useApp();

  const [recentTab, setRecentTab] = useState<'all' | 'sales' | 'expenses'>('all');
  const today = getTodayDateString();

  // Combine and sort recent transactions
  const combinedRecent = React.useMemo(() => {
    const saleItems = sales.map((s) => ({
      ...s,
      type: 'sale' as const,
      timestamp: new Date(s.createdAt).getTime() || 0,
    }));
    const expenseItems = expenses.map((e) => ({
      ...e,
      type: 'expense' as const,
      timestamp: new Date(e.createdAt).getTime() || 0,
    }));

    const all = [...saleItems, ...expenseItems];
    all.sort((a, b) => {
      // sort by date desc then by timestamp
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      return b.timestamp - a.timestamp;
    });

    if (recentTab === 'sales') return all.filter((i) => i.type === 'sale');
    if (recentTab === 'expenses') return all.filter((i) => i.type === 'expense');
    return all;
  }, [sales, expenses, recentTab]);

  const isTodayLoss = todayEstimatedProfit < 0;
  const isMonthLoss = thisMonthEstimatedProfit < 0;

  // Today profit margin percentage
  const todayMargin = todaySalesTotal > 0
    ? Math.round((todayEstimatedProfit / todaySalesTotal) * 100)
    : 0;

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Welcome Banner / Fast Action Callout */}
      <div className="bg-gradient-to-r from-[#3D2517] via-[#4A2E1E] to-[#2B1810] text-[#FAF7F2] rounded-3xl p-6 lg:p-8 shadow-xl shadow-[#3D2517]/25 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-emerald-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-200 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Chai Stall Daily Overview</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
              Today's Business Summary
            </h2>
            <p className="text-sm text-stone-300 mt-1 max-w-xl">
              Track your tea stall sales, milk and gas expenses, and live estimated profit in real time.
            </p>
          </div>

          {/* Prominent Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAddSaleOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#1E5E3A] hover:bg-[#16492C] text-white font-bold text-sm lg:text-base shadow-lg shadow-[#1E5E3A]/40 active:scale-95 transition-all cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              <span>+ Add Sales</span>
            </button>
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#B45309] hover:bg-[#92400E] text-white font-bold text-sm lg:text-base shadow-lg shadow-amber-900/40 active:scale-95 transition-all cursor-pointer"
            >
              <MinusCircle className="w-5 h-5" />
              <span>+ Add Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* TODAY'S FINANCIAL SUMMARY SECTION */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#1E5E3A] dark:text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E]">
              Today's Performance
            </h3>
          </div>
          <span className="text-xs text-[#7A533E] dark:text-[#A8907E] font-medium">
            Live figures
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Today's Sales Card */}
          <div className="bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl p-5 border border-[#E8DFD3] dark:border-[#2C231B] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E]">
                Today's Total Sales
              </span>
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-[#1E5E3A] dark:text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-[#1E5E3A] dark:text-emerald-400 tracking-tight">
                {formatRupee(todaySalesTotal)}
              </div>
              <p className="text-xs text-[#7A533E] dark:text-[#A8907E] mt-1 font-medium">
                {sales.filter((s) => s.date === today).length} sales recorded today
              </p>
            </div>
          </div>

          {/* Today's Expenses Card */}
          <div className="bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl p-5 border border-[#E8DFD3] dark:border-[#2C231B] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E]">
                Today's Total Expenses
              </span>
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-[#854D0E] dark:text-amber-400">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-[#854D0E] dark:text-amber-400 tracking-tight">
                {formatRupee(todayExpensesTotal)}
              </div>
              <p className="text-xs text-[#7A533E] dark:text-[#A8907E] mt-1 font-medium">
                {expenses.filter((e) => e.date === today).length} expenses recorded today
              </p>
            </div>
          </div>

          {/* Today's Estimated Profit Card */}
          <div
            className={`rounded-3xl p-5 border shadow-sm transition-shadow ${
              isTodayLoss
                ? 'bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-900/50'
                : 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E]">
                  Today's Estimated Profit
                </span>
              </div>
              <div
                className={`p-2 rounded-xl ${
                  isTodayLoss
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                }`}
              >
                {isTodayLoss ? <AlertCircle className="w-5 h-5" /> : <PiggyBank className="w-5 h-5" />}
              </div>
            </div>
            <div className="mt-3">
              <div
                className={`text-3xl font-extrabold tracking-tight ${
                  isTodayLoss
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {formatRupee(todayEstimatedProfit)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                    isTodayLoss
                      ? 'bg-red-200 text-red-800 dark:bg-red-900/60 dark:text-red-200'
                      : 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                  }`}
                >
                  {isTodayLoss ? 'Current Loss' : `${todayMargin}% Net Margin`}
                </span>
                <span className="text-[11px] text-[#7A533E] dark:text-[#A8907E]">
                  Sales − Expenses
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* THIS MONTH'S FINANCIAL SUMMARY SECTION */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#854D0E] dark:text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E]">
              This Month's Summary
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('profit')}
            className="text-xs font-semibold text-[#1E5E3A] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Open Profit Calculator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* This Month's Sales */}
          <div className="bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl p-5 border border-[#E8DFD3] dark:border-[#2C231B] shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E]">
              This Month's Sales
            </span>
            <div className="mt-2 text-2xl lg:text-3xl font-extrabold text-[#2B1810] dark:text-[#F3ECE1]">
              {formatRupee(thisMonthSalesTotal)}
            </div>
            <p className="text-xs text-[#7A533E] dark:text-[#A8907E] mt-1">
              Total sales revenue so far this month
            </p>
          </div>

          {/* This Month's Expenses */}
          <div className="bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl p-5 border border-[#E8DFD3] dark:border-[#2C231B] shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E]">
              This Month's Expenses
            </span>
            <div className="mt-2 text-2xl lg:text-3xl font-extrabold text-[#854D0E] dark:text-amber-400">
              {formatRupee(thisMonthExpensesTotal)}
            </div>
            <p className="text-xs text-[#7A533E] dark:text-[#A8907E] mt-1">
              Supplies, ingredients, rent & utilities
            </p>
          </div>

          {/* This Month's Estimated Profit */}
          <div
            className={`rounded-3xl p-5 border shadow-xs ${
              isMonthLoss
                ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40'
                : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E]">
                This Month's Estimated Profit
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isMonthLoss
                    ? 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                    : 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
                }`}
              >
                {isMonthLoss ? 'Net Loss' : 'Net Profit'}
              </span>
            </div>
            <div
              className={`mt-2 text-2xl lg:text-3xl font-extrabold ${
                isMonthLoss
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {formatRupee(thisMonthEstimatedProfit)}
            </div>
            <p className="text-xs text-[#7A533E] dark:text-[#A8907E] mt-1">
              Estimated profit across current month
            </p>
          </div>
        </div>
      </div>

      {/* RECENT SALES AND EXPENSES SECTION */}
      <div className="bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] p-5 lg:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8DFD3] dark:border-[#2C231B]">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#4A2E1E] dark:text-[#D5C2B1]" />
            <div>
              <h3 className="text-base font-bold text-[#2B1810] dark:text-[#F3ECE1]">
                Recent Records
              </h3>
              <p className="text-xs text-[#7A533E] dark:text-[#A8907E]">
                Click any record to edit amount, date, or delete
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-[#EFE8DD] dark:bg-[#251D17] rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setRecentTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                recentTab === 'all'
                  ? 'bg-white dark:bg-[#14100D] text-[#2B1810] dark:text-[#F3ECE1] shadow-xs'
                  : 'text-[#7A533E] dark:text-[#A8907E]'
              }`}
            >
              All ({combinedRecent.length})
            </button>
            <button
              onClick={() => setRecentTab('sales')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                recentTab === 'sales'
                  ? 'bg-[#1E5E3A] text-white shadow-xs'
                  : 'text-[#7A533E] dark:text-[#A8907E]'
              }`}
            >
              Sales
            </button>
            <button
              onClick={() => setRecentTab('expenses')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                recentTab === 'expenses'
                  ? 'bg-[#854D0E] text-white shadow-xs'
                  : 'text-[#7A533E] dark:text-[#A8907E]'
              }`}
            >
              Expenses
            </button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="divide-y divide-[#E8DFD3]/60 dark:divide-[#2C231B]/60 max-h-[380px] overflow-y-auto">
          {combinedRecent.length === 0 ? (
            <div className="text-center py-12 text-[#7A533E] dark:text-[#A8907E]">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#EFE8DD] dark:bg-[#251D17] flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-[#1E5E3A] dark:text-emerald-400" />
              </div>
              <p className="text-sm font-semibold">No records found yet</p>
              <p className="text-xs mt-1">
                Tap '+ Add Sales' or '+ Add Expense' above to get started
              </p>
            </div>
          ) : (
            combinedRecent.slice(0, 10).map((item) => {
              const isSaleItem = item.type === 'sale';
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isSaleItem) {
                      setEditingSale(item as any);
                    } else {
                      setEditingExpense(item as any);
                    }
                  }}
                  className="flex items-center justify-between py-3.5 px-2 hover:bg-[#F3ECE1]/60 dark:hover:bg-[#251D17]/60 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSaleItem
                          ? 'bg-emerald-100 text-[#1E5E3A] dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-amber-100 text-[#854D0E] dark:bg-amber-950/60 dark:text-amber-400'
                      }`}
                    >
                      {isSaleItem ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <Receipt className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#2B1810] dark:text-[#F3ECE1]">
                          {isSaleItem ? (item as any).note || 'Sales Entry' : (item as any).name}
                        </span>
                        {!isSaleItem && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#EAE1D5] dark:bg-[#2A221C] text-[#4A2E1E] dark:text-[#C5B3A2]">
                            <Tag className="w-2.5 h-2.5" />
                            {(item as any).category}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#7A533E] dark:text-[#A8907E] flex items-center gap-2 mt-0.5">
                        <span>{formatDisplayDate(item.date)}</span>
                        {item.type === 'sale' && (item as any).note && (
                          <span className="text-[11px] opacity-75">· {(item as any).note}</span>
                        )}
                        {item.type === 'expense' && (item as any).description && (
                          <span className="text-[11px] opacity-75">
                            · {(item as any).description}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div
                        className={`text-base font-extrabold ${
                          isSaleItem
                            ? 'text-[#1E5E3A] dark:text-emerald-400'
                            : 'text-[#854D0E] dark:text-amber-400'
                        }`}
                      >
                        {isSaleItem ? '+' : '-'}
                        {formatRupee(item.amount)}
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-[#7A533E] dark:text-[#A8907E]">
                        {isSaleItem ? 'Revenue' : 'Expense'}
                      </span>
                    </div>
                    <div className="p-1 rounded-lg text-[#7A533E] opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit2 className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {combinedRecent.length > 10 && (
          <div className="pt-3 border-t border-[#E8DFD3] dark:border-[#2C231B] text-center">
            <button
              onClick={() => setActiveTab('history')}
              className="text-xs font-bold text-[#1E5E3A] dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View All {combinedRecent.length} Records in History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
