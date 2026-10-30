import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShopStatusRecord } from '../../types';
import { formatDisplayDate, getTodayDateString } from '../../utils/dateUtils';
import { X, CalendarOff, Trash2, Edit2, Plus, Sparkles, Check } from 'lucide-react';

interface ManageHolidaysModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string; // YYYY-MM
  initialDate?: string;
}

export const ManageHolidaysModal: React.FC<ManageHolidaysModalProps> = ({
  isOpen,
  onClose,
  selectedMonth,
  initialDate,
}) => {
  const { shopStatuses, setShopStatus, deleteShopStatus } = useApp();

  const [dateInput, setDateInput] = useState<string>(
    initialDate || `${selectedMonth}-01`
  );
  const [nameInput, setNameInput] = useState<string>('');
  const [isPaidInput, setIsPaidInput] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter holidays in the selected month
  const monthHolidays = shopStatuses.filter(
    (s) => s.date.startsWith(selectedMonth) && s.status === 'holiday'
  );

  const handleEdit = (holiday: ShopStatusRecord) => {
    setDateInput(holiday.date);
    setNameInput(holiday.holidayName || '');
    setIsPaidInput(holiday.isPaid);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateInput) return;

    const trimmedName = nameInput.trim() || 'Festival / Shop Holiday';
    await setShopStatus(dateInput, 'holiday', isPaidInput, trimmedName);

    setSaveSuccessMsg(`Holiday saved for ${formatDisplayDate(dateInput)}`);
    setTimeout(() => setSaveSuccessMsg(null), 2500);

    // Reset form
    setNameInput('');
    setIsEditing(false);
  };

  const handleDelete = async (date: string) => {
    if (confirm(`Remove holiday for ${formatDisplayDate(date)} and revert to normal working day?`)) {
      await deleteShopStatus(date);
      setSaveSuccessMsg(`Holiday removed. Day reverted to normal open day.`);
      setTimeout(() => setSaveSuccessMsg(null), 2500);
      if (dateInput === date) {
        setIsEditing(false);
        setNameInput('');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E8DFD3] dark:border-[#2C231B]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300">
              <CalendarOff className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#2B1810] dark:text-[#F3ECE1]">
                Shop Holiday Management
              </h3>
              <p className="text-xs text-[#7A533E] dark:text-[#A8907E]">
                Record festival closures or shop holidays (Paid or Unpaid)
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

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {saveSuccessMsg && (
            <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-[#1E5E3A] dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Holiday Form (Requirement 3: Holiday name, date, Paid/Unpaid, Save button) */}
          <form onSubmit={handleSave} className="p-4 rounded-2xl bg-white dark:bg-[#14100D] border border-[#E8DFD3] dark:border-[#2C231B] space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E] flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-[#1E5E3A]" />
              <span>{isEditing ? 'Edit Holiday Record' : 'Record New Shop Holiday'}</span>
            </div>

            {/* Holiday Name */}
            <div>
              <label className="block text-xs font-bold text-[#2B1810] dark:text-[#F3ECE1] mb-1">
                Holiday Name:
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Diwali Festival, Independence Day, Shop Closed"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B5] dark:border-[#382E26] bg-[#FAF7F2] dark:bg-[#1C1612] text-xs font-semibold text-[#2B1810] dark:text-[#F3ECE1] outline-none focus:border-[#1E5E3A]"
              />
            </div>

            {/* Holiday Date */}
            <div>
              <label className="block text-xs font-bold text-[#2B1810] dark:text-[#F3ECE1] mb-1">
                Holiday Date:
              </label>
              <input
                type="date"
                required
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B5] dark:border-[#382E26] bg-[#FAF7F2] dark:bg-[#1C1612] text-xs font-semibold text-[#2B1810] dark:text-[#F3ECE1] outline-none focus:border-[#1E5E3A]"
              />
            </div>

            {/* Paid or Unpaid Holiday Selector */}
            <div>
              <label className="block text-xs font-bold text-[#2B1810] dark:text-[#F3ECE1] mb-2">
                Holiday Wage Policy:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label
                  className={`p-3 rounded-xl border-2 flex items-center gap-2.5 cursor-pointer transition-all ${
                    isPaidInput === true
                      ? 'border-[#1E5E3A] bg-emerald-50 dark:bg-emerald-950/40 text-[#1E5E3A] dark:text-emerald-300 font-bold'
                      : 'border-[#E8DFD3] dark:border-[#2C231B] bg-[#FAF7F2] dark:bg-[#1C1612] text-[#7A533E]'
                  }`}
                >
                  <input
                    type="radio"
                    name="holidayPayOption"
                    checked={isPaidInput === true}
                    onChange={() => setIsPaidInput(true)}
                    className="accent-[#1E5E3A]"
                  />
                  <div>
                    <div className="text-xs font-bold">🟢 Paid Holiday</div>
                    <div className="text-[10px] opacity-80">100% daily wage to workers</div>
                  </div>
                </label>

                <label
                  className={`p-3 rounded-xl border-2 flex items-center gap-2.5 cursor-pointer transition-all ${
                    isPaidInput === false
                      ? 'border-red-600 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold'
                      : 'border-[#E8DFD3] dark:border-[#2C231B] bg-[#FAF7F2] dark:bg-[#1C1612] text-[#7A533E]'
                  }`}
                >
                  <input
                    type="radio"
                    name="holidayPayOption"
                    checked={isPaidInput === false}
                    onChange={() => setIsPaidInput(false)}
                    className="accent-red-600"
                  />
                  <div>
                    <div className="text-xs font-bold">🔴 Unpaid Holiday</div>
                    <div className="text-[10px] opacity-80">₹0 wage for this closure date</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#1E5E3A] hover:bg-[#16492C] text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Holiday</span>
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setNameInput('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#EFE8DD] dark:bg-[#251D17] text-[#4A2E1E] dark:text-[#D5C2B1] text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* List of existing holidays for this month */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E]">
                Holidays in {selectedMonth} ({monthHolidays.length})
              </span>
            </div>

            {monthHolidays.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[#EFE8DD]/50 dark:bg-[#221A15] border border-[#E0D5C7] dark:border-[#382E26] text-center text-xs text-[#7A533E] dark:text-[#A8907E]">
                No holidays recorded for {selectedMonth}. All days are normal working days or weekly offs.
              </div>
            ) : (
              <div className="space-y-2">
                {monthHolidays.map((holiday) => (
                  <div
                    key={holiday.date}
                    className="p-3 rounded-2xl bg-white dark:bg-[#14100D] border border-[#E8DFD3] dark:border-[#2C231B] flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#2B1810] dark:text-[#F3ECE1]">
                          {holiday.holidayName || 'Shop Holiday'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            holiday.isPaid
                              ? 'bg-emerald-100 text-[#1E5E3A] dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                          }`}
                        >
                          {holiday.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#7A533E] dark:text-[#A8907E] mt-0.5">
                        📅 {formatDisplayDate(holiday.date)} ({holiday.date})
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(holiday)}
                        className="p-2 rounded-lg text-[#7A533E] hover:bg-[#EFE8DD] dark:hover:bg-[#251D17] transition-colors cursor-pointer"
                        title="Edit Holiday"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(holiday.date)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                        title="Delete Holiday (Revert to Open Day)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E8DFD3] dark:border-[#2C231B] bg-[#FAF7F2] dark:bg-[#1C1612] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#2B1810] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#2B1810] text-xs font-bold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
