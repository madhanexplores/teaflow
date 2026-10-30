import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupee, getTodayDateString } from '../../utils/dateUtils';
import { X, Check, IndianRupee, CreditCard, Receipt, AlertCircle, Sparkles } from 'lucide-react';

export const RecordSalaryPaymentModal: React.FC = () => {
  const {
    isRecordPaymentOpen,
    setIsRecordPaymentOpen,
    paymentWorkerTarget,
    setPaymentWorkerTarget,
    workers,
    calculateWorkerSalaryForMonth,
    recordSalaryPayment,
  } = useApp();

  const currentMonth = getTodayDateString().substring(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [workerId, setWorkerId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(getTodayDateString());
  const [notes, setNotes] = useState<string>('Paid in full via cash / UPI');
  const [syncToExpenses, setSyncToExpenses] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (paymentWorkerTarget) {
      setWorkerId(paymentWorkerTarget.id);
    } else if (workers.length > 0 && !workerId) {
      setWorkerId(workers[0].id);
    }
  }, [paymentWorkerTarget, workers]);

  const activeWorker = workers.find((w) => w.id === workerId);

  // Compute salary summary for selected worker & month
  const salarySummary = React.useMemo(() => {
    if (!activeWorker) return null;
    return calculateWorkerSalaryForMonth(activeWorker, selectedMonth);
  }, [activeWorker, selectedMonth, calculateWorkerSalaryForMonth]);

  // Pre-fill amount when worker or month changes
  useEffect(() => {
    if (salarySummary) {
      setAmount(String(salarySummary.remainingPayable || salarySummary.finalPayable || 0));
    }
  }, [salarySummary]);

  if (!isRecordPaymentOpen) return null;

  const handleClose = () => {
    setIsRecordPaymentOpen(false);
    setPaymentWorkerTarget(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerId) {
      setError('Please select a worker');
      return;
    }
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid payment amount greater than ₹0');
      return;
    }
    if (!paymentDate) {
      setError('Please choose payment date');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await recordSalaryPayment(workerId, selectedMonth, num, paymentDate, notes, syncToExpenses);
      handleClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record salary payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DFD3] dark:border-[#2C231B] bg-[#F4EDE2] dark:bg-[#231B15] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#854D0E] text-white">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#2B1810] dark:text-[#F3ECE1]">
                Record Worker Salary Payment
              </h3>
              <p className="text-xs text-[#7A533E] dark:text-[#A8907E]">
                Settle wages & optionally record into shop expenses
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-[#7A533E] dark:text-[#A8907E] hover:bg-[#EAE1D5] dark:hover:bg-[#2C231B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Worker Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E] mb-1">
              Select Worker <span className="text-red-500">*</span>
            </label>
            <select
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-[#14100D] border-2 border-[#D8C7B5] dark:border-[#382E26] focus:border-[#854D0E] rounded-xl text-sm font-bold text-[#2B1810] dark:text-[#F3ECE1] outline-none cursor-pointer"
              required
            >
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.wageType === 'daily' ? `₹${w.wageAmount}/day` : `₹${w.wageAmount}/mo`})
                </option>
              ))}
            </select>
          </div>

          {/* Salary Month */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E] mb-1">
              Salary Month <span className="text-red-500">*</span>
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] rounded-xl text-xs font-semibold text-[#2B1810] dark:text-[#F3ECE1] outline-none"
              required
            />
          </div>

          {/* Salary Breakdown Summary Card */}
          {salarySummary && (
            <div className="p-4 rounded-2xl bg-[#EFE8DD] dark:bg-[#251D17] border border-[#E0D5C7] dark:border-[#382E26] space-y-2">
              <div className="flex justify-between text-xs text-[#7A533E] dark:text-[#A8907E]">
                <span>Present Days: <strong>{salarySummary.presentDays}</strong></span>
                <span>Paid Off Days: <strong>{salarySummary.paidOffDays}</strong></span>
                <span>Absents: <strong>{salarySummary.absentDays}</strong></span>
              </div>
              <div className="flex justify-between text-xs text-[#7A533E] dark:text-[#A8907E] pt-1 border-t border-[#D8C7B5]/60 dark:border-[#382E26]">
                <span>Gross Earned:</span>
                <span className="font-bold text-[#1E5E3A] dark:text-emerald-400">
                  {formatRupee(salarySummary.grossSalaryEarned)}
                </span>
              </div>
              {(salarySummary.totalAdvances > 0 || salarySummary.totalDeductions > 0) && (
                <div className="flex justify-between text-xs text-red-700 dark:text-red-400">
                  <span>Less Advances / Deductions:</span>
                  <span className="font-bold">
                    -{formatRupee(salarySummary.totalAdvances + salarySummary.totalDeductions)}
                  </span>
                </div>
              )}
              {salarySummary.paidAmount > 0 && (
                <div className="flex justify-between text-xs text-blue-700 dark:text-blue-400">
                  <span>Already Paid This Month:</span>
                  <span className="font-bold">{formatRupee(salarySummary.paidAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-[#2B1810] dark:text-[#F3ECE1] pt-1.5 border-t border-[#D8C7B5] dark:border-[#382E26]">
                <span>Remaining Net Payable:</span>
                <span className="text-[#854D0E] dark:text-amber-400 text-base">
                  {formatRupee(salarySummary.remainingPayable)}
                </span>
              </div>
            </div>
          )}

          {/* Amount to Pay */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E] mb-1">
              Payment Amount to Settle (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-lg font-bold text-[#854D0E] dark:text-amber-400">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#14100D] border-2 border-[#D8C7B5] dark:border-[#382E26] focus:border-[#854D0E] rounded-xl text-lg font-extrabold text-[#2B1810] dark:text-[#F3ECE1] outline-none"
                required
              />
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E] mb-1">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] rounded-xl text-xs text-[#2B1810] dark:text-[#F3ECE1] outline-none"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E] mb-1">
              Payment Method / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Paid cash from counter, UPI transaction ID"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] rounded-xl text-xs text-[#2B1810] dark:text-[#F3ECE1] outline-none"
            />
          </div>

          {/* Requirement 8 Integration: Record as Business Expense */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={syncToExpenses}
                onChange={(e) => setSyncToExpenses(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#854D0E] accent-[#854D0E] cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-[#2B1810] dark:text-[#F3ECE1] block">
                  Record Salary Payment as Business Expense
                </span>
                <span className="text-[#7A533E] dark:text-[#A8907E]">
                  Automatically adds this payment under "Staff salary" in expenses. Calculated unpaid wages remain payable and are NOT added to expenses until confirmed here.
                </span>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8DFD3] dark:border-[#2C231B]">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2 rounded-xl border border-[#D8C7B5] dark:border-[#382E26] text-xs font-bold text-[#4A2E1E] dark:text-[#D5C2B1] hover:bg-[#EAE1D5] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-[#854D0E] hover:bg-[#713F12] text-white text-xs font-bold shadow-md shadow-amber-900/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : 'Confirm Salary Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
