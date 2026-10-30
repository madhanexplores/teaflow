import React from 'react';
import { useApp } from '../../context/AppContext';
import { WorkerSalarySummary } from '../../types';
import { formatRupee, getTodayDateString } from '../../utils/dateUtils';
import { X, Calendar, CheckCircle, AlertCircle, Sun, Palmtree, CalendarOff, Clock } from 'lucide-react';

interface WorkerAttendanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: WorkerSalarySummary | null;
}

export const WorkerAttendanceDetailModal: React.FC<WorkerAttendanceDetailModalProps> = ({
  isOpen,
  onClose,
  summary,
}) => {
  const { getShopStatusForDate, attendance } = useApp();

  if (!isOpen || !summary) return null;

  const { worker, month, calculationEndDay } = summary;
  const today = getTodayDateString();

  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);
  const totalDaysInMonth = new Date(year, monthNum, 0).getDate();

  // Daily rate for calculation reference
  const perDayRate = worker.wageType === 'daily'
    ? worker.wageAmount
    : Math.round(worker.wageAmount / (worker.prorationMethod === 'working_26' ? 26 : worker.prorationMethod === 'fixed_30' ? 30 : totalDaysInMonth));

  // Generate day-by-day items from 1 to totalDaysInMonth
  const daysList = [];
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const d = new Date(year, monthNum - 1, day);
    const dayOfWeek = d.toLocaleDateString('en-IN', { weekday: 'short' });
    const isFuture = day > calculationEndDay;

    const shopStat = getShopStatusForDate(dateStr);
    const recId = `${worker.id}_${dateStr}`;
    const rec = attendance.find((a) => a.id === recId);

    let statusLabel = '';
    let statusType: 'present' | 'half_day' | 'absent' | 'holiday' | 'weekly_off' | 'future' = 'present';
    let multiplier = 0;
    let earned = 0;
    let badgeClass = '';

    if (isFuture) {
      statusType = 'future';
      statusLabel = 'Future Date — Not Counted';
      multiplier = 0;
      earned = 0;
      badgeClass = 'bg-stone-100 text-stone-500 dark:bg-stone-900 dark:text-stone-400 border border-stone-200 dark:border-stone-800';
    } else if (shopStat.status === 'holiday') {
      statusType = 'holiday';
      multiplier = shopStat.isPaid ? 1.0 : 0.0;
      earned = Math.round(perDayRate * multiplier);
      statusLabel = `Shop Holiday: ${shopStat.holidayName || 'Festival'} (${shopStat.isPaid ? 'Paid 100%' : 'Unpaid 0%'})`;
      badgeClass = shopStat.isPaid
        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300'
        : 'bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300';
    } else if (shopStat.status === 'weekly_off') {
      statusType = 'weekly_off';
      const isPaid = worker.offDayPaid || shopStat.isPaid;
      multiplier = isPaid ? 1.0 : 0.0;
      earned = Math.round(perDayRate * multiplier);
      statusLabel = `Weekly Off (${isPaid ? 'Paid' : 'Unpaid'})`;
      badgeClass = 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300';
    } else {
      // Normal open working day
      if (rec) {
        if (rec.status === 'present') {
          statusType = 'present';
          multiplier = rec.wageMultiplier ?? 1.0;
          earned = Math.round(perDayRate * multiplier);
          statusLabel = '🟢 Present (100%)';
          badgeClass = 'bg-emerald-100 text-[#1E5E3A] dark:bg-emerald-950/70 dark:text-emerald-300';
        } else if (rec.status === 'half_day') {
          statusType = 'half_day';
          multiplier = rec.wageMultiplier ?? 0.5;
          earned = Math.round(perDayRate * multiplier);
          statusLabel = '🟡 Half Day (50%)';
          badgeClass = 'bg-amber-100 text-[#854D0E] dark:bg-amber-950/70 dark:text-amber-300';
        } else if (rec.status === 'absent') {
          statusType = 'absent';
          multiplier = 0.0;
          earned = 0;
          statusLabel = '🔴 Absent (0%)';
          badgeClass = 'bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300';
        } else if (rec.status === 'off') {
          const isPaid = worker.offDayPaid;
          multiplier = isPaid ? 1.0 : 0.0;
          earned = Math.round(perDayRate * multiplier);
          statusLabel = `Off Day (${isPaid ? 'Paid' : 'Unpaid'})`;
          badgeClass = 'bg-stone-200 text-stone-700';
        }
      } else {
        // Automatic default present
        statusType = 'present';
        multiplier = 1.0;
        earned = perDayRate;
        statusLabel = '🟢 Present (100% Default)';
        badgeClass = 'bg-emerald-50 text-[#1E5E3A] border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300';
      }
    }

    daysList.push({
      day,
      dateStr,
      dayOfWeek,
      isFuture,
      isToday: dateStr === today,
      statusLabel,
      statusType,
      multiplier,
      earned,
      badgeClass,
      notes: rec?.notes,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E8DFD3] dark:border-[#2C231B]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#1E5E3A] text-white flex items-center justify-center font-extrabold text-lg">
              {worker.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#2B1810] dark:text-[#F3ECE1]">
                  {worker.name} — Daily Breakdown
                </h3>
              </div>
              <p className="text-xs text-[#7A533E] dark:text-[#A8907E]">
                {worker.wageType === 'daily'
                  ? `₹${worker.wageAmount}/day (Daily Wage)`
                  : `₹${worker.wageAmount}/month (Monthly Salary)`} • Month: {month}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#7A533E] hover:bg-[#EFE8DD] dark:hover:bg-[#251D17] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Calculation Period Banner */}
        <div className="px-5 py-3 bg-[#EFE8DD] dark:bg-[#251D17] border-b border-[#E0D5C7] dark:border-[#382E26] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-semibold text-[#4A2E1E] dark:text-[#D5C2B1]">
            <Clock className="w-4 h-4 text-[#854D0E] shrink-0" />
            <span>
              {summary.calculationEndDay > 0
                ? `Calculated up to: ${summary.calculationEndDate} (${summary.calculationEndDay} days evaluated)`
                : 'Future month: No days evaluated yet'}
            </span>
          </div>

          <span className="text-[11px] font-bold text-[#1E5E3A] dark:text-emerald-400">
            {summary.runningDaysWorked} Days Worked
          </span>
        </div>

        {/* Top Mini Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 border-b border-[#E8DFD3] dark:border-[#2C231B] bg-white dark:bg-[#14100D] text-xs">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-[#1E5E3A]">Gross Earned</span>
            <div className="text-base font-extrabold text-[#1E5E3A]">
              {formatRupee(summary.grossSalaryEarned)}
            </div>
            <span className="text-[10px] text-emerald-800">{summary.effectivePaidDays} paid days</span>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200">
            <span className="text-[10px] uppercase font-bold text-[#854D0E]">Advances / Ded.</span>
            <div className="text-base font-extrabold text-[#854D0E]">
              -{formatRupee(summary.totalAdvances + summary.totalDeductions)}
            </div>
            <span className="text-[10px] text-amber-800">Pre-paid / cuts</span>
          </div>

          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200">
            <span className="text-[10px] uppercase font-bold text-blue-800">Already Paid</span>
            <div className="text-base font-extrabold text-blue-700">
              {formatRupee(summary.paidAmount)}
            </div>
            <span className="text-[10px] text-blue-800">Disbursed cash</span>
          </div>

          <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200">
            <span className="text-[10px] uppercase font-bold text-[#2B1810] dark:text-[#F3ECE1]">Balance Due</span>
            <div className="text-base font-extrabold text-[#854D0E] dark:text-amber-400">
              {formatRupee(summary.remainingPayable)}
            </div>
            <span className="text-[10px] text-stone-600 dark:text-stone-400">Payable up to today</span>
          </div>
        </div>

        {/* Scrollable Day-by-day Table */}
        <div className="p-4 overflow-y-auto flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E8DFD3] dark:border-[#2C231B] text-[10px] font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E]">
                <th className="py-2 px-2.5">Date</th>
                <th className="py-2 px-2.5">Day</th>
                <th className="py-2 px-2.5">Status</th>
                <th className="py-2 px-2.5 text-center">Multiplier</th>
                <th className="py-2 px-2.5 text-right">Wage Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DFD3]/60 dark:divide-[#2C231B]/60">
              {daysList.map((item) => (
                <tr
                  key={item.day}
                  className={`hover:bg-[#EFE8DD]/40 dark:hover:bg-[#251D17]/40 transition-colors ${
                    item.isToday ? 'bg-amber-100/40 dark:bg-amber-950/30' : ''
                  } ${item.isFuture ? 'opacity-60' : ''}`}
                >
                  <td className="py-2.5 px-2.5 font-bold text-[#2B1810] dark:text-[#F3ECE1]">
                    {String(item.day).padStart(2, '0')} {monthStr}
                    {item.isToday && (
                      <span className="ml-1.5 text-[9px] px-1.5 py-0.2 rounded bg-amber-500 text-white font-bold">
                        Today
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-2.5 text-[#7A533E] dark:text-[#A8907E]">
                    {item.dayOfWeek}
                  </td>
                  <td className="py-2.5 px-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${item.badgeClass}`}>
                      {item.statusLabel}
                    </span>
                    {item.notes && (
                      <span className="block text-[10px] text-[#7A533E] mt-0.5 italic">
                        {item.notes}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-2.5 text-center font-mono font-semibold text-[#2B1810] dark:text-[#F3ECE1]">
                    {item.isFuture ? '-' : `${item.multiplier}x`}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-extrabold text-[#1E5E3A] dark:text-emerald-400">
                    {item.isFuture ? '₹0' : formatRupee(item.earned)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E8DFD3] dark:border-[#2C231B] bg-[#FAF7F2] dark:bg-[#1C1612] flex items-center justify-between">
          <div className="text-xs text-[#7A533E] dark:text-[#A8907E]">
            Total Eligible Paid Days: <strong>{summary.effectivePaidDays}</strong> (Present: {summary.presentDays}, Half: {summary.halfDays}, Paid Holidays: {summary.paidHolidays}, Paid Offs: {summary.paidOffDays})
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#2B1810] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#2B1810] text-xs font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
