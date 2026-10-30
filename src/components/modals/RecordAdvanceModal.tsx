import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WorkerRecord } from '../../types';
import { getTodayDateString } from '../../utils/dateUtils';
import { X, Check, HandCoins, AlertCircle } from 'lucide-react';

interface RecordAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker?: WorkerRecord | null;
}

export const RecordAdvanceModal: React.FC<RecordAdvanceModalProps> = ({
  isOpen,
  onClose,
  worker,
}) => {
  const { workers, recordAdvanceOrDeduction } = useApp();

  const [workerId, setWorkerId] = useState(worker?.id || (workers[0]?.id || ''));
  const [type, setType] = useState<'advance' | 'deduction'>('advance');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (worker) {
      setWorkerId(worker.id);
    } else if (workers.length > 0 && !workerId) {
      setWorkerId(workers[0].id);
    }
  }, [worker, workers]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerId) {
      setError('Please select a worker');
      return;
    }
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await recordAdvanceOrDeduction(workerId, num, type, date, reason);
      setAmount('');
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DFD3] dark:border-[#2C231B] bg-[#F4EDE2] dark:bg-[#231B15]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#854D0E] text-white">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2B1810] dark:text-[#F3ECE1]">
                Record Advance or Deduction
              </h3>
              <p className="text-xs text-[#7A533E] dark:text-[#A8907E]">
                Adjusts monthly payable salary automatically
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#7A533E] dark:text-[#A8907E] hover:bg-[#EAE1D5] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-100 text-red-800 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#7A533E] dark:text-[#A8907E] mb-1">
              Worker
            </label>
            <select
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] rounded-xl text-xs font-semibold text-[#2B1810] dark:text-[#F3ECE1]"
              required
            >
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#7A533E] dark:text-[#A8907E] mb-1">
              Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('advance')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  type === 'advance'
                    ? 'border-[#854D0E] bg-amber-100/60 dark:bg-amber-950/40 text-[#854D0E] dark:text-amber-300'
                    : 'border-[#D8C7B5] dark:border-[#382E26] bg-white dark:bg-[#14100D] text-[#7A533E]'
                }`}
              >
                Salary Advance
              </button>
              <button
                type="button"
                onClick={() => setType('deduction')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  type === 'deduction'
                    ? 'border-red-600 bg-red-100/60 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                    : 'border-[#D8C7B5] dark:border-[#382E26] bg-white dark:bg-[#14100D] text-[#7A533E]'
                }`}
              >
                Deduction / Penalty
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#7A533E] dark:text-[#A8907E] mb-1">
              Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-bold text-[#4A2E1E] dark:text-[#D5C2B1]">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white dark:bg-[#14100D] border-2 border-[#D8C7B5] dark:border-[#382E26] rounded-xl text-base font-bold text-[#2B1810] dark:text-[#F3ECE1] outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#7A533E] dark:text-[#A8907E] mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] rounded-xl text-xs text-[#2B1810] dark:text-[#F3ECE1] outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#7A533E] dark:text-[#A8907E] mb-1">
              Reason (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Festival advance, Medical emergency, Broken teacups"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] rounded-xl text-xs text-[#2B1810] dark:text-[#F3ECE1] outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8DFD3] dark:border-[#2C231B]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#D8C7B5] text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#854D0E] hover:bg-[#713F12] text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : 'Record Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
