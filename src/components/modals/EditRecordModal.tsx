import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Trash2, Check, AlertTriangle } from 'lucide-react';

export const EditRecordModal: React.FC = () => {
  const {
    editingSale,
    setEditingSale,
    editingExpense,
    setEditingExpense,
    updateSale,
    deleteSale,
    updateExpense,
    deleteExpense,
    categories,
  } = useApp();

  const isSale = !!editingSale;
  const isExpense = !!editingExpense;
  const isOpen = isSale || isExpense;

  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingSale) {
      setAmount(String(editingSale.amount));
      setDate(editingSale.date);
      setNote(editingSale.note || '');
      setConfirmDelete(false);
      setError(null);
    } else if (editingExpense) {
      setAmount(String(editingExpense.amount));
      setDate(editingExpense.date);
      setName(editingExpense.name);
      setCategory(editingExpense.category);
      setNote(editingExpense.description || '');
      setConfirmDelete(false);
      setError(null);
    }
  }, [editingSale, editingExpense]);

  if (!isOpen) return null;

  const handleClose = () => {
    setEditingSale(null);
    setEditingExpense(null);
    setConfirmDelete(false);
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      if (isSale && editingSale) {
        await deleteSale(editingSale.id);
      } else if (isExpense && editingExpense) {
        await deleteExpense(editingExpense.id);
      }
      handleClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (!date) {
      setError('Please select a valid date.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      if (isSale && editingSale) {
        await updateSale(editingSale.id, numericAmount, date, note);
      } else if (isExpense && editingExpense) {
        if (!name.trim()) {
          setError('Please provide an expense name.');
          return;
        }
        await updateExpense(editingExpense.id, name, numericAmount, category, date, note);
      }
      handleClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update record.');
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DFD3] dark:border-[#2C231B] bg-[#F4EDE2] dark:bg-[#231B15]">
          <h3 className="text-base font-bold text-[#2B1810] dark:text-[#F3ECE1]">
            {isSale ? 'Edit Sales Entry' : 'Edit Expense Entry'}
          </h3>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-[#7A533E] dark:text-[#A8907E] hover:bg-[#EAE1D5] dark:hover:bg-[#2C231B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-medium">
              {error}
            </div>
          )}

          {confirmDelete ? (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-red-900 dark:text-red-200">
                Delete this {isSale ? 'sales' : 'expense'} entry?
              </h4>
              <p className="text-xs text-red-700 dark:text-red-300">
                Amount: ₹{parseFloat(amount).toLocaleString('en-IN')} on {date}. This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4A2E1E] dark:text-[#D5C2B1] bg-[#EAE1D5] dark:bg-[#2C231B] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-4">
              {isExpense && (
                <div>
                  <label className="block text-xs font-semibold text-[#7A533E] dark:text-[#A8907E] mb-1">
                    Expense Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] rounded-xl text-sm font-semibold text-[#2B1810] dark:text-[#F3ECE1] outline-none"
                    required
                  />
                </div>
              )}

              {isExpense && (
                <div>
                  <label className="block text-xs font-semibold text-[#7A533E] dark:text-[#A8907E] mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] rounded-xl text-sm text-[#2B1810] dark:text-[#F3ECE1] outline-none cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#7A533E] dark:text-[#A8907E] mb-1">
                  Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-lg font-bold text-[#4A2E1E] dark:text-[#D5C2B1]">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 bg-white dark:bg-[#14100D] border-2 border-[#D8C7B5] dark:border-[#382E26] rounded-xl text-lg font-bold text-[#2B1810] dark:text-[#F3ECE1] outline-none"
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
                  className="w-full px-3.5 py-2 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] rounded-xl text-sm text-[#2B1810] dark:text-[#F3ECE1] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#7A533E] dark:text-[#A8907E] mb-1">
                  {isSale ? 'Note (Optional)' : 'Description (Optional)'}
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] rounded-xl text-sm text-[#2B1810] dark:text-[#F3ECE1] outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-[#E8DFD3] dark:border-[#2C231B]">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4A2E1E] dark:text-[#D5C2B1] hover:bg-[#EAE1D5] dark:hover:bg-[#251D17] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#1E5E3A] hover:bg-[#16492C] text-white text-xs font-bold shadow-md shadow-[#1E5E3A]/20 transition-all cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
