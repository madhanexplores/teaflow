import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getTodayDateString } from '../../utils/dateUtils';
import { X, Check, TrendingUp, IndianRupee } from 'lucide-react';

export const AddSaleModal: React.FC = () => {
  const { isAddSaleOpen, setIsAddSaleOpen, addSale } = useApp();
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAddSaleOpen) return null;

  const quickPillAmounts = [50, 100, 200, 500, 1000, 2000, 3500];
  const quickNotes = [
    "Today's total sales",
    'Counter Cash sales',
    'UPI & QR Payments',
    'Morning tea & snacks rush',
    'Evening tea & biscuits',
  ];

  const handleQuickAdd = (extra: number) => {
    const current = parseFloat(amount) || 0;
    setAmount(String(current + extra));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid sales amount greater than ₹0');
      return;
    }

    if (!date) {
      setError('Please select a valid date');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await addSale(numericAmount, date, note);
      // Reset form
      setAmount('');
      setNote('');
      setDate(getTodayDateString());
      setIsAddSaleOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to save sales record. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DFD3] dark:border-[#2C231B] bg-[#F4EDE2] dark:bg-[#231B15]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#1E5E3A] text-white">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#2B1810] dark:text-[#F3ECE1]">
                Record Sales
              </h3>
              <p className="text-xs text-[#7A533E] dark:text-[#A8907E]">
                Add today's counter cash, UPI, or total tea sales
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddSaleOpen(false)}
            className="p-1.5 rounded-full text-[#7A533E] dark:text-[#A8907E] hover:bg-[#EAE1D5] dark:hover:bg-[#2C231B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E] mb-1.5">
              Sales Amount (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-2xl font-bold text-[#1E5E3A] dark:text-emerald-400">
                ₹
              </div>
              <input
                type="number"
                step="any"
                min="0"
                autoFocus
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-[#14100D] border-2 border-[#D8C7B5] dark:border-[#382E26] focus:border-[#1E5E3A] dark:focus:border-emerald-500 rounded-2xl text-2xl font-extrabold text-[#2B1810] dark:text-[#F3ECE1] outline-none transition-all placeholder:text-[#B8A796]"
                required
              />
            </div>

            {/* Quick Add Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <span className="text-[11px] font-semibold text-[#7A533E] dark:text-[#A8907E] mr-1">
                Quick add:
              </span>
              {quickPillAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleQuickAdd(q)}
                  className="px-2.5 py-1 rounded-lg bg-[#EFE8DD] dark:bg-[#28201A] hover:bg-[#E2D6C6] dark:hover:bg-[#342A22] text-xs font-bold text-[#4A2E1E] dark:text-[#D5C2B1] transition-colors cursor-pointer"
                >
                  +{q}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount('')}
                className="px-2 py-1 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer ml-auto"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Date Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E] mb-1.5">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] focus:border-[#1E5E3A] rounded-xl text-sm font-medium text-[#2B1810] dark:text-[#F3ECE1] outline-none"
              required
            />
          </div>

          {/* Note Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E] mb-1.5">
              Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Today's total sales, UPI counter, Morning shift"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] focus:border-[#1E5E3A] rounded-xl text-sm text-[#2B1810] dark:text-[#F3ECE1] outline-none"
            />
            {/* Quick Note Suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickNotes.map((qn) => (
                <button
                  key={qn}
                  type="button"
                  onClick={() => setNote(qn)}
                  className="px-2 py-0.5 rounded-md bg-[#EAE1D5]/60 dark:bg-[#251D17] hover:bg-[#EAE1D5] text-[11px] text-[#4A2E1E] dark:text-[#C5B3A2] transition-colors cursor-pointer"
                >
                  {qn}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8DFD3] dark:border-[#2C231B]">
            <button
              type="button"
              onClick={() => setIsAddSaleOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-[#D8C7B5] dark:border-[#382E26] text-sm font-semibold text-[#4A2E1E] dark:text-[#D5C2B1] hover:bg-[#EAE1D5] dark:hover:bg-[#251D17] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1E5E3A] hover:bg-[#16492C] text-white text-sm font-bold shadow-md shadow-[#1E5E3A]/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Sales Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
