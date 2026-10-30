import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { WorkerRecord, WageType, ProrationMethod, WorkerStatus } from '../../types';
import { getTodayDateString } from '../../utils/dateUtils';
import { X, Check, Users, UserPlus, Phone, Calendar, IndianRupee, ShieldAlert, Sparkles } from 'lucide-react';

export const AddWorkerModal: React.FC = () => {
  const {
    isAddWorkerOpen,
    setIsAddWorkerOpen,
    editingWorker,
    setEditingWorker,
    addWorker,
    updateWorker,
  } = useApp();

  const isOpen = isAddWorkerOpen || !!editingWorker;
  const isEditing = !!editingWorker;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [wageType, setWageType] = useState<WageType>('daily');
  const [wageAmount, setWageAmount] = useState('');
  const [offDayPaid, setOffDayPaid] = useState(false);
  const [prorationMethod, setProrationMethod] = useState<ProrationMethod>('calendar_days');
  const [joiningDate, setJoiningDate] = useState(getTodayDateString());
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<WorkerStatus>('active');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingWorker) {
      setName(editingWorker.name);
      setPhone(editingWorker.phone || '');
      setWageType(editingWorker.wageType);
      setWageAmount(String(editingWorker.wageAmount));
      setOffDayPaid(editingWorker.offDayPaid);
      setProrationMethod(editingWorker.prorationMethod || 'calendar_days');
      setJoiningDate(editingWorker.joiningDate || getTodayDateString());
      setNotes(editingWorker.notes || '');
      setStatus(editingWorker.status);
      setError(null);
    } else {
      setName('');
      setPhone('');
      setWageType('daily');
      setWageAmount('');
      setOffDayPaid(false);
      setProrationMethod('calendar_days');
      setJoiningDate(getTodayDateString());
      setNotes('');
      setStatus('active');
      setError(null);
    }
  }, [editingWorker, isAddWorkerOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsAddWorkerOpen(false);
    setEditingWorker(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide worker name');
      return;
    }
    const num = parseFloat(wageAmount);
    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid wage or salary amount');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (isEditing && editingWorker) {
        await updateWorker(editingWorker.id, {
          name: name.trim(),
          phone: phone.trim() || undefined,
          wageType,
          wageAmount: num,
          offDayPaid,
          prorationMethod: wageType === 'monthly' ? prorationMethod : undefined,
          joiningDate,
          notes: notes.trim() || undefined,
          status,
        });
      } else {
        await addWorker({
          name: name.trim(),
          phone: phone.trim() || undefined,
          wageType,
          wageAmount: num,
          offDayPaid,
          prorationMethod: wageType === 'monthly' ? prorationMethod : undefined,
          joiningDate,
          notes: notes.trim() || undefined,
          status,
        });
      }
      handleClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save worker record');
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
            <div className="p-2 rounded-xl bg-[#1E5E3A] text-white">
              {isEditing ? <Users className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#2B1810] dark:text-[#F3ECE1]">
                {isEditing ? 'Edit Worker Profile' : 'Add New Tea Shop Worker'}
              </h3>
              <p className="text-xs text-[#7A533E] dark:text-[#A8907E]">
                Configure daily wage or monthly salary & off-day rules
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Worker Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E] mb-1">
              Worker Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Ramesh Kumar, Suresh (Chai Master)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-[#14100D] border-2 border-[#D8C7B5] dark:border-[#382E26] focus:border-[#1E5E3A] rounded-xl text-sm font-bold text-[#2B1810] dark:text-[#F3ECE1] outline-none"
              required
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E] mb-1">
              Phone Number (Optional)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3 text-[#7A533E]" />
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] focus:border-[#1E5E3A] rounded-xl text-sm text-[#2B1810] dark:text-[#F3ECE1] outline-none"
              />
            </div>
          </div>

          {/* Wage Type Selector (Daily vs Monthly) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E] mb-1.5">
              Salary / Wage Structure <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setWageType('daily')}
                className={`py-3 px-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  wageType === 'daily'
                    ? 'border-[#1E5E3A] bg-emerald-50 dark:bg-emerald-950/40 text-[#1E5E3A] dark:text-emerald-300 font-bold'
                    : 'border-[#D8C7B5] dark:border-[#382E26] bg-white dark:bg-[#14100D] text-[#7A533E]'
                }`}
              >
                <div className="text-sm font-extrabold">Daily Wage</div>
                <div className="text-[11px] opacity-80 mt-0.5">Paid per day worked</div>
              </button>

              <button
                type="button"
                onClick={() => setWageType('monthly')}
                className={`py-3 px-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  wageType === 'monthly'
                    ? 'border-[#1E5E3A] bg-emerald-50 dark:bg-emerald-950/40 text-[#1E5E3A] dark:text-emerald-300 font-bold'
                    : 'border-[#D8C7B5] dark:border-[#382E26] bg-white dark:bg-[#14100D] text-[#7A533E]'
                }`}
              >
                <div className="text-sm font-extrabold">Monthly Salary</div>
                <div className="text-[11px] opacity-80 mt-0.5">Fixed monthly pay</div>
              </button>
            </div>
          </div>

          {/* Wage Amount Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E] mb-1">
              {wageType === 'daily' ? 'Daily Wage Rate (₹ / Day)' : 'Base Monthly Salary (₹ / Month)'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-lg font-bold text-[#1E5E3A] dark:text-emerald-400">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="0"
                placeholder={wageType === 'daily' ? 'e.g. 600' : 'e.g. 15000'}
                value={wageAmount}
                onChange={(e) => setWageAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#14100D] border-2 border-[#D8C7B5] dark:border-[#382E26] focus:border-[#1E5E3A] rounded-xl text-lg font-extrabold text-[#2B1810] dark:text-[#F3ECE1] outline-none"
                required
              />
            </div>
          </div>

          {/* Off Day Policy (Paid or Unpaid) */}
          <div className="p-3.5 rounded-2xl bg-[#EFE8DD] dark:bg-[#251D17] border border-[#E0D5C7] dark:border-[#382E26]">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="offDayPaid"
                checked={offDayPaid}
                onChange={(e) => setOffDayPaid(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-[#1E5E3A] accent-[#1E5E3A] cursor-pointer"
              />
              <label htmlFor="offDayPaid" className="text-xs text-[#2B1810] dark:text-[#F3ECE1] cursor-pointer">
                <span className="font-bold block">Paid Weekly Off Day</span>
                <span className="text-[#7A533E] dark:text-[#A8907E]">
                  {offDayPaid
                    ? 'Worker receives standard wage for designated off days.'
                    : 'Off days are unpaid (no wage calculated for off days).'}
                </span>
              </label>
            </div>
          </div>

          {/* Monthly Proration Method (only shown for monthly workers) */}
          {wageType === 'monthly' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E] mb-1">
                Monthly Salary Divisor / Proration Method
              </label>
              <select
                value={prorationMethod}
                onChange={(e) => setProrationMethod(e.target.value as ProrationMethod)}
                className="w-full px-3 py-2 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] rounded-xl text-xs font-semibold text-[#2B1810] dark:text-[#F3ECE1] outline-none cursor-pointer"
              >
                <option value="calendar_days">Actual Calendar Days (28/30/31 days in month)</option>
                <option value="fixed_30">Fixed 30 Days (Salary ÷ 30)</option>
                <option value="working_26">Fixed 26 Working Days (4 weekly offs excluded)</option>
              </select>
            </div>
          )}

          {/* Joining Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E] mb-1">
              Joining Date
            </label>
            <input
              type="date"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] rounded-xl text-xs text-[#2B1810] dark:text-[#F3ECE1] outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E] mb-1">
              Notes / Role (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Master tea maker, Morning shift, Counter cashier"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] rounded-xl text-xs text-[#2B1810] dark:text-[#F3ECE1] outline-none"
            />
          </div>

          {/* Status (Active / Inactive) */}
          <div className="pt-2 border-t border-[#E8DFD3] dark:border-[#2C231B]">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E] mb-1.5">
              Worker Status
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-bold text-[#1E5E3A] dark:text-emerald-400 cursor-pointer">
                <input
                  type="radio"
                  name="workerStatus"
                  value="active"
                  checked={status === 'active'}
                  onChange={() => setStatus('active')}
                  className="accent-[#1E5E3A]"
                />
                Active (Shown in daily attendance)
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-stone-500 cursor-pointer">
                <input
                  type="radio"
                  name="workerStatus"
                  value="inactive"
                  checked={status === 'inactive'}
                  onChange={() => setStatus('inactive')}
                  className="accent-stone-600"
                />
                Inactive (Preserves past attendance records)
              </label>
            </div>
          </div>

          {/* Action Buttons */}
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
              className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-[#1E5E3A] hover:bg-[#16492C] text-white text-xs font-bold shadow-md shadow-[#1E5E3A]/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update Worker' : 'Save Worker'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
