export interface SaleRecord {
  id: string;
  userId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface ExpenseRecord {
  id: string;
  userId: string;
  name: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  description?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface ShopSettings {
  shopName: string;
  currency: string;
  theme: 'light' | 'dark';
  defaultDateFilter: 'today' | 'yesterday' | 'last7days' | 'thisMonth' | 'previousMonth';
  customCategories: string[];
}

export const DEFAULT_EXPENSE_CATEGORIES: string[] = [
  'Milk',
  'Tea powder',
  'Sugar',
  'Coffee powder',
  'Gas',
  'Cups and supplies',
  'Rent',
  'Electricity',
  'Staff salary',
  'Transportation',
  'Maintenance',
  'Other expenses',
];

export type NavigationTab =
  | 'dashboard'
  | 'sales'
  | 'expenses'
  | 'attendance'
  | 'profit'
  | 'history'
  | 'reports'
  | 'settings';

export type DateFilterPreset = 'today' | 'yesterday' | 'last7days' | 'thisMonth' | 'previousMonth' | 'custom';

export interface DailySummary {
  date: string; // YYYY-MM-DD
  totalSales: number;
  salesCount: number;
  totalExpenses: number;
  expenseCount: number;
  estimatedProfit: number;
  isLoss: boolean;
}

export interface CategorySummary {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

// Worker & Attendance models
export type WageType = 'daily' | 'monthly';
export type WorkerStatus = 'active' | 'inactive';
export type ProrationMethod = 'calendar_days' | 'fixed_30' | 'working_26';
export type AttendanceStatus = 'present' | 'half_day' | 'absent' | 'off';

export type ShopOperatingStatus = 'open' | 'holiday' | 'weekly_off';

export interface ShopStatusRecord {
  id: string; // date YYYY-MM-DD
  userId: string;
  date: string; // YYYY-MM-DD
  status: ShopOperatingStatus;
  isPaid: boolean; // whether holiday / weekly off is paid to workers
  holidayName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerRecord {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  wageType: WageType;
  wageAmount: number;
  offDayPaid: boolean;
  prorationMethod?: ProrationMethod;
  joiningDate?: string; // YYYY-MM-DD
  notes?: string;
  status: WorkerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string; // `${workerId}_${date}`
  userId: string;
  workerId: string;
  workerName?: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  wageMultiplier?: number; // 1.0 (present), 0.5 (half day), 0.0 (absent)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryAdvance {
  id: string;
  userId: string;
  workerId: string;
  workerName?: string;
  amount: number;
  type: 'advance' | 'deduction';
  date: string; // YYYY-MM-DD
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryPayment {
  id: string;
  userId: string;
  workerId: string;
  workerName?: string;
  month: string; // YYYY-MM
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  expenseId?: string; // Links to expense record created in business expenses
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerSalarySummary {
  worker: WorkerRecord;
  month: string; // YYYY-MM
  calendarDays: number;
  runningDaysInPeriod: number; // Open working days up to calculation date
  runningDaysWorked: number; // presentDays + (0.5 * halfDays)
  calculationEndDay: number; // e.g. 29 for current date
  calculationEndDate: string; // e.g. '2026-10-29'
  isFutureMonth: boolean;
  presentDays: number;
  halfDays: number;
  absentDays: number;
  paidOffDays: number;
  unpaidOffDays: number;
  paidHolidays: number;
  unpaidHolidays: number;
  effectivePaidDays: number; // e.g. present + (halfDays * 0.5) + paidOffDays + paidHolidays
  unmarkedDays: number;
  baseWage: number;
  grossSalaryEarned: number;
  totalAdvances: number;
  totalDeductions: number;
  finalPayable: number;
  paidAmount: number;
  remainingPayable: number;
  isSettled: boolean;
}

