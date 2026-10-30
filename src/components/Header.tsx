import React from 'react';
import { useApp } from '../context/AppContext';
import { formatFullDate, getTodayDateString } from '../utils/dateUtils';
import {
  Coffee,
  PlusCircle,
  MinusCircle,
  Sun,
  Moon,
  CloudCheck,
  CloudOff,
  User as UserIcon,
  LogIn,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    settings,
    theme,
    setTheme,
    user,
    signInWithGoogle,
    setIsAddSaleOpen,
    setIsAddExpenseOpen,
    isFirestoreConnected,
  } = useApp();

  const today = getTodayDateString();

  return (
    <header className="sticky top-0 z-30 bg-[#FAF7F2]/95 dark:bg-[#14100D]/95 backdrop-blur-md border-b border-[#E8DFD3] dark:border-[#2C231B] px-4 lg:px-8 py-3.5 transition-colors">
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Brand & Date on Mobile/Desktop */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4A2E1E] to-[#2B1810] dark:from-[#3D2517] dark:to-[#1F130B] flex items-center justify-center text-amber-100 shadow-md shadow-[#4A2E1E]/20">
            <Coffee className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base lg:text-lg font-bold tracking-tight text-[#2B1810] dark:text-[#F3ECE1]">
                {settings.shopName}
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#1E5E3A]/10 text-[#1E5E3A] dark:bg-emerald-500/20 dark:text-emerald-300">
                Chai Shop
              </span>
            </div>
            <p className="text-xs text-[#7A533E] dark:text-[#A8907E] font-medium">
              {formatFullDate(today)}
            </p>
          </div>
        </div>

        {/* Action Buttons & Quick Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Prominent Quick Entry Buttons */}
          <button
            onClick={() => setIsAddSaleOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1E5E3A] hover:bg-[#16492C] text-white text-xs sm:text-sm font-semibold shadow-md shadow-[#1E5E3A]/20 transition-all active:scale-95 cursor-pointer"
            title="Add Sales Entry"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden xs:inline">+ Add</span> Sales
          </button>

          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#854D0E] hover:bg-[#713F12] text-white text-xs sm:text-sm font-semibold shadow-md shadow-amber-900/20 transition-all active:scale-95 cursor-pointer"
            title="Add Expense Entry"
          >
            <MinusCircle className="w-4 h-4" />
            <span className="hidden xs:inline">+ Add</span> Expense
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-xl text-[#7A533E] dark:text-[#A8907E] hover:bg-[#EFE8DD] dark:hover:bg-[#251D17] transition-colors cursor-pointer"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Cloud Sync & Auth Pill */}
          {user ? (
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#EFE8DD] dark:bg-[#251D17] text-xs font-medium text-[#4A2E1E] dark:text-[#D5C2B1] border border-[#E0D5C7] dark:border-[#382E26]"
              title={`Logged in as ${user.email} (Cloud Sync Active)`}
            >
              <CloudCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="max-w-[100px] truncate">{user.displayName || user.email?.split('@')[0]}</span>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#EFE8DD] hover:bg-[#E5DCCF] dark:bg-[#251D17] dark:hover:bg-[#30261E] text-xs font-medium text-[#4A2E1E] dark:text-[#D5C2B1] border border-[#E0D5C7] dark:border-[#382E26] transition-colors cursor-pointer"
              title="Sign in with Google to sync cloud records"
            >
              <LogIn className="w-3.5 h-3.5 text-[#1E5E3A] dark:text-emerald-400" />
              <span>Sync Cloud</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
