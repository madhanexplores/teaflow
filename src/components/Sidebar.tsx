import React from 'react';
import { useApp } from '../context/AppContext';
import { NavigationTab } from '../types';
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  Calculator,
  History,
  BarChart3,
  Settings,
  Coffee,
  PlusCircle,
  MinusCircle,
  CloudCheck,
  Cloud,
  CalendarCheck2,
} from 'lucide-react';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sales', label: 'Sales', icon: TrendingUp },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck2 },
  { id: 'profit', label: 'Profit Calculator', icon: Calculator },
  { id: 'history', label: 'History', icon: History },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    settings,
    setIsAddSaleOpen,
    setIsAddExpenseOpen,
    user,
    todaySalesTotal,
    todayExpensesTotal,
  } = useApp();

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-[#F5EFE6] dark:bg-[#1A1410] border-r border-[#E5DACD] dark:border-[#2C231B] min-h-screen p-4 transition-colors">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-3 py-4 mb-4 border-b border-[#E5DACD] dark:border-[#2C231B]">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#3D2517] to-[#1E5E3A] flex items-center justify-center text-amber-200 shadow-md shadow-[#3D2517]/20">
          <Coffee className="w-6 h-6" />
        </div>
        <div className="overflow-hidden">
          <h2 className="text-base font-bold text-[#2B1810] dark:text-[#F3ECE1] truncate">
            {settings.shopName}
          </h2>
          <p className="text-xs text-[#7A533E] dark:text-[#A8907E]">
            Daily Shop Manager
          </p>
        </div>
      </div>

      {/* Quick Action Buttons on Desktop Sidebar */}
      <div className="space-y-2 mb-6 px-1">
        <button
          onClick={() => setIsAddSaleOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E5E3A] hover:bg-[#16492C] text-white font-semibold text-sm shadow-md shadow-[#1E5E3A]/20 transition-all active:scale-[0.98] cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Add Sales</span>
        </button>

        <button
          onClick={() => setIsAddExpenseOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#854D0E] hover:bg-[#713F12] text-white font-semibold text-sm shadow-md shadow-amber-900/20 transition-all active:scale-[0.98] cursor-pointer"
        >
          <MinusCircle className="w-4 h-4" />
          <span>+ Add Expense</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 px-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#3D2517] text-[#FAF7F2] shadow-sm shadow-[#3D2517]/20 font-semibold dark:bg-[#FAF7F2] dark:text-[#2B1810]'
                  : 'text-[#4A2E1E] dark:text-[#D5C2B1] hover:bg-[#EAE1D5] dark:hover:bg-[#251D17]'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive
                    ? 'text-amber-300 dark:text-[#1E5E3A]'
                    : 'text-[#7A533E] dark:text-[#A8907E]'
                }`}
              />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mini Financial Summary on Sidebar Footer */}
      <div className="mt-auto pt-4 border-t border-[#E5DACD] dark:border-[#2C231B] px-2">
        <div className="p-3 rounded-xl bg-[#EBE2D5] dark:bg-[#221A15] text-xs space-y-1.5">
          <div className="flex justify-between text-[#7A533E] dark:text-[#A8907E]">
            <span>Today's Sales:</span>
            <span className="font-semibold text-[#1E5E3A] dark:text-emerald-400">
              ₹{todaySalesTotal.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between text-[#7A533E] dark:text-[#A8907E]">
            <span>Today's Expenses:</span>
            <span className="font-semibold text-amber-800 dark:text-amber-400">
              ₹{todayExpensesTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Sync Status Badge */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-[#7A533E] dark:text-[#A8907E] px-1">
          <span className="flex items-center gap-1.5">
            {user ? (
              <>
                <CloudCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Cloud Synced</span>
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Local Storage</span>
              </>
            )}
          </span>
          <span className="text-[10px] font-mono opacity-70">v1.0</span>
        </div>
      </div>
    </aside>
  );
};
