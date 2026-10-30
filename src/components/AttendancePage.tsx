import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  WorkerRecord,
  AttendanceStatus,
  ShopOperatingStatus,
  WorkerSalarySummary,
} from '../types';
import {
  formatRupee,
  formatDisplayDate,
  formatFullDate,
  getTodayDateString,
} from '../utils/dateUtils';
import {
  CalendarCheck2,
  UserPlus,
  Users,
  CheckCircle2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  CreditCard,
  HandCoins,
  Edit2,
  Sparkles,
  Store,
  Palmtree,
  CalendarOff,
  Clock,
  Eye,
  PlusCircle,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { exportAttendanceMonthlyToCsv } from '../utils/exportCsv';
import { RecordAdvanceModal } from './modals/RecordAdvanceModal';
import { ManageHolidaysModal } from './modals/ManageHolidaysModal';
import { WorkerAttendanceDetailModal } from './modals/WorkerAttendanceDetailModal';

export const AttendancePage: React.FC = () => {
  const {
    workers,
    attendance,
    shopStatuses,
    recordAttendance,
    getShopStatusForDate,
    setShopStatus,
    deleteShopStatus,
    getEffectiveAttendanceForWorker,
    calculateDailyWages,
    calculateWorkerSalaryForMonth,
    setIsAddWorkerOpen,
    setEditingWorker,
    updateWorker,
    setIsRecordPaymentOpen,
    setPaymentWorkerTarget,
  } = useApp();

  const today = getTodayDateString(); // e.g. '2026-10-29'
  const currentMonth = today.substring(0, 7);

  // Navigation sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'daily' | 'salary' | 'workers'>('daily');

  // Selected date for daily attendance
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Selected month for salary calculations and reports
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedWorkerFilter, setSelectedWorkerFilter] = useState<string>('all');

  // Modal states
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advanceTargetWorker, setAdvanceTargetWorker] = useState<WorkerRecord | null>(null);

  const [isHolidaysModalOpen, setIsHolidaysModalOpen] = useState(false);
  const [holidayModalInitialDate, setHolidayModalInitialDate] = useState<string | undefined>(undefined);

  const [detailModalSummary, setDetailModalSummary] = useState<WorkerSalarySummary | null>(null);

  // Active workers
  const activeWorkers = useMemo(() => {
    return workers.filter((w) => w.status === 'active');
  }, [workers]);

  // Current Shop Status for selected date
  const currentShopStatus = useMemo(() => {
    return getShopStatusForDate(selectedDate);
  }, [selectedDate, shopStatuses, getShopStatusForDate]);

  // Is selected date in the future?
  const isSelectedDateInFuture = selectedDate > today;

  // Daily Wage Calculation & Counts for selected date
  const dailyWages = useMemo(() => {
    return calculateDailyWages(selectedDate);
  }, [selectedDate, workers, attendance, shopStatuses, calculateDailyWages]);

  // Calculation Boundary Analysis for Selected Month (Requirement 2 & 4)
  const monthBoundary = useMemo(() => {
    const todayDay = parseInt(today.split('-')[2], 10);
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);
    const totalDaysInMonth = new Date(year, monthNum, 0).getDate();

    let calculationEndDay = totalDaysInMonth;
    let isFutureMonth = false;
    let isCurrentMonth = false;

    if (selectedMonth > currentMonth) {
      calculationEndDay = 0;
      isFutureMonth = true;
    } else if (selectedMonth === currentMonth) {
      calculationEndDay = Math.min(todayDay, totalDaysInMonth);
      isCurrentMonth = true;
    } else {
      calculationEndDay = totalDaysInMonth;
    }

    const calculationEndDate = calculationEndDay > 0
      ? `${year}-${String(monthNum).padStart(2, '0')}-${String(calculationEndDay).padStart(2, '0')}`
      : 'None';

    // Count open running days in period up to calculationEndDay
    let totalRunningDays = 0;
    for (let day = 1; day <= calculationEndDay; day++) {
      const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const st = getShopStatusForDate(dateStr);
      if (st.status === 'open') {
        totalRunningDays += 1;
      }
    }

    // Count paid & unpaid holidays in month
    let totalPaidHolidays = 0;
    let totalUnpaidHolidays = 0;
    let totalWeeklyOffs = 0;

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const st = getShopStatusForDate(dateStr);
      if (st.status === 'holiday') {
        if (st.isPaid) totalPaidHolidays += 1;
        else totalUnpaidHolidays += 1;
      } else if (st.status === 'weekly_off') {
        totalWeeklyOffs += 1;
      }
    }

    return {
      year,
      monthNum,
      totalDaysInMonth,
      calculationEndDay,
      calculationEndDate,
      isFutureMonth,
      isCurrentMonth,
      totalRunningDays,
      totalPaidHolidays,
      totalUnpaidHolidays,
      totalWeeklyOffs,
    };
  }, [selectedMonth, today, currentMonth, shopStatuses, getShopStatusForDate]);

  // Monthly Summaries for each worker (strictly up to calculationEndDay)
  const monthlySalarySummaries: WorkerSalarySummary[] = useMemo(() => {
    return workers.map((w) => calculateWorkerSalaryForMonth(w, selectedMonth));
  }, [workers, selectedMonth, attendance, shopStatuses, calculateWorkerSalaryForMonth]);

  // Overall Financial Aggregates for Top Summary Cards (Requirement 4)
  const teamTotals = useMemo(() => {
    let totalWorkerWagesUpToToday = 0;
    let totalAdvances = 0;
    let totalNetPayable = 0;
    let totalPaid = 0;
    let totalWorkerPayable = 0;

    monthlySalarySummaries.forEach((s) => {
      totalWorkerWagesUpToToday += s.grossSalaryEarned;
      totalAdvances += s.totalAdvances + s.totalDeductions;
      totalNetPayable += s.finalPayable;
      totalPaid += s.paidAmount;
      totalWorkerPayable += s.remainingPayable;
    });

    return {
      totalWorkerWagesUpToToday,
      totalAdvances,
      totalNetPayable,
      totalPaid,
      totalWorkerPayable,
    };
  }, [monthlySalarySummaries]);

  const displayedSalarySummaries = useMemo(() => {
    if (selectedWorkerFilter === 'all') {
      return monthlySalarySummaries;
    }
    return monthlySalarySummaries.filter((s) => s.worker.id === selectedWorkerFilter);
  }, [monthlySalarySummaries, selectedWorkerFilter]);

  // Date Navigation Helpers
  const handlePrevDay = () => {
    const parts = selectedDate.split('-');
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    d.setDate(d.getDate() - 1);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${yr}-${mo}-${day}`);
  };

  const handleNextDay = () => {
    const parts = selectedDate.split('-');
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    d.setDate(d.getDate() + 1);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${yr}-${mo}-${day}`);
  };

  const showToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  // Change Shop Status: Open, Shop Holiday, Weekly Off
  const handleChangeShopStatus = async (
    newStatus: ShopOperatingStatus,
    isPaid = true,
    holidayName?: string
  ) => {
    try {
      if (newStatus === 'open') {
        // Revert to normal open day (delete override)
        await deleteShopStatus(selectedDate);
        showToast(`Shop marked as Open for ${formatDisplayDate(selectedDate)}`);
      } else {
        await setShopStatus(selectedDate, newStatus, isPaid, holidayName);
        if (newStatus === 'holiday') {
          showToast(`Shop marked as Holiday (${isPaid ? 'Paid' : 'Unpaid'}) for ${formatDisplayDate(selectedDate)}`);
        } else {
          showToast(`Shop marked as Weekly Off for ${formatDisplayDate(selectedDate)}`);
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to update shop status');
    }
  };

  // 1-Tap Attendance status change for a worker
  const handleSetWorkerStatus = async (workerId: string, status: AttendanceStatus) => {
    if (isSelectedDateInFuture) {
      showToast('⚠️ Future date: Attendance cannot be recorded in advance.');
      return;
    }
    try {
      const mult = status === 'present' ? 1.0 : status === 'half_day' ? 0.5 : 0.0;
      await recordAttendance(workerId, selectedDate, status, undefined, mult);
      const worker = workers.find((w) => w.id === workerId);
      const label = status === 'present' ? 'Present (100%)' : status === 'half_day' ? 'Half Day (50%)' : 'Absent (0%)';
      showToast(`${worker?.name || 'Worker'} marked as ${label}`);
    } catch (err: any) {
      showToast(err?.message || 'Error recording status');
    }
  };

  // Revert all workers to present default on open day
  const handleConfirmResetDay = async () => {
    if (confirm(`Reset all attendance for ${formatDisplayDate(selectedDate)} to default Present (100%)?`)) {
      for (const w of activeWorkers) {
        await recordAttendance(w.id, selectedDate, 'present', undefined, 1.0);
      }
      showToast(`All workers set to Present for ${formatDisplayDate(selectedDate)}`);
    }
  };

  const handleExportCSV = () => {
    const mapped = monthlySalarySummaries.map((s) => ({
      workerName: s.worker.name,
      phone: s.worker.phone,
      wageType: s.worker.wageType,
      baseWage: s.baseWage,
      calendarDays: s.calendarDays,
      runningDaysWorked: s.runningDaysWorked,
      presentDays: s.presentDays,
      halfDays: s.halfDays,
      absentDays: s.absentDays,
      paidOffDays: s.paidOffDays,
      unpaidOffDays: s.unpaidOffDays,
      paidHolidays: s.paidHolidays,
      unpaidHolidays: s.unpaidHolidays,
      effectivePaidDays: s.effectivePaidDays,
      grossSalaryEarned: s.grossSalaryEarned,
      totalAdvances: s.totalAdvances,
      totalDeductions: s.totalDeductions,
      finalPayable: s.finalPayable,
      paidAmount: s.paidAmount,
      remainingPayable: s.remainingPayable,
    }));
    exportAttendanceMonthlyToCsv(mapped, selectedMonth);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-16 right-4 z-50 p-3.5 rounded-2xl bg-[#2B1810] text-amber-200 text-xs font-bold shadow-xl border border-amber-900/60 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{notificationMsg}</span>
          </div>
        </div>
      )}

      {/* Advance / Deduction Modal */}
      <RecordAdvanceModal
        isOpen={isAdvanceModalOpen}
        onClose={() => {
          setIsAdvanceModalOpen(false);
          setAdvanceTargetWorker(null);
        }}
        worker={advanceTargetWorker}
      />

      {/* Shop Holiday Management Modal (Requirement 3) */}
      <ManageHolidaysModal
        isOpen={isHolidaysModalOpen}
        onClose={() => setIsHolidaysModalOpen(false)}
        selectedMonth={selectedMonth}
        initialDate={holidayModalInitialDate || selectedDate}
      />

      {/* Worker Attendance Detail Breakdown Modal (Requirement 5) */}
      <WorkerAttendanceDetailModal
        isOpen={Boolean(detailModalSummary)}
        onClose={() => setDetailModalSummary(null)}
        summary={detailModalSummary}
      />

      {/* ============================================================ */}
      {/* PAGE HEADER: TITLE + ACTION BUTTONS */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#1E5E3A] text-white">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <h2 className="text-xl lg:text-2xl font-extrabold text-[#2B1810] dark:text-[#F3ECE1]">
              Attendance & Worker Wage Panel
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#7A533E] dark:text-[#A8907E] mt-1">
            Automated default attendance (Present), Half Days (50%), Shop Holidays & Prorated Wages up to today
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Manage Holidays Button */}
          <button
            type="button"
            onClick={() => {
              setHolidayModalInitialDate(selectedDate);
              setIsHolidaysModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-red-300 dark:border-red-900/60 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <CalendarOff className="w-4 h-4" />
            <span>Manage Holidays</span>
          </button>

          {/* Add Worker Button */}
          <button
            onClick={() => setIsAddWorkerOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1E5E3A] hover:bg-[#16492C] text-white text-xs font-bold shadow-md shadow-[#1E5E3A]/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Worker</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5 TOP SUMMARY CARDS (Requirement 4) & CALCULATION PERIOD BANNER */}
      {/* ============================================================ */}
      <div className="bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] p-5 shadow-xs space-y-4">
        {/* Calculation Period Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DFD3] dark:border-[#2C231B]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-[#854D0E] dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E]">
                Wage Calculation Period:
              </span>
              <div className="text-xs sm:text-sm font-extrabold text-[#2B1810] dark:text-[#F3ECE1]">
                {monthBoundary.isCurrentMonth ? (
                  <span>
                    1 {formatDisplayDate(`${selectedMonth}-01`)} – {formatDisplayDate(today)} ({today}) •{' '}
                    <span className="text-[#1E5E3A] dark:text-emerald-400 font-bold">
                      Strictly Up to Today (Days {monthBoundary.calculationEndDay + 1}–{monthBoundary.totalDaysInMonth} Excluded)
                    </span>
                  </span>
                ) : monthBoundary.isFutureMonth ? (
                  <span className="text-amber-700 dark:text-amber-400">
                    Future Month ({selectedMonth}) — 0 Running Days • No wages accrued in advance
                  </span>
                ) : (
                  <span>
                    Full Month ({selectedMonth}): 1st through {monthBoundary.totalDaysInMonth}th (Completed)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold text-[#7A533E] dark:text-[#A8907E]">Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] rounded-xl text-xs font-bold text-[#2B1810] dark:text-[#F3ECE1] outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* 5 Prominent Cards from Requirement 4:
            (1) Total Running Days
            (2) Total Worker Wages up to today
            (3) Total Paid Holidays
            (4) Total Unpaid Holidays
            (5) Total Worker Payable
        */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Card 1: Total Running Days */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#17120E] border border-[#E8DFD3] dark:border-[#2C231B] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E]">
                1. Running Days
              </span>
              <Store className="w-3.5 h-3.5 text-[#1E5E3A]" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-[#2B1810] dark:text-[#F3ECE1] mt-1">
              {monthBoundary.totalRunningDays}{' '}
              <span className="text-xs font-medium text-[#7A533E]">
                / {monthBoundary.calculationEndDay} days
              </span>
            </div>
            <p className="text-[10px] text-[#7A533E] dark:text-[#A8907E] mt-0.5">
              Open shop days up to today
            </p>
          </div>

          {/* Card 2: Total Worker Wages Up to Today */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                2. Wages Earned
              </span>
              <CreditCard className="w-3.5 h-3.5 text-[#1E5E3A]" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-[#1E5E3A] dark:text-emerald-400 mt-1">
              {formatRupee(teamTotals.totalWorkerWagesUpToToday)}
            </div>
            <p className="text-[10px] text-emerald-700/80 mt-0.5">
              Accumulated wages up to today
            </p>
          </div>

          {/* Card 3: Total Paid Holidays */}
          <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300">
                3. Paid Holidays
              </span>
              <CalendarOff className="w-3.5 h-3.5 text-purple-700" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-purple-700 dark:text-purple-300 mt-1">
              {monthBoundary.totalPaidHolidays}{' '}
              <span className="text-xs font-medium text-purple-600">days</span>
            </div>
            <p className="text-[10px] text-purple-700/80 mt-0.5">
              Paid festival / shop closures (100%)
            </p>
          </div>

          {/* Card 4: Total Unpaid Holidays */}
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-800 dark:text-red-300">
                4. Unpaid Holidays
              </span>
              <CalendarOff className="w-3.5 h-3.5 text-red-600" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-red-600 dark:text-red-400 mt-1">
              {monthBoundary.totalUnpaidHolidays}{' '}
              <span className="text-xs font-medium text-red-500">days</span>
            </div>
            <p className="text-[10px] text-red-600/80 mt-0.5">
              Unpaid shop closures (₹0 wage)
            </p>
          </div>

          {/* Card 5: Total Worker Payable */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 shadow-xs col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#854D0E] dark:text-amber-400">
                5. Total Payable
              </span>
              <HandCoins className="w-3.5 h-3.5 text-[#854D0E]" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-[#854D0E] dark:text-amber-400 mt-1">
              {formatRupee(teamTotals.totalWorkerPayable)}
            </div>
            <p className="text-[10px] text-[#854D0E] mt-0.5">
              Net balance due to workers
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SUB-NAVIGATION TABS */}
      {/* ============================================================ */}
      <div className="flex items-center p-1.5 bg-[#EFE8DD] dark:bg-[#251D17] rounded-2xl w-full sm:w-fit">
        <button
          onClick={() => setActiveSubTab('daily')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'daily'
              ? 'bg-[#1E5E3A] text-white shadow-md shadow-[#1E5E3A]/20'
              : 'text-[#4A2E1E] dark:text-[#D5C2B1] hover:bg-white/40'
          }`}
        >
          <CalendarCheck2 className="w-4 h-4" />
          <span>Daily Attendance</span>
        </button>

        <button
          onClick={() => setActiveSubTab('salary')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'salary'
              ? 'bg-[#854D0E] text-white shadow-md shadow-amber-900/20'
              : 'text-[#4A2E1E] dark:text-[#D5C2B1] hover:bg-white/40'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Worker Wages & Details</span>
        </button>

        <button
          onClick={() => setActiveSubTab('workers')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'workers'
              ? 'bg-[#3D2517] text-[#FAF7F2] shadow-md dark:bg-stone-200 dark:text-stone-900'
              : 'text-[#4A2E1E] dark:text-[#D5C2B1] hover:bg-white/40'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Workers List ({workers.length})</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 1. DAILY ATTENDANCE PANEL */}
      {/* ============================================================ */}
      {activeSubTab === 'daily' && (
        <div className="space-y-5">
          {/* DATE NAVIGATOR + PROMINENT SHOP STATUS SELECTOR */}
          <div className="bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] p-5 shadow-xs space-y-4">
            {/* Row 1: Date Navigator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DFD3] dark:border-[#2C231B]">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevDay}
                  className="p-2 rounded-xl bg-[#EFE8DD] dark:bg-[#251D17] text-[#4A2E1E] dark:text-[#D5C2B1] hover:bg-[#E2D6C6] transition-colors cursor-pointer"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] px-3.5 py-1.5 rounded-xl">
                  <Calendar className="w-4 h-4 text-[#1E5E3A] dark:text-emerald-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-xs sm:text-sm font-bold text-[#2B1810] dark:text-[#F3ECE1] bg-transparent outline-none cursor-pointer"
                  />
                </div>

                <button
                  onClick={handleNextDay}
                  className="p-2 rounded-xl bg-[#EFE8DD] dark:bg-[#251D17] text-[#4A2E1E] dark:text-[#D5C2B1] hover:bg-[#E2D6C6] transition-colors cursor-pointer"
                  title="Next Day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {selectedDate !== today && (
                  <button
                    onClick={() => setSelectedDate(today)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#1E5E3A] dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-950/40 cursor-pointer"
                  >
                    Today
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="text-xs font-medium text-[#7A533E] dark:text-[#A8907E]">
                  {formatFullDate(selectedDate)}
                </div>
                {isSelectedDateInFuture && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-[#854D0E] dark:bg-amber-950/70 dark:text-amber-300">
                    Future Date
                  </span>
                )}
              </div>
            </div>

            {/* Row 2: PROMINENT SHOP STATUS SELECTOR (Requirement 3: Open, Shop Holiday, Weekly Off) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E] flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-[#1E5E3A]" />
                  <span>Shop Status on {formatDisplayDate(selectedDate)}:</span>
                </span>
                {currentShopStatus.status === 'holiday' && (
                  <button
                    onClick={() => {
                      setHolidayModalInitialDate(selectedDate);
                      setIsHolidaysModalOpen(true);
                    }}
                    className="text-xs font-bold text-red-700 dark:text-red-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Holiday Config</span>
                  </button>
                )}
              </div>

              {/* 3 Prominent Selector Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. OPEN */}
                <button
                  type="button"
                  onClick={() => handleChangeShopStatus('open', true)}
                  className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                    currentShopStatus.status === 'open'
                      ? 'border-[#1E5E3A] bg-emerald-50 dark:bg-emerald-950/40 text-[#1E5E3A] dark:text-emerald-300 ring-2 ring-[#1E5E3A]/30 font-bold'
                      : 'border-[#E8DFD3] dark:border-[#2C231B] bg-white dark:bg-[#17120E] text-[#7A533E] hover:border-[#D8C7B5]'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${currentShopStatus.status === 'open' ? 'bg-[#1E5E3A] text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-extrabold flex items-center gap-1.5">
                      <span>🟢 Shop Open</span>
                      {currentShopStatus.status === 'open' && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1E5E3A] text-white font-bold">Active</span>
                      )}
                    </div>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      Normal working day (Workers default to Present)
                    </div>
                  </div>
                </button>

                {/* 2. SHOP HOLIDAY */}
                <button
                  type="button"
                  onClick={() => {
                    setHolidayModalInitialDate(selectedDate);
                    setIsHolidaysModalOpen(true);
                  }}
                  className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                    currentShopStatus.status === 'holiday'
                      ? 'border-red-600 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 ring-2 ring-red-500/30 font-bold'
                      : 'border-[#E8DFD3] dark:border-[#2C231B] bg-white dark:bg-[#17120E] text-[#7A533E] hover:border-[#D8C7B5]'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${currentShopStatus.status === 'holiday' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'}`}>
                    <CalendarOff className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-extrabold flex items-center gap-1.5">
                      <span>🔴 Shop Holiday</span>
                      {currentShopStatus.status === 'holiday' && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-600 text-white font-bold">
                          {currentShopStatus.isPaid ? 'Paid (100%)' : 'Unpaid (₹0)'}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      {currentShopStatus.status === 'holiday' && currentShopStatus.holidayName
                        ? currentShopStatus.holidayName
                        : 'Festival, closure, or holiday'}
                    </div>
                  </div>
                </button>

                {/* 3. WEEKLY OFF */}
                <button
                  type="button"
                  onClick={() => handleChangeShopStatus('weekly_off', true)}
                  className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                    currentShopStatus.status === 'weekly_off'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 ring-2 ring-blue-500/30 font-bold'
                      : 'border-[#E8DFD3] dark:border-[#2C231B] bg-white dark:bg-[#17120E] text-[#7A533E] hover:border-[#D8C7B5]'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${currentShopStatus.status === 'weekly_off' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}>
                    <Palmtree className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-extrabold flex items-center gap-1.5">
                      <span>🔵 Weekly Off</span>
                      {currentShopStatus.status === 'weekly_off' && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-600 text-white font-bold">Active</span>
                      )}
                    </div>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      Planned weekly shop closure
                    </div>
                  </div>
                </button>
              </div>

              {/* Holiday Banner if active on this day */}
              {currentShopStatus.status === 'holiday' && (
                <div className="mt-3 p-3.5 rounded-2xl bg-red-100/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-extrabold text-red-900 dark:text-red-200">
                      Shop Holiday: {currentShopStatus.holidayName || 'Festival Closure'}
                    </span>
                    <span className="ml-2 font-bold text-red-700 dark:text-red-300">
                      ({currentShopStatus.isPaid ? '🟢 Paid Holiday — 100% Wage Accrued' : '🔴 Unpaid Holiday — ₹0 Accrued'})
                    </span>
                    <p className="text-[11px] text-red-800 dark:text-red-400 mt-0.5">
                      Excluded from normal working days. Individual attendance marking not required.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setHolidayModalInitialDate(selectedDate);
                        setIsHolidaysModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#14100D] border border-red-300 text-red-800 dark:text-red-300 font-bold text-xs cursor-pointer"
                    >
                      Edit Rule
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChangeShopStatus('open', true)}
                      className="px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold text-xs cursor-pointer"
                    >
                      Revert to Open
                    </button>
                  </div>
                </div>
              )}

              {/* Weekly Off Banner */}
              {currentShopStatus.status === 'weekly_off' && (
                <div className="mt-3 p-3.5 rounded-2xl bg-blue-100/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900 dark:text-blue-200">
                  <div className="flex items-center gap-2">
                    <Palmtree className="w-4 h-4 text-blue-700 shrink-0" />
                    <span>
                      Shop is closed for <strong>Weekly Off</strong>. Excluded from running days. Paid per individual worker policy ({workers.filter(w => w.offDayPaid).length} configured for Paid Offs).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChangeShopStatus('open', true)}
                    className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs cursor-pointer shrink-0"
                  >
                    Revert to Open Day
                  </button>
                </div>
              )}
            </div>

            {/* Row 3: DAILY FINANCIAL ACCRUAL COUNTERS */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-[#E8DFD3] dark:border-[#2C231B]">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Today's Total Wages
                </span>
                <div className="text-xl font-extrabold text-[#1E5E3A] dark:text-emerald-400 mt-0.5">
                  {formatRupee(dailyWages.totalWages)}
                </div>
                <span className="text-[10px] text-emerald-700/80">Accrued worker pay</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#17120E] border border-[#E8DFD3] dark:border-[#2C231B]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E5E3A]">
                  🟢 Present (100%)
                </span>
                <div className="text-xl font-extrabold text-[#1E5E3A] mt-0.5">
                  {dailyWages.presentCount}
                </div>
                <span className="text-[10px] text-[#7A533E]">Full day worked</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#854D0E] dark:text-amber-400">
                  🟡 Half Day (50%)
                </span>
                <div className="text-xl font-extrabold text-[#854D0E] dark:text-amber-400 mt-0.5">
                  {dailyWages.halfDayCount}
                </div>
                <span className="text-[10px] text-amber-700">Half day wage</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                  🔴 Absent (0%)
                </span>
                <div className="text-xl font-extrabold text-red-600 dark:text-red-400 mt-0.5">
                  {dailyWages.absentCount}
                </div>
                <span className="text-[10px] text-red-700">Zero wage</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                  Off / Holiday
                </span>
                <div className="text-xl font-extrabold text-stone-700 dark:text-stone-300 mt-0.5">
                  {dailyWages.offCount}
                </div>
                <span className="text-[10px] text-stone-500">Planned closure</span>
              </div>
            </div>
          </div>

          {/* FUTURE DATE WARNING OR DEFAULT ATTENDANCE HELPER BANNER (Requirement 1 & 2) */}
          {isSelectedDateInFuture ? (
            <div className="p-3.5 rounded-2xl bg-amber-100/60 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/60 flex items-center gap-2.5 text-xs text-[#854D0E] dark:text-amber-300 font-medium">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-700" />
              <span>
                <strong>Future Date Selected:</strong> Attendance and wages cannot be accrued in advance. Wages will be calculated only when this date arrives.
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-[#EFE8DD] dark:bg-[#221A15] border border-[#E0D5C7] dark:border-[#382E26] flex items-center justify-between text-xs text-[#4A2E1E] dark:text-[#D5C2B1]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1E5E3A] dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>Automatic Present Active:</strong> Every worker is automatically marked <strong>Present (100%)</strong> on normal working days. Only tap <strong>Half Day (50%)</strong> or <strong>Absent (0%)</strong> when someone is on leave.
                </span>
              </div>

              {currentShopStatus.status === 'open' && (
                <button
                  type="button"
                  onClick={handleConfirmResetDay}
                  className="text-xs font-bold text-[#1E5E3A] dark:text-emerald-400 hover:underline shrink-0 ml-2 cursor-pointer"
                >
                  Mark All Present
                </button>
              )}
            </div>
          )}

          {/* WORKERS DAILY ATTENDANCE CARD LIST */}
          <div className="space-y-3">
            {activeWorkers.length === 0 ? (
              <div className="bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] p-12 text-center">
                <Users className="w-12 h-12 mx-auto text-[#7A533E] mb-3" />
                <h3 className="text-base font-bold text-[#2B1810] dark:text-[#F3ECE1]">
                  No active workers registered yet
                </h3>
                <p className="text-xs text-[#7A533E] mt-1 max-w-sm mx-auto">
                  Add chai masters and staff members to start automated daily attendance and wage calculations.
                </p>
                <button
                  onClick={() => setIsAddWorkerOpen(true)}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-[#1E5E3A] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  + Add First Worker
                </button>
              </div>
            ) : (
              activeWorkers.map((worker) => {
                const eff = getEffectiveAttendanceForWorker(worker, selectedDate);
                const isShopClosed = currentShopStatus.status !== 'open';

                return (
                  <div
                    key={worker.id}
                    className="bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] p-4 sm:p-5 shadow-xs hover:border-[#D8C7B5] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Worker Info */}
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 ${
                          eff.status === 'present'
                            ? 'bg-emerald-100 text-[#1E5E3A] dark:bg-emerald-950/70 dark:text-emerald-300'
                            : eff.status === 'half_day'
                            ? 'bg-amber-100 text-[#854D0E] dark:bg-amber-950/70 dark:text-amber-300'
                            : eff.status === 'absent'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {worker.name.charAt(0)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm sm:text-base font-bold text-[#2B1810] dark:text-[#F3ECE1]">
                            {worker.name}
                          </h4>
                          {eff.isDefault && currentShopStatus.status === 'open' && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100/60 dark:bg-emerald-950/40 text-[#1E5E3A] dark:text-emerald-400">
                              Default: Present (100%)
                            </span>
                          )}
                          {!eff.isDefault && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EAE1D5] dark:bg-[#2A221C] text-[#4A2E1E] dark:text-[#C5B3A2]">
                              Recorded
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-[#7A533E] dark:text-[#A8907E] flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="font-semibold text-[#1E5E3A] dark:text-emerald-400">
                            Base: {worker.wageType === 'daily' ? `₹${worker.wageAmount}/day` : `₹${worker.wageAmount}/mo`}
                          </span>
                          <span>•</span>
                          <span className="font-bold text-[#2B1810] dark:text-[#F3ECE1]">
                            Earned Today: {isSelectedDateInFuture ? '₹0 (Future)' : `${formatRupee(eff.wageEarned)} (${Math.round(eff.multiplier * 100)}%)`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* THREE ATTENDANCE BUTTONS (Requirement 1 & 2): Present (100%), Half Day (50%), Absent (0%) */}
                    {isShopClosed ? (
                      <div className="px-4 py-2 rounded-xl bg-[#EFE8DD] dark:bg-[#251D17] text-xs font-bold text-[#7A533E] dark:text-[#A8907E] text-center">
                        {eff.notes || (currentShopStatus.status === 'holiday' ? 'Shop Holiday' : 'Weekly Off')}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 self-stretch md:self-auto">
                        {/* 1. PRESENT (100% Wage) */}
                        <button
                          type="button"
                          disabled={isSelectedDateInFuture}
                          onClick={() => handleSetWorkerStatus(worker.id, 'present')}
                          className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            eff.status === 'present'
                              ? 'bg-[#1E5E3A] text-white shadow-md shadow-[#1E5E3A]/30 scale-102 ring-2 ring-[#1E5E3A]/50'
                              : 'bg-emerald-50 dark:bg-emerald-950/30 text-[#1E5E3A] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
                          }`}
                        >
                          <span className="text-sm">🟢</span>
                          <span>Present (100%)</span>
                        </button>

                        {/* 2. HALF DAY (50% Wage) */}
                        <button
                          type="button"
                          disabled={isSelectedDateInFuture}
                          onClick={() => handleSetWorkerStatus(worker.id, 'half_day')}
                          className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            eff.status === 'half_day'
                              ? 'bg-[#854D0E] text-white shadow-md shadow-amber-900/30 scale-102 ring-2 ring-amber-600/50'
                              : 'bg-amber-50 dark:bg-amber-950/30 text-[#854D0E] dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100'
                          }`}
                        >
                          <span className="text-sm">🟡</span>
                          <span>Half Day (50%)</span>
                        </button>

                        {/* 3. ABSENT (0% Wage) */}
                        <button
                          type="button"
                          disabled={isSelectedDateInFuture}
                          onClick={() => handleSetWorkerStatus(worker.id, 'absent')}
                          className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            eff.status === 'absent'
                              ? 'bg-red-600 text-white shadow-md shadow-red-600/30 scale-102 ring-2 ring-red-500/50'
                              : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60 hover:bg-red-100'
                          }`}
                        >
                          <span className="text-sm">🔴</span>
                          <span>Absent (0%)</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. MONTHLY WORKER WAGES & INDIVIDUAL SUMMARIES (Requirement 5) */}
      {/* ============================================================ */}
      {activeSubTab === 'salary' && (
        <div className="space-y-6">
          {/* Controls Bar: Worker Filter & Export CSV */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#FAF7F2] dark:bg-[#1C1612] rounded-2xl border border-[#E8DFD3] dark:border-[#2C231B]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#7A533E] dark:text-[#A8907E]">Filter Worker:</span>
              <select
                value={selectedWorkerFilter}
                onChange={(e) => setSelectedWorkerFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[#D8C7B5] dark:border-[#382E26] bg-white dark:bg-[#14100D] text-xs font-bold text-[#2B1810] dark:text-[#F3ECE1] outline-none"
              >
                <option value="all">All Workers ({monthlySalarySummaries.length})</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.wageType === 'daily' ? `₹${w.wageAmount}/day` : `₹${w.wageAmount}/mo`})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D8C7B5] dark:border-[#382E26] bg-white dark:bg-[#14100D] text-xs font-semibold text-[#4A2E1E] dark:text-[#D5C2B1] hover:bg-[#EAE1D5] transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Download className="w-4 h-4 text-[#1E5E3A]" />
              <span>Export Salary Report CSV</span>
            </button>
          </div>

          {/* INDIVIDUAL WORKER WAGE CARDS (Requirement 5) */}
          <div className="space-y-4">
            {displayedSalarySummaries.map((summary) => {
              const { worker } = summary;

              return (
                <div
                  key={worker.id}
                  className="bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] p-5 lg:p-6 shadow-xs space-y-4"
                >
                  {/* Worker Card Top Row: Name, Salary Structure, Status & Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DFD3] dark:border-[#2C231B]">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#EFE8DD] dark:bg-[#251D17] text-[#1E5E3A] dark:text-emerald-400 flex items-center justify-center font-extrabold text-lg">
                        {worker.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-[#2B1810] dark:text-[#F3ECE1]">
                            {worker.name}
                          </h4>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              summary.isSettled
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200'
                                : summary.remainingPayable === 0
                                ? 'bg-stone-200 text-stone-700'
                                : 'bg-amber-100 text-[#854D0E] dark:bg-amber-950/80 dark:text-amber-200'
                            }`}
                          >
                            {summary.isSettled ? 'Settled & Paid' : `Balance Due: ${formatRupee(summary.remainingPayable)}`}
                          </span>
                        </div>
                        <p className="text-xs text-[#7A533E] dark:text-[#A8907E]">
                          {worker.wageType === 'daily'
                            ? `Daily Wage: ₹${worker.wageAmount}/day`
                            : `Monthly Salary: ₹${worker.wageAmount}/month (${worker.prorationMethod})`}
                        </p>
                      </div>
                    </div>

                    {/* Actions: View Details Modal, Advance, Pay Salary */}
                    <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                      {/* VIEW DETAILS BUTTON (Requirement 5) */}
                      <button
                        type="button"
                        onClick={() => setDetailModalSummary(summary)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#1E5E3A] text-[#1E5E3A] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>

                      {/* Advance Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setAdvanceTargetWorker(worker);
                          setIsAdvanceModalOpen(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#D8C7B5] dark:border-[#382E26] bg-white dark:bg-[#14100D] text-xs font-bold text-[#4A2E1E] dark:text-[#D5C2B1] hover:bg-[#EAE1D5] cursor-pointer"
                      >
                        <HandCoins className="w-3.5 h-3.5 text-amber-700" />
                        <span>+ Advance</span>
                      </button>

                      {/* Record Salary Payment Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentWorkerTarget(worker);
                          setIsRecordPaymentOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#854D0E] hover:bg-[#713F12] text-white text-xs font-bold shadow-md shadow-amber-900/20 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Record Payment</span>
                      </button>
                    </div>
                  </div>

                  {/* Attendance Breakdown Grid Required by Item 5:
                      - Running days worked (present + 0.5 * half)
                      - Present days
                      - Half days
                      - Absences
                      - Paid holidays
                      - Unpaid holidays
                  */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
                    {/* 1. Running Days Worked */}
                    <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200">
                      <span className="text-[10px] font-bold text-[#1E5E3A] uppercase">
                        Running Days Worked
                      </span>
                      <div className="text-lg font-extrabold text-[#1E5E3A] dark:text-emerald-400">
                        {summary.runningDaysWorked}
                      </div>
                      <span className="text-[10px] text-emerald-800">Present + 0.5×Half</span>
                    </div>

                    {/* 2. Present Days (100%) */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#14100D] border border-[#E8DFD3] dark:border-[#2C231B]">
                      <span className="text-[10px] font-bold text-[#1E5E3A] uppercase">
                        Present (100%)
                      </span>
                      <div className="text-lg font-extrabold text-[#1E5E3A]">
                        {summary.presentDays}
                      </div>
                      <span className="text-[10px] text-[#7A533E]">Full days</span>
                    </div>

                    {/* 3. Half Days (50%) */}
                    <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200">
                      <span className="text-[10px] font-bold text-[#854D0E] uppercase">
                        Half Days (50%)
                      </span>
                      <div className="text-lg font-extrabold text-[#854D0E] dark:text-amber-400">
                        {summary.halfDays}
                      </div>
                      <span className="text-[10px] text-amber-800">Half shifts</span>
                    </div>

                    {/* 4. Absences */}
                    <div className="p-2.5 rounded-xl bg-red-50/80 dark:bg-red-950/30 border border-red-200">
                      <span className="text-[10px] font-bold text-red-800 uppercase">
                        Absences (0%)
                      </span>
                      <div className="text-lg font-extrabold text-red-600 dark:text-red-400">
                        {summary.absentDays}
                      </div>
                      <span className="text-[10px] text-red-700">Days missed</span>
                    </div>

                    {/* 5. Paid Holidays */}
                    <div className="p-2.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200">
                      <span className="text-[10px] font-bold text-purple-800 uppercase">
                        Paid Holidays
                      </span>
                      <div className="text-lg font-extrabold text-purple-700">
                        {summary.paidHolidays}
                      </div>
                      <span className="text-[10px] text-purple-700">100% pay</span>
                    </div>

                    {/* 6. Unpaid Holidays & Offs */}
                    <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200">
                      <span className="text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase">
                        Unpaid Closures
                      </span>
                      <div className="text-lg font-extrabold text-stone-700 dark:text-stone-300">
                        {summary.unpaidHolidays + summary.unpaidOffDays}
                      </div>
                      <span className="text-[10px] text-stone-500">₹0 pay</span>
                    </div>
                  </div>

                  {/* Financial Computation Breakdown (Requirement 5):
                      - Earned amount up to today
                      - Total advances / deductions
                      - Amount already paid
                      - Remaining payable balance
                  */}
                  <div className="p-3.5 rounded-2xl bg-[#EFE8DD] dark:bg-[#251D17] border border-[#E0D5C7] dark:border-[#382E26] space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#4A2E1E] dark:text-[#D5C2B1]">
                      <span>
                        Earned Amount Up to Today ({summary.effectivePaidDays} effective eligible days):
                      </span>
                      <span className="font-bold text-[#1E5E3A] dark:text-emerald-400">
                        {formatRupee(summary.grossSalaryEarned)}
                      </span>
                    </div>

                    {(summary.totalAdvances > 0 || summary.totalDeductions > 0) && (
                      <div className="flex justify-between text-red-700 dark:text-red-400">
                        <span>Less Advances & Deductions Taken:</span>
                        <span className="font-bold">
                          -{formatRupee(summary.totalAdvances + summary.totalDeductions)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-[#2B1810] dark:text-[#F3ECE1] font-bold pt-1 border-t border-[#D8C7B5]">
                      <span>Net Earned Wages:</span>
                      <span>{formatRupee(summary.finalPayable)}</span>
                    </div>

                    {summary.paidAmount > 0 && (
                      <div className="flex justify-between text-blue-700 dark:text-blue-400">
                        <span>Amount Already Paid (Recorded in Expenses):</span>
                        <span className="font-bold">{formatRupee(summary.paidAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm font-extrabold text-[#854D0E] dark:text-amber-400 pt-1 border-t border-[#D8C7B5]">
                      <span>Remaining Payable Balance:</span>
                      <span className="text-base">{formatRupee(summary.remainingPayable)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. WORKERS LIST VIEW */}
      {/* ============================================================ */}
      {activeSubTab === 'workers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E]">
              All Registered Workers ({workers.length})
            </span>
            <button
              onClick={() => setIsAddWorkerOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#1E5E3A] text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              + Add Worker
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workers.map((worker) => (
              <div
                key={worker.id}
                className="p-5 rounded-3xl bg-[#FAF7F2] dark:bg-[#1C1612] border border-[#E8DFD3] dark:border-[#2C231B] shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-[#2B1810] dark:text-[#F3ECE1]">
                        {worker.name}
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          worker.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
                            : 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-400'
                        }`}
                      >
                        {worker.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {worker.phone && (
                      <p className="text-xs text-[#7A533E] dark:text-[#A8907E] font-mono mt-0.5">
                        📞 {worker.phone}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setEditingWorker(worker)}
                    className="p-1.5 rounded-lg text-[#7A533E] hover:bg-[#EFE8DD] dark:hover:bg-[#251D17] transition-colors cursor-pointer"
                    title="Edit Worker Profile"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-[#EFE8DD] dark:bg-[#251D17] text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#7A533E]">Salary Structure:</span>
                    <span className="font-bold text-[#1E5E3A] dark:text-emerald-400">
                      {worker.wageType === 'daily'
                        ? `₹${worker.wageAmount}/day (Daily Wage)`
                        : `₹${worker.wageAmount}/month (Monthly Salary)`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7A533E]">Off Day Policy:</span>
                    <span className="font-semibold">
                      {worker.offDayPaid ? 'Paid Off Days' : 'Unpaid Off Days'}
                    </span>
                  </div>
                  {worker.joiningDate && (
                    <div className="flex justify-between">
                      <span className="text-[#7A533E]">Joined On:</span>
                      <span>{worker.joiningDate}</span>
                    </div>
                  )}
                  {worker.notes && (
                    <div className="pt-1 text-[11px] text-[#7A533E] border-t border-[#D8C7B5]/60">
                      Note: {worker.notes}
                    </div>
                  )}
                </div>

                {/* Actions: Toggle Active Status */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#7A533E] dark:text-[#A8907E]">
                    {worker.status === 'active'
                      ? 'Participates in daily check-ins'
                      : 'Deactivated (past records preserved)'}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      updateWorker(worker.id, {
                        status: worker.status === 'active' ? 'inactive' : 'active',
                      })
                    }
                    className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      worker.status === 'active'
                        ? 'text-red-700 bg-red-100/60 hover:bg-red-100'
                        : 'text-emerald-700 bg-emerald-100/60 hover:bg-emerald-100'
                    }`}
                  >
                    {worker.status === 'active' ? 'Deactivate Worker' : 'Reactivate Worker'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
