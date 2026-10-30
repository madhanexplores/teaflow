import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { NavigationTab } from '../types';
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  CalendarCheck2,
  History,
  BarChart3,
  Settings,
  Plus,
  X,
  PlusCircle,
  MinusCircle,
  UserPlus,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setIsAddSaleOpen,
    setIsAddExpenseOpen,
    setIsAddWorkerOpen,
  } = useApp();
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const mainNavItems = [
    { id: 'dashboard' as NavigationTab, label: 'Home', icon: LayoutDashboard },
    { id: 'sales' as NavigationTab, label: 'Sales', icon: TrendingUp },
    { id: 'attendance' as NavigationTab, label: 'Staff', icon: CalendarCheck2 },
    { id: 'expenses' as NavigationTab, label: 'Expenses', icon: Receipt },
    { id: 'reports' as NavigationTab, label: 'Reports', icon: BarChart3 },
  ];

  return (
    <>
      {/* Floating Quick Action Drawer / Menu */}
      {showQuickMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex flex-col justify-end p-4 pb-24 lg:hidden"
          onClick={() => setShowQuickMenu(false)}
        >
          <div
            className="bg-[#FAF7F2] dark:bg-[#1C1612] rounded-3xl p-5 border border-[#E8DFD3] dark:border-[#2C231B] shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E8DFD3] dark:border-[#2C231B]">
              <span className="text-sm font-bold text-[#2B1810] dark:text-[#F3ECE1]">
                Quick Entry
              </span>
              <button
                onClick={() => setShowQuickMenu(false)}
                className="p-1 rounded-full text-[#7A533E] dark:text-[#A8907E] hover:bg-[#EAE1D5] dark:hover:bg-[#251D17]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => {
                setShowQuickMenu(false);
                setIsAddSaleOpen(true);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#1E5E3A] text-white font-semibold text-sm shadow-md shadow-[#1E5E3A]/20 active:scale-98 transition-all"
            >
              <div className="p-2 rounded-xl bg-white/10">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold">+ Record Sales</div>
                <div className="text-xs text-white/80">Add daily cash or UPI tea sales</div>
              </div>
            </button>

            <button
              onClick={() => {
                setShowQuickMenu(false);
                setIsAddExpenseOpen(true);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#854D0E] text-white font-semibold text-sm shadow-md shadow-amber-900/20 active:scale-98 transition-all"
            >
              <div className="p-2 rounded-xl bg-white/10">
                <MinusCircle className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold">+ Record Expense</div>
                <div className="text-xs text-white/80">Milk, tea powder, gas, supplies</div>
              </div>
            </button>

            <button
              onClick={() => {
                setShowQuickMenu(false);
                setIsAddWorkerOpen(true);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#3D2517] text-amber-200 font-semibold text-sm shadow-md active:scale-98 transition-all"
            >
              <div className="p-2 rounded-xl bg-white/10">
                <UserPlus className="w-5 h-5 text-amber-300" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-white">+ Add Worker</div>
                <div className="text-xs text-stone-300">Register new staff member & wages</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Main Bottom Nav Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#FAF7F2]/95 dark:bg-[#14100D]/95 backdrop-blur-lg border-t border-[#E8DFD3] dark:border-[#2C231B] px-2 py-1.5 transition-colors safe-area-pb">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {mainNavItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'text-[#1E5E3A] dark:text-emerald-400 font-bold'
                    : 'text-[#7A533E] dark:text-[#A8907E] font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                <span className="text-[11px] mt-0.5">{item.label}</span>
              </button>
            );
          })}

          {/* Center Floating Plus Action */}
          <button
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            className="flex items-center justify-center w-11 h-11 -mt-4 rounded-full bg-gradient-to-tr from-[#3D2517] to-[#1E5E3A] text-amber-200 shadow-lg shadow-[#3D2517]/30 active:scale-90 transition-transform cursor-pointer"
            aria-label="Quick Add"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>

          {mainNavItems.slice(2).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'text-[#1E5E3A] dark:text-emerald-400 font-bold'
                    : 'text-[#7A533E] dark:text-[#A8907E] font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                <span className="text-[11px] mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
