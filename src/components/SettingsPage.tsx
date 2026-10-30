import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DEFAULT_EXPENSE_CATEGORIES } from '../types';
import {
  Settings,
  Store,
  Moon,
  Sun,
  Tags,
  Plus,
  Trash2,
  Calendar,
  User as UserIcon,
  LogIn,
  LogOut,
  CloudCheck,
  Check,
  Sparkles,
  Database,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    theme,
    setTheme,
    user,
    signInWithGoogle,
    signOutUser,
    addCustomCategory,
    removeCustomCategory,
    seedDemoDataIfEmpty,
  } = useApp();

  const [shopNameInput, setShopNameInput] = useState(settings.shopName);
  const [newCatInput, setNewCatInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const handleSaveShopName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (shopNameInput.trim()) {
      await updateSettings({ shopName: shopNameInput.trim() });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatInput.trim()) {
      await addCustomCategory(newCatInput.trim());
      setNewCatInput('');
    }
  };

  const handleSeedData = async () => {
    await seedDemoDataIfEmpty();
    setSeedSuccess(true);
    setTimeout(() => setSeedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl pb-20 lg:pb-8">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#3D2517] text-amber-200">
            <Settings className="w-5 h-5" />
          </div>
          <h2 className="text-xl lg:text-2xl font-extrabold text-[#2B1810] dark:text-[#F3ECE1]">
            Shop & App Settings
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-[#7A533E] dark:text-[#A8907E] mt-1">
          Customize your tea shop name, manage custom expense categories, choose theme, and manage account
        </p>
      </div>

      {/* 1. SHOP NAME */}
      <div className="bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] p-5 lg:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Store className="w-5 h-5 text-[#1E5E3A] dark:text-emerald-400" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#2B1810] dark:text-[#F3ECE1]">
              Tea Shop Name
            </h3>
            <p className="text-xs text-[#7A533E] dark:text-[#A8907E]">
              This appears at the top of your app and on downloaded reports
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveShopName} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <input
            type="text"
            value={shopNameInput}
            onChange={(e) => setShopNameInput(e.target.value)}
            placeholder="e.g. Sri Krishna Tea Stall, Sharma Chai Point"
            className="flex-1 px-4 py-2.5 bg-white dark:bg-[#14100D] border-2 border-[#D8C7B5] dark:border-[#382E26] focus:border-[#1E5E3A] rounded-xl text-sm font-bold text-[#2B1810] dark:text-[#F3ECE1] outline-none"
            required
          />
          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#1E5E3A] hover:bg-[#16492C] text-white text-xs font-bold shadow-md shadow-[#1E5E3A]/20 transition-all cursor-pointer"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Name</span>
            )}
          </button>
        </form>
      </div>

      {/* 2. APP THEME (Light / Dark) */}
      <div className="bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] p-5 lg:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          {theme === 'light' ? (
            <Sun className="w-5 h-5 text-amber-500" />
          ) : (
            <Moon className="w-5 h-5 text-amber-300" />
          )}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#2B1810] dark:text-[#F3ECE1]">
              App Theme
            </h3>
            <p className="text-xs text-[#7A533E] dark:text-[#A8907E]">
              Select warm chai cream light theme or roasted tea dark theme
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              theme === 'light'
                ? 'border-[#1E5E3A] bg-emerald-50/50 text-[#1E5E3A] shadow-xs'
                : 'border-[#E8DFD3] dark:border-[#2C231B] hover:border-[#D8C7B5]'
            }`}
          >
            <div className="p-2 rounded-xl bg-amber-100 text-[#854D0E]">
              <Sun className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-[#2B1810]">Light Theme</div>
              <div className="text-xs text-[#7A533E]">Warm cream and natural dark tea brown</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-emerald-500 bg-emerald-950/30 text-emerald-400 shadow-xs'
                : 'border-[#E8DFD3] dark:border-[#2C231B] hover:border-[#D8C7B5]'
            }`}
          >
            <div className="p-2 rounded-xl bg-[#28201A] text-amber-300">
              <Moon className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-[#F3ECE1]">Dark Theme</div>
              <div className="text-xs text-[#A8907E]">Deep roasted chai night mode</div>
            </div>
          </button>
        </div>
      </div>

      {/* 3. MANAGE EXPENSE CATEGORIES */}
      <div className="bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] p-5 lg:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Tags className="w-5 h-5 text-[#854D0E] dark:text-amber-400" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#2B1810] dark:text-[#F3ECE1]">
              Manage Expense Categories
            </h3>
            <p className="text-xs text-[#7A533E] dark:text-[#A8907E]">
              Default tea stall categories and your custom expense tags
            </p>
          </div>
        </div>

        {/* Add Custom Category Input */}
        <form onSubmit={handleAddCategory} className="flex gap-2">
          <input
            type="text"
            placeholder="Add new custom category (e.g. Spices, Biscuit Box, Snacks Vendor)"
            value={newCatInput}
            onChange={(e) => setNewCatInput(e.target.value)}
            className="flex-1 px-3.5 py-2 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] rounded-xl text-xs text-[#2B1810] dark:text-[#F3ECE1] outline-none"
          />
          <button
            type="submit"
            className="flex items-center gap-1 px-4 py-2 bg-[#854D0E] hover:bg-[#713F12] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>

        {/* Custom Categories list */}
        {settings.customCategories && settings.customCategories.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-[#854D0E] dark:text-amber-400 block mb-2">
              Your Custom Categories:
            </span>
            <div className="flex flex-wrap gap-2">
              {settings.customCategories.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 text-xs font-semibold"
                >
                  <span>{c}</span>
                  <button
                    type="button"
                    onClick={() => removeCustomCategory(c)}
                    className="p-0.5 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                    title="Remove custom category"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Default Categories */}
        <div>
          <span className="text-xs font-semibold text-[#7A533E] dark:text-[#A8907E] block mb-2">
            Built-in Categories (Standard for Tea Stalls):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {DEFAULT_EXPENSE_CATEGORIES.map((c) => (
              <span
                key={c}
                className="px-2.5 py-1 rounded-lg bg-[#EFE8DD] dark:bg-[#251D17] text-xs font-medium text-[#4A2E1E] dark:text-[#C5B3A2]"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 4. DEFAULT DATE FILTER */}
      <div className="bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] p-5 lg:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-[#1E5E3A] dark:text-emerald-400" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#2B1810] dark:text-[#F3ECE1]">
              Default Date Filter
            </h3>
            <p className="text-xs text-[#7A533E] dark:text-[#A8907E]">
              Preset applied automatically when you open reports and history
            </p>
          </div>
        </div>

        <select
          value={settings.defaultDateFilter}
          onChange={(e) => updateSettings({ defaultDateFilter: e.target.value as any })}
          className="w-full sm:w-72 px-3.5 py-2.5 bg-white dark:bg-[#14100D] border border-[#D8C7B5] dark:border-[#382E26] rounded-xl text-xs font-semibold text-[#2B1810] dark:text-[#F3ECE1] outline-none cursor-pointer"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="last7days">Last 7 Days (Weekly)</option>
          <option value="thisMonth">This Month (Monthly)</option>
          <option value="previousMonth">Previous Month</option>
        </select>
      </div>

      {/* 5. ACCOUNT & CLOUD DATABASE */}
      <div className="bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl border border-[#E8DFD3] dark:border-[#2C231B] p-5 lg:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <UserIcon className="w-5 h-5 text-[#3D2517] dark:text-amber-200" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#2B1810] dark:text-[#F3ECE1]">
              Account & Cloud Database
            </h3>
            <p className="text-xs text-[#7A533E] dark:text-[#A8907E]">
              Powered by Google Firebase Firestore cloud storage
            </p>
          </div>
        </div>

        {user ? (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <div className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    Cloud Sync Active
                  </div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-300">
                    Logged in as: {user.email}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={signOutUser}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1C1612] border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-semibold hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
            <p className="text-xs text-emerald-800 dark:text-emerald-300">
              All sales, expenses, and settings are saved permanently to your Firebase Firestore database.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#EFE8DD] dark:bg-[#251D17] border border-[#E0D5C7] dark:border-[#382E26] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-[#2B1810] dark:text-[#F3ECE1]">
                  Sign in with Google
                </div>
                <div className="text-xs text-[#7A533E] dark:text-[#A8907E]">
                  Sync records across devices and safeguard your store data in the cloud
                </div>
              </div>
              <button
                type="button"
                onClick={signInWithGoogle}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E5E3A] hover:bg-[#16492C] text-white text-xs font-bold shadow-md shadow-[#1E5E3A]/20 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign in with Google</span>
              </button>
            </div>
            <p className="text-xs text-[#7A533E] dark:text-[#A8907E]">
              Currently running in local offline storage. Signing in connects to your dedicated Firebase project.
            </p>
          </div>
        )}

        {/* Demo Data Seeder for Quick Verification */}
        <div className="pt-4 mt-4 border-t border-[#E8DFD3] dark:border-[#2C231B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-[#2B1810] dark:text-[#F3ECE1] block">
              Sample Data Generator
            </span>
            <span className="text-[11px] text-[#7A533E] dark:text-[#A8907E]">
              Populate realistic tea shop sales and expenses for today and yesterday
            </span>
          </div>
          <button
            type="button"
            onClick={handleSeedData}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#D8C7B5] dark:border-[#382E26] bg-white dark:bg-[#14100D] text-xs font-bold text-[#4A2E1E] dark:text-[#D5C2B1] hover:bg-[#EAE1D5] transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{seedSuccess ? 'Sample Data Added!' : 'Add Sample Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
