import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getTodayDateString } from '../../utils/dateUtils';
import { X, Check, Receipt, Plus } from 'lucide-react';

export const AddExpenseModal: React.FC = () => {
  const {
    isAddExpenseOpen,
    setIsAddExpenseOpen,
    categories,
    addExpense,
    addCustomCategory,
  } = useApp();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Milk');
  const [date, setDate] = useState(getTodayDateString());
  const [description, setDescription] = useState('');
  const [newCustomCategoryInput, setNewCustomCategoryInput] = useState('');
  const [showNewCategoryField, setShowNewCategoryField] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAddExpenseOpen) return null;

  const quickExpenseItems = [
    { name: 'Milk (Fresh Dairy)', cat: 'Milk' },
    { name: 'Assam Tea Powder', cat: 'Tea powder' },
    { name: 'Sugar 5kg Bag', cat: 'Sugar' },
    { name: 'Coffee Powder (Filter)', cat: 'Coffee powder' },
    { name: 'Commercial Gas Cylinder', cat: 'Gas' },
    { name: 'Paper Cups & Straws', cat: 'Cups and supplies' },
    { name: 'Cardamom & Fresh Ginger', cat: 'Tea powder' },
    { name: 'Shop Daily Cleaning Supplies', cat: 'Maintenance' },
  ];

  const handleSelectQuickItem = (item: { name: string; cat: string }) => {
    setName(item.name);
    if (categories.includes(item.cat)) {
      setCategory(item.cat);
    }
  };

  const handleAddCustomCategory = async () => {
    if (newCustomCategoryInput.trim()) {
      await addCustomCategory(newCustomCategoryInput.trim());
      setCategory(newCustomCategoryInput.trim());
      setNewCustomCategoryInput('');
      setShowNewCategoryField(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (!name.trim()) {
      setError('Please enter the expense item name (e.g. Milk, Gas, Tea Powder)');
      return;
    }
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid expense amount greater than ₹0');
      return;
    }
    if (!category) {
      setError('Please select an expense category');
      return;
    }
    if (!date) {
      setError('Please choose a valid date');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await addExpense(name, numericAmount, category, date, description);
      // Reset form
      setName('');
      setAmount('');
      setDescription('');
      setDate(getTodayDateString());
      setIsAddExpenseOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to save expense. Please try again.');
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
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#2B1810] dark:text-[#F3ECE1]">
                Record Expense
              </h3>
              <p className="text-xs text-[#7A533E] dark:text-[#A8907E]">
                Track milk, tea powder, gas, supplies, and shop bills
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddExpenseOpen(false)}
            className="p-1.5 rounded-full text-[#7A533E] dark:text-[#A8907E] hover:bg-[#EAE1D5] dark:hover:bg-[#2C231B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body with Scroll */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Quick Expense Item Suggestions */}
          <div>
            <span className="text-[11px] font-semibold text-[#7A533E] dark:text-[#A8907E] block mb-1.5">
              Quick Select Item:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickExpenseItems.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => handleSelectQuickItem(item)}
                  className="px-2.5 py-1 rounded-lg bg-[#EFE8DD] dark:bg-[#28201A] hover:bg-[#E2D6C6] dark:hover:bg-[#342A22] text-xs text-[#4A2E1E] dark:text-[#D5C2B1] font-medium transition-colors cursor-pointer"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* Expense Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E] mb-1">
              Expense Name / Item <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Fresh Milk, Tea powder, Gas cylinder"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-[#14100D] border-2 border-[#D8C7B5] dark:border-[#382E26] focus:border-[#854D0E] rounded-xl text-sm font-semibold text-[#2B1810] dark:text-[#F3ECE1] outline-none"
              required
            />
          </div>

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E] mb-1">
              Amount (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-xl font-bold text-[#854D0E] dark:text-amber-400">
                ₹
              </div>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#14100D] border-2 border-[#D8C7B5] dark:border-[#382E26] focus:border-[#854D0E] rounded-xl text-xl font-extrabold text-[#2B1810] dark:text-[#F3ECE1] outline-none"
                required
              />
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E]">
                Category <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowNewCategoryField(!showNewCategoryField)}
                className="text-xs text-[#1E5E3A] dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ Custom Category</span>
              </button>
            </div>

            {showNewCategoryField && (
              <div className="flex gap-2 mb-2 p-2 rounded-xl bg-[#EFE8DD] dark:bg-[#251D17]">
                <input
                  type="text"
                  placeholder="New category name"
                  value={newCustomCategoryInput}
                  onChange={(e) => setNewCustomCategoryInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-[#14100D] border border-[#D8C7B5] rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddCustomCategory}
                  className="px-3 py-1.5 bg-[#1E5E3A] text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Add
                </button>
              </div>
            )}

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] focus:border-[#854D0E] rounded-xl text-sm font-medium text-[#2B1810] dark:text-[#F3ECE1] outline-none cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Date Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E] mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] focus:border-[#854D0E] rounded-xl text-sm font-medium text-[#2B1810] dark:text-[#F3ECE1] outline-none"
              required
            />
          </div>

          {/* Description (Optional) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A533E] dark:text-[#A8907E] mb-1">
              Description / Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 15 Liters Buffalo milk from vendor, Invoice #203"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] focus:border-[#854D0E] rounded-xl text-sm text-[#2B1810] dark:text-[#F3ECE1] outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8DFD3] dark:border-[#2C231B]">
            <button
              type="button"
              onClick={() => setIsAddExpenseOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-[#D8C7B5] dark:border-[#382E26] text-sm font-semibold text-[#4A2E1E] dark:text-[#D5C2B1] hover:bg-[#EAE1D5] dark:hover:bg-[#251D17] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#854D0E] hover:bg-[#713F12] text-white text-sm font-bold shadow-md shadow-amber-900/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
