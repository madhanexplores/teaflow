import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType, testFirestoreConnection } from '../firebase';
import {
  SaleRecord,
  ExpenseRecord,
  ShopSettings,
  DEFAULT_EXPENSE_CATEGORIES,
  NavigationTab,
  DailySummary,
  WorkerRecord,
  AttendanceRecord,
  AttendanceStatus,
  ShopOperatingStatus,
  ShopStatusRecord,
  SalaryAdvance,
  SalaryPayment,
  WorkerSalarySummary,
} from '../types';
import { getTodayDateString, getYesterdayDateString } from '../utils/dateUtils';

interface DailyWageCalculation {
  totalWages: number;
  activeWorkerCount: number;
  presentCount: number;
  halfDayCount: number;
  absentCount: number;
  offCount: number;
  shopStatus: ShopStatusRecord;
  workerRows: Array<{
    worker: WorkerRecord;
    status: AttendanceStatus;
    multiplier: number;
    wageEarned: number;
    isDefault: boolean;
  }>;
}

interface AppContextType {
  user: User | null;
  authLoading: boolean;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  sales: SaleRecord[];
  expenses: ExpenseRecord[];
  workers: WorkerRecord[];
  attendance: AttendanceRecord[];
  shopStatuses: ShopStatusRecord[];
  salaryAdvances: SalaryAdvance[];
  salaryPayments: SalaryPayment[];
  settings: ShopSettings;
  categories: string[];
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  // Modals state
  isAddSaleOpen: boolean;
  setIsAddSaleOpen: (open: boolean) => void;
  isAddExpenseOpen: boolean;
  setIsAddExpenseOpen: (open: boolean) => void;
  editingSale: SaleRecord | null;
  setEditingSale: (sale: SaleRecord | null) => void;
  editingExpense: ExpenseRecord | null;
  setEditingExpense: (expense: ExpenseRecord | null) => void;
  // Worker Modals
  isAddWorkerOpen: boolean;
  setIsAddWorkerOpen: (open: boolean) => void;
  editingWorker: WorkerRecord | null;
  setEditingWorker: (worker: WorkerRecord | null) => void;
  isRecordPaymentOpen: boolean;
  setIsRecordPaymentOpen: (open: boolean) => void;
  paymentWorkerTarget: WorkerRecord | null;
  setPaymentWorkerTarget: (worker: WorkerRecord | null) => void;
  // Actions
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  addSale: (amount: number, date: string, note?: string) => Promise<void>;
  updateSale: (id: string, amount: number, date: string, note?: string) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  addExpense: (name: string, amount: number, category: string, date: string, description?: string) => Promise<string>;
  updateExpense: (id: string, name: string, amount: number, category: string, date: string, description?: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateSettings: (newSettings: Partial<ShopSettings>) => Promise<void>;
  addCustomCategory: (categoryName: string) => Promise<void>;
  removeCustomCategory: (categoryName: string) => Promise<void>;
  // Worker & Attendance Actions
  addWorker: (data: Omit<WorkerRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateWorker: (id: string, data: Partial<WorkerRecord>) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;
  recordAttendance: (workerId: string, date: string, status: AttendanceStatus, notes?: string, wageMultiplier?: number) => Promise<void>;
  getShopStatusForDate: (date: string) => ShopStatusRecord;
  setShopStatus: (date: string, status: ShopOperatingStatus, isPaid: boolean, holidayName?: string) => Promise<void>;
  deleteShopStatus: (date: string) => Promise<void>;
  getEffectiveAttendanceForWorker: (worker: WorkerRecord, date: string) => {
    status: AttendanceStatus;
    multiplier: number;
    wageEarned: number;
    isDefault: boolean;
    notes?: string;
  };
  calculateDailyWages: (date: string) => DailyWageCalculation;
  calculateWorkerSalaryForMonth: (worker: WorkerRecord, month: string) => WorkerSalarySummary;
  recordAdvanceOrDeduction: (workerId: string, amount: number, type: 'advance' | 'deduction', date: string, reason?: string) => Promise<void>;
  deleteAdvanceOrDeduction: (id: string) => Promise<void>;
  recordSalaryPayment: (workerId: string, month: string, amount: number, paymentDate: string, notes?: string, syncToExpenses?: boolean) => Promise<void>;
  // Computations
  todaySalesTotal: number;
  todayExpensesTotal: number;
  todayEstimatedProfit: number;
  thisMonthSalesTotal: number;
  thisMonthExpensesTotal: number;
  thisMonthEstimatedProfit: number;
  thisWeekExpensesTotal: number;
  dailySummariesMap: Map<string, DailySummary>;
  isFirestoreConnected: boolean;
  seedDemoDataIfEmpty: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_SALES_KEY = 'teashop_sales_local_cache';
const LOCAL_STORAGE_EXPENSES_KEY = 'teashop_expenses_local_cache';
const LOCAL_STORAGE_SETTINGS_KEY = 'teashop_settings_local_cache';
const LOCAL_STORAGE_WORKERS_KEY = 'teashop_workers_local_cache';
const LOCAL_STORAGE_ATTENDANCE_KEY = 'teashop_attendance_local_cache';
const LOCAL_STORAGE_SHOPSTATUS_KEY = 'teashop_shopstatus_local_cache';
const LOCAL_STORAGE_ADVANCES_KEY = 'teashop_advances_local_cache';
const LOCAL_STORAGE_PAYMENTS_KEY = 'teashop_payments_local_cache';

const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'Chai Stall & Tea House',
  currency: '₹',
  theme: 'light',
  defaultDateFilter: 'today',
  customCategories: [],
};

const getInitialSampleWorkers = (userId: string): WorkerRecord[] => {
  return [
    {
      id: 'worker-1',
      userId,
      name: 'Ramesh Kumar (Master Chai Maker)',
      phone: '9876543210',
      wageType: 'daily',
      wageAmount: 650,
      offDayPaid: false,
      prorationMethod: 'calendar_days',
      joiningDate: '2026-01-10',
      notes: 'Expert in Special Masala Chai & Ginger Chai',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'worker-2',
      userId,
      name: 'Suresh Verma (Helper & Counter)',
      phone: '9812345678',
      wageType: 'monthly',
      wageAmount: 14000,
      offDayPaid: true,
      prorationMethod: 'calendar_days',
      joiningDate: '2026-02-01',
      notes: 'Counter sales, snack preparation, and cleaning',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [isFirestoreConnected, setIsFirestoreConnected] = useState(false);

  // Modals state
  const [isAddSaleOpen, setIsAddSaleOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<SaleRecord | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);

  // Worker Modals
  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<WorkerRecord | null>(null);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [paymentWorkerTarget, setPaymentWorkerTarget] = useState<WorkerRecord | null>(null);

  // Settings
  const [settings, setSettings] = useState<ShopSettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Sales and Expenses Data
  const [sales, setSales] = useState<SaleRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SALES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_EXPENSES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Workers Data
  const [workers, setWorkers] = useState<WorkerRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_WORKERS_KEY);
      return saved ? JSON.parse(saved) : getInitialSampleWorkers('local-owner');
    } catch {
      return getInitialSampleWorkers('local-owner');
    }
  });

  // Attendance Records
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ATTENDANCE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Shop Status Records (Open, Holiday, Weekly Off)
  const [shopStatuses, setShopStatuses] = useState<ShopStatusRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SHOPSTATUS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Salary Advances & Deductions
  const [salaryAdvances, setSalaryAdvances] = useState<SalaryAdvance[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ADVANCES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Salary Payments
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PAYMENTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Check connection on boot
  useEffect(() => {
    testFirestoreConnection().then((ok) => {
      setIsFirestoreConnected(ok);
    });
  }, []);

  // Theme application
  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    const updated = { ...settings, theme: newTheme };
    setSettings(updated);
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(updated));
  };

  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Auth observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore Sync when User is authenticated
  useEffect(() => {
    if (!user) {
      return;
    }

    const userId = user.uid;
    const salesPath = `users/${userId}/sales`;
    const expensesPath = `users/${userId}/expenses`;
    const settingsPath = `users/${userId}/settings/general`;
    const workersPath = `users/${userId}/workers`;
    const attendancePath = `users/${userId}/attendance`;
    const shopStatusPath = `users/${userId}/shopStatus`;
    const advancesPath = `users/${userId}/salaryAdvances`;
    const paymentsPath = `users/${userId}/salaryPayments`;

    // Subscribe to Sales
    const salesQuery = query(collection(db, 'users', userId, 'sales'), orderBy('date', 'desc'));
    const unsubSales = onSnapshot(
      salesQuery,
      (snapshot) => {
        const records: SaleRecord[] = [];
        snapshot.forEach((docSnap) => {
          records.push({ id: docSnap.id, ...(docSnap.data() as Omit<SaleRecord, 'id'>) });
        });
        setSales(records);
        localStorage.setItem(LOCAL_STORAGE_SALES_KEY, JSON.stringify(records));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, salesPath);
      }
    );

    // Subscribe to Expenses
    const expensesQuery = query(collection(db, 'users', userId, 'expenses'), orderBy('date', 'desc'));
    const unsubExpenses = onSnapshot(
      expensesQuery,
      (snapshot) => {
        const records: ExpenseRecord[] = [];
        snapshot.forEach((docSnap) => {
          records.push({ id: docSnap.id, ...(docSnap.data() as Omit<ExpenseRecord, 'id'>) });
        });
        setExpenses(records);
        localStorage.setItem(LOCAL_STORAGE_EXPENSES_KEY, JSON.stringify(records));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, expensesPath);
      }
    );

    // Subscribe to Settings
    const unsubSettings = onSnapshot(
      doc(db, 'users', userId, 'settings', 'general'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as ShopSettings;
          setSettings(data);
          if (data.theme) {
            setTheme(data.theme);
          }
          localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(data));
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, settingsPath);
      }
    );

    // Subscribe to Workers
    const workersQuery = query(collection(db, 'users', userId, 'workers'), orderBy('createdAt', 'desc'));
    const unsubWorkers = onSnapshot(
      workersQuery,
      (snapshot) => {
        const records: WorkerRecord[] = [];
        snapshot.forEach((docSnap) => {
          records.push({ id: docSnap.id, ...(docSnap.data() as Omit<WorkerRecord, 'id'>) });
        });
        setWorkers(records);
        localStorage.setItem(LOCAL_STORAGE_WORKERS_KEY, JSON.stringify(records));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, workersPath);
      }
    );

    // Subscribe to Attendance
    const attendanceQuery = query(collection(db, 'users', userId, 'attendance'), orderBy('date', 'desc'));
    const unsubAttendance = onSnapshot(
      attendanceQuery,
      (snapshot) => {
        const records: AttendanceRecord[] = [];
        snapshot.forEach((docSnap) => {
          records.push({ id: docSnap.id, ...(docSnap.data() as Omit<AttendanceRecord, 'id'>) });
        });
        setAttendance(records);
        localStorage.setItem(LOCAL_STORAGE_ATTENDANCE_KEY, JSON.stringify(records));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, attendancePath);
      }
    );

    // Subscribe to Shop Status
    const shopStatusQuery = query(collection(db, 'users', userId, 'shopStatus'), orderBy('date', 'desc'));
    const unsubShopStatus = onSnapshot(
      shopStatusQuery,
      (snapshot) => {
        const records: ShopStatusRecord[] = [];
        snapshot.forEach((docSnap) => {
          records.push({ id: docSnap.id, ...(docSnap.data() as Omit<ShopStatusRecord, 'id'>) });
        });
        setShopStatuses(records);
        localStorage.setItem(LOCAL_STORAGE_SHOPSTATUS_KEY, JSON.stringify(records));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, shopStatusPath);
      }
    );

    // Subscribe to Salary Advances
    const advancesQuery = query(collection(db, 'users', userId, 'salaryAdvances'), orderBy('date', 'desc'));
    const unsubAdvances = onSnapshot(
      advancesQuery,
      (snapshot) => {
        const records: SalaryAdvance[] = [];
        snapshot.forEach((docSnap) => {
          records.push({ id: docSnap.id, ...(docSnap.data() as Omit<SalaryAdvance, 'id'>) });
        });
        setSalaryAdvances(records);
        localStorage.setItem(LOCAL_STORAGE_ADVANCES_KEY, JSON.stringify(records));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, advancesPath);
      }
    );

    // Subscribe to Salary Payments
    const paymentsQuery = query(collection(db, 'users', userId, 'salaryPayments'), orderBy('paymentDate', 'desc'));
    const unsubPayments = onSnapshot(
      paymentsQuery,
      (snapshot) => {
        const records: SalaryPayment[] = [];
        snapshot.forEach((docSnap) => {
          records.push({ id: docSnap.id, ...(docSnap.data() as Omit<SalaryPayment, 'id'>) });
        });
        setSalaryPayments(records);
        localStorage.setItem(LOCAL_STORAGE_PAYMENTS_KEY, JSON.stringify(records));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, paymentsPath);
      }
    );

    return () => {
      unsubSales();
      unsubExpenses();
      unsubSettings();
      unsubWorkers();
      unsubAttendance();
      unsubShopStatus();
      unsubAdvances();
      unsubPayments();
    };
  }, [user]);

  // Auth actions
  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google Sign In Error:', error);
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign Out Error:', error);
    }
  };

  // Categories list combined
  const categories = useMemo(() => {
    const list = [...DEFAULT_EXPENSE_CATEGORIES];
    if (settings.customCategories && Array.isArray(settings.customCategories)) {
      settings.customCategories.forEach((cat) => {
        if (cat && !list.includes(cat)) {
          list.push(cat);
        }
      });
    }
    return list;
  }, [settings.customCategories]);

  // Sales CRUD
  const addSale = async (amount: number, date: string, note?: string) => {
    const userId = user ? user.uid : 'local-owner';
    const cleanAmount = Math.max(0, Number(amount));
    const nowIso = new Date().toISOString();
    const id = 'sale_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const newRecord: SaleRecord = {
      id,
      userId,
      amount: cleanAmount,
      date,
      ...(note && note.trim() ? { note: note.trim() } : {}),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (user) {
      const path = `users/${userId}/sales/${id}`;
      try {
        const { id: _, ...dataWithoutId } = newRecord;
        await setDoc(doc(db, 'users', userId, 'sales', id), dataWithoutId);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    } else {
      const updated = [newRecord, ...sales];
      setSales(updated);
      localStorage.setItem(LOCAL_STORAGE_SALES_KEY, JSON.stringify(updated));
    }
  };

  const updateSale = async (id: string, amount: number, date: string, note?: string) => {
    const userId = user ? user.uid : 'local-owner';
    const cleanAmount = Math.max(0, Number(amount));
    const existing = sales.find((s) => s.id === id);
    if (!existing) return;

    const nowIso = new Date().toISOString();
    const updatedRecord: SaleRecord = {
      ...existing,
      amount: cleanAmount,
      date,
      ...(note && note.trim() ? { note: note.trim() } : {}),
      updatedAt: nowIso,
    };

    if (!note || !note.trim()) {
      delete updatedRecord.note;
    }

    if (user) {
      const path = `users/${userId}/sales/${id}`;
      try {
        const { id: _, ...dataWithoutId } = updatedRecord;
        await setDoc(doc(db, 'users', userId, 'sales', id), dataWithoutId);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    } else {
      const updated = sales.map((s) => (s.id === id ? updatedRecord : s));
      setSales(updated);
      localStorage.setItem(LOCAL_STORAGE_SALES_KEY, JSON.stringify(updated));
    }
  };

  const deleteSale = async (id: string) => {
    const userId = user ? user.uid : 'local-owner';
    if (user) {
      const path = `users/${userId}/sales/${id}`;
      try {
        await deleteDoc(doc(db, 'users', userId, 'sales', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    } else {
      const updated = sales.filter((s) => s.id !== id);
      setSales(updated);
      localStorage.setItem(LOCAL_STORAGE_SALES_KEY, JSON.stringify(updated));
    }
  };

  // Expenses CRUD
  const addExpense = async (
    name: string,
    amount: number,
    category: string,
    date: string,
    description?: string
  ): Promise<string> => {
    const userId = user ? user.uid : 'local-owner';
    const cleanAmount = Math.max(0, Number(amount));
    const nowIso = new Date().toISOString();
    const id = 'exp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const newRecord: ExpenseRecord = {
      id,
      userId,
      name: name.trim(),
      amount: cleanAmount,
      category: category.trim(),
      date,
      ...(description && description.trim() ? { description: description.trim() } : {}),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (user) {
      const path = `users/${userId}/expenses/${id}`;
      try {
        const { id: _, ...dataWithoutId } = newRecord;
        await setDoc(doc(db, 'users', userId, 'expenses', id), dataWithoutId);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    } else {
      const updated = [newRecord, ...expenses];
      setExpenses(updated);
      localStorage.setItem(LOCAL_STORAGE_EXPENSES_KEY, JSON.stringify(updated));
    }
    return id;
  };

  const updateExpense = async (
    id: string,
    name: string,
    amount: number,
    category: string,
    date: string,
    description?: string
  ) => {
    const userId = user ? user.uid : 'local-owner';
    const cleanAmount = Math.max(0, Number(amount));
    const existing = expenses.find((e) => e.id === id);
    if (!existing) return;

    const nowIso = new Date().toISOString();
    const updatedRecord: ExpenseRecord = {
      ...existing,
      name: name.trim(),
      amount: cleanAmount,
      category: category.trim(),
      date,
      ...(description && description.trim() ? { description: description.trim() } : {}),
      updatedAt: nowIso,
    };

    if (!description || !description.trim()) {
      delete updatedRecord.description;
    }

    if (user) {
      const path = `users/${userId}/expenses/${id}`;
      try {
        const { id: _, ...dataWithoutId } = updatedRecord;
        await setDoc(doc(db, 'users', userId, 'expenses', id), dataWithoutId);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    } else {
      const updated = expenses.map((e) => (e.id === id ? updatedRecord : e));
      setExpenses(updated);
      localStorage.setItem(LOCAL_STORAGE_EXPENSES_KEY, JSON.stringify(updated));
    }
  };

  const deleteExpense = async (id: string) => {
    const userId = user ? user.uid : 'local-owner';
    if (user) {
      const path = `users/${userId}/expenses/${id}`;
      try {
        await deleteDoc(doc(db, 'users', userId, 'expenses', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    } else {
      const updated = expenses.filter((e) => e.id !== id);
      setExpenses(updated);
      localStorage.setItem(LOCAL_STORAGE_EXPENSES_KEY, JSON.stringify(updated));
    }
  };

  // Settings CRUD
  const updateSettings = async (newFields: Partial<ShopSettings>) => {
    const userId = user ? user.uid : 'local-owner';
    const updated: ShopSettings = {
      ...settings,
      ...newFields,
    };
    setSettings(updated);
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(updated));

    if (user) {
      const path = `users/${userId}/settings/general`;
      try {
        await setDoc(doc(db, 'users', userId, 'settings', 'general'), {
          ...updated,
          userId,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  };

  const addCustomCategory = async (categoryName: string) => {
    const trimmed = categoryName.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    const currentCustom = settings.customCategories || [];
    const updated = [...currentCustom, trimmed];
    await updateSettings({ customCategories: updated });
  };

  const removeCustomCategory = async (categoryName: string) => {
    const currentCustom = settings.customCategories || [];
    const updated = currentCustom.filter((c) => c !== categoryName);
    await updateSettings({ customCategories: updated });
  };

  // WORKERS CRUD
  const addWorker = async (data: Omit<WorkerRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const userId = user ? user.uid : 'local-owner';
    const id = 'wrk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const nowIso = new Date().toISOString();

    const newWorker: WorkerRecord = {
      id,
      userId,
      name: data.name.trim(),
      wageType: data.wageType,
      wageAmount: Math.max(0, Number(data.wageAmount)),
      offDayPaid: Boolean(data.offDayPaid),
      prorationMethod: data.prorationMethod || 'calendar_days',
      status: data.status || 'active',
      ...(data.phone && data.phone.trim() ? { phone: data.phone.trim() } : {}),
      ...(data.joiningDate ? { joiningDate: data.joiningDate } : { joiningDate: getTodayDateString() }),
      ...(data.notes && data.notes.trim() ? { notes: data.notes.trim() } : {}),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (user) {
      const path = `users/${userId}/workers/${id}`;
      try {
        const { id: _, ...payload } = newWorker;
        await setDoc(doc(db, 'users', userId, 'workers', id), payload);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    } else {
      const updated = [newWorker, ...workers];
      setWorkers(updated);
      localStorage.setItem(LOCAL_STORAGE_WORKERS_KEY, JSON.stringify(updated));
    }
  };

  const updateWorker = async (id: string, data: Partial<WorkerRecord>) => {
    const userId = user ? user.uid : 'local-owner';
    const existing = workers.find((w) => w.id === id);
    if (!existing) return;

    const nowIso = new Date().toISOString();
    const updatedWorker: WorkerRecord = {
      ...existing,
      ...data,
      updatedAt: nowIso,
    };

    if (user) {
      const path = `users/${userId}/workers/${id}`;
      try {
        const { id: _, ...payload } = updatedWorker;
        await setDoc(doc(db, 'users', userId, 'workers', id), payload);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    } else {
      const updated = workers.map((w) => (w.id === id ? updatedWorker : w));
      setWorkers(updated);
      localStorage.setItem(LOCAL_STORAGE_WORKERS_KEY, JSON.stringify(updated));
    }
  };

  const deleteWorker = async (id: string) => {
    const userId = user ? user.uid : 'local-owner';
    if (user) {
      const path = `users/${userId}/workers/${id}`;
      try {
        await deleteDoc(doc(db, 'users', userId, 'workers', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    } else {
      const updated = workers.filter((w) => w.id !== id);
      setWorkers(updated);
      localStorage.setItem(LOCAL_STORAGE_WORKERS_KEY, JSON.stringify(updated));
    }
  };

  // SHOP STATUS (Open, Holiday, Weekly Off)
  const getShopStatusForDate = (date: string): ShopStatusRecord => {
    const found = shopStatuses.find((s) => s.date === date);
    if (found) return found;
    // Default open
    return {
      id: date,
      userId: user?.uid || 'local-owner',
      date,
      status: 'open',
      isPaid: true,
      createdAt: '',
      updatedAt: '',
    };
  };

  const setShopStatus = async (
    date: string,
    status: ShopOperatingStatus,
    isPaid: boolean,
    holidayName?: string
  ) => {
    const userId = user ? user.uid : 'local-owner';
    const nowIso = new Date().toISOString();
    const record: ShopStatusRecord = {
      id: date,
      userId,
      date,
      status,
      isPaid,
      ...(holidayName && holidayName.trim() ? { holidayName: holidayName.trim() } : {}),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (user) {
      const path = `users/${userId}/shopStatus/${date}`;
      try {
        const { id: _, ...payload } = record;
        await setDoc(doc(db, 'users', userId, 'shopStatus', date), payload);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    } else {
      const filtered = shopStatuses.filter((s) => s.date !== date);
      const updated = [record, ...filtered];
      setShopStatuses(updated);
      localStorage.setItem(LOCAL_STORAGE_SHOPSTATUS_KEY, JSON.stringify(updated));
    }
  };

  const deleteShopStatus = async (date: string) => {
    const userId = user ? user.uid : 'local-owner';
    if (user) {
      const path = `users/${userId}/shopStatus/${date}`;
      try {
        await deleteDoc(doc(db, 'users', userId, 'shopStatus', date));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    } else {
      const filtered = shopStatuses.filter((s) => s.date !== date);
      setShopStatuses(filtered);
      localStorage.setItem(LOCAL_STORAGE_SHOPSTATUS_KEY, JSON.stringify(filtered));
    }
  };

  // ATTENDANCE ACTIONS
  // Unique composite ID `${workerId}_${date}` naturally prevents duplicate records per worker per day
  const recordAttendance = async (
    workerId: string,
    date: string,
    status: AttendanceStatus,
    notes?: string,
    wageMultiplier?: number
  ) => {
    const userId = user ? user.uid : 'local-owner';
    const id = `${workerId}_${date}`;
    const targetWorker = workers.find((w) => w.id === workerId);
    const workerName = targetWorker ? targetWorker.name : '';
    const nowIso = new Date().toISOString();

    const mult = wageMultiplier !== undefined
      ? wageMultiplier
      : status === 'present'
      ? 1.0
      : status === 'half_day'
      ? 0.5
      : 0.0;

    const existing = attendance.find((a) => a.id === id);
    const newRecord: AttendanceRecord = {
      id,
      userId,
      workerId,
      workerName,
      date,
      status,
      wageMultiplier: mult,
      ...(notes && notes.trim() ? { notes: notes.trim() } : {}),
      createdAt: existing ? existing.createdAt : nowIso,
      updatedAt: nowIso,
    };

    if (user) {
      const path = `users/${userId}/attendance/${id}`;
      try {
        const { id: _, ...payload } = newRecord;
        await setDoc(doc(db, 'users', userId, 'attendance', id), payload);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    } else {
      const existingIdx = attendance.findIndex((a) => a.id === id);
      let updated: AttendanceRecord[];
      if (existingIdx >= 0) {
        updated = attendance.map((a, idx) => (idx === existingIdx ? newRecord : a));
      } else {
        updated = [newRecord, ...attendance];
      }
      setAttendance(updated);
      localStorage.setItem(LOCAL_STORAGE_ATTENDANCE_KEY, JSON.stringify(updated));
    }
  };

  // EFFECTIVE ATTENDANCE CALCULATOR FOR A WORKER ON A SPECIFIC DATE
  // Enforces Requirement 1: Every worker automatically defaults to Present on regular working days
  const getEffectiveAttendanceForWorker = (worker: WorkerRecord, date: string) => {
    const shopStat = getShopStatusForDate(date);
    const perDayRate = worker.wageType === 'daily' ? worker.wageAmount : Math.round(worker.wageAmount / 30);

    // If shop is Holiday:
    if (shopStat.status === 'holiday') {
      const multiplier = shopStat.isPaid ? 1.0 : 0.0;
      return {
        status: 'off' as AttendanceStatus,
        multiplier,
        wageEarned: Math.round(perDayRate * multiplier),
        isDefault: true,
        notes: `Shop Holiday: ${shopStat.holidayName || 'Festival/Closure'} (${shopStat.isPaid ? 'Paid' : 'Unpaid'})`,
      };
    }

    // If shop is Weekly Off:
    if (shopStat.status === 'weekly_off') {
      const multiplier = worker.offDayPaid ? 1.0 : (shopStat.isPaid ? 1.0 : 0.0);
      return {
        status: 'off' as AttendanceStatus,
        multiplier,
        wageEarned: Math.round(perDayRate * multiplier),
        isDefault: true,
        notes: `Weekly Off (${multiplier > 0 ? 'Paid' : 'Unpaid'})`,
      };
    }

    // Regular Open day: check recorded attendance
    const recId = `${worker.id}_${date}`;
    const rec = attendance.find((a) => a.id === recId);

    if (rec) {
      const multiplier = rec.wageMultiplier !== undefined
        ? rec.wageMultiplier
        : rec.status === 'present'
        ? 1.0
        : rec.status === 'half_day'
        ? 0.5
        : rec.status === 'off'
        ? (worker.offDayPaid ? 1.0 : 0.0)
        : 0.0;

      return {
        status: rec.status,
        multiplier,
        wageEarned: Math.round(perDayRate * multiplier),
        isDefault: false,
        notes: rec.notes,
      };
    }

    // Default to PRESENT (Requirement 1: Automatically marked Present for each new working day)
    return {
      status: 'present' as AttendanceStatus,
      multiplier: 1.0,
      wageEarned: perDayRate,
      isDefault: true,
    };
  };

  // DAILY WAGES ACCRUAL CALCULATION FOR SELECTED DATE
  const calculateDailyWages = (date: string): DailyWageCalculation => {
    const shopStat = getShopStatusForDate(date);
    const active = workers.filter((w) => w.status === 'active');

    let totalWages = 0;
    let presentCount = 0;
    let halfDayCount = 0;
    let absentCount = 0;
    let offCount = 0;

    const workerRows = active.map((worker) => {
      const eff = getEffectiveAttendanceForWorker(worker, date);
      totalWages += eff.wageEarned;

      if (eff.status === 'present') presentCount += 1;
      else if (eff.status === 'half_day') halfDayCount += 1;
      else if (eff.status === 'absent') absentCount += 1;
      else if (eff.status === 'off') offCount += 1;

      return {
        worker,
        status: eff.status,
        multiplier: eff.multiplier,
        wageEarned: eff.wageEarned,
        isDefault: eff.isDefault,
      };
    });

    return {
      totalWages,
      activeWorkerCount: active.length,
      presentCount,
      halfDayCount,
      absentCount,
      offCount,
      shopStatus: shopStat,
      workerRows,
    };
  };

  // MONTHLY SALARY SUMMARY ENGINE - Strictly calculates wages up to current date (Requirement 2)
  const calculateWorkerSalaryForMonth = (worker: WorkerRecord, month: string): WorkerSalarySummary => {
    const today = getTodayDateString(); // e.g. '2026-10-29'
    const todayMonth = today.substring(0, 7); // '2026-10'
    const todayDay = parseInt(today.split('-')[2], 10); // 29

    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);
    const totalDaysInMonth = new Date(year, monthNum, 0).getDate();

    let calculationEndDay = totalDaysInMonth;
    let isFutureMonth = false;

    if (month > todayMonth) {
      calculationEndDay = 0;
      isFutureMonth = true;
    } else if (month === todayMonth) {
      calculationEndDay = Math.min(todayDay, totalDaysInMonth);
      isFutureMonth = false;
    } else {
      calculationEndDay = totalDaysInMonth;
      isFutureMonth = false;
    }

    const calculationEndDate = calculationEndDay > 0
      ? `${year}-${String(monthNum).padStart(2, '0')}-${String(calculationEndDay).padStart(2, '0')}`
      : 'None';

    let runningDaysInPeriod = 0;
    let presentDays = 0;
    let halfDays = 0;
    let absentDays = 0;
    let paidOffDays = 0;
    let unpaidOffDays = 0;
    let paidHolidays = 0;
    let unpaidHolidays = 0;

    for (let day = 1; day <= calculationEndDay; day++) {
      const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const shopStat = getShopStatusForDate(dateStr);

      if (shopStat.status === 'holiday') {
        if (shopStat.isPaid) paidHolidays += 1;
        else unpaidHolidays += 1;
        continue;
      }

      if (shopStat.status === 'weekly_off') {
        if (worker.offDayPaid || shopStat.isPaid) paidOffDays += 1;
        else unpaidOffDays += 1;
        continue;
      }

      // Shop is open => this is a normal running working day
      runningDaysInPeriod += 1;

      // Open day: check recorded attendance or default to Present (Requirement 1)
      const recId = `${worker.id}_${dateStr}`;
      const rec = attendance.find((a) => a.id === recId);

      if (rec) {
        if (rec.status === 'present') presentDays += 1;
        else if (rec.status === 'half_day') halfDays += 1;
        else if (rec.status === 'absent') absentDays += 1;
        else if (rec.status === 'off') {
          if (worker.offDayPaid) paidOffDays += 1;
          else unpaidOffDays += 1;
        }
      } else {
        // Automatic Default: Present on working days
        presentDays += 1;
      }
    }

    // Running days worked strictly on open shop days: Present + 0.5 * Half Day
    const runningDaysWorked = presentDays + (halfDays * 0.5);

    // Effective paid days include worked running days plus paid holidays and paid off days
    const effectivePaidDays = runningDaysWorked + paidHolidays + paidOffDays;

    let grossSalaryEarned = 0;
    if (calculationEndDay > 0) {
      if (worker.wageType === 'daily') {
        grossSalaryEarned = Math.round(effectivePaidDays * worker.wageAmount);
      } else {
        const method = worker.prorationMethod || 'calendar_days';
        let divisor = totalDaysInMonth;
        if (method === 'fixed_30') divisor = 30;
        else if (method === 'working_26') divisor = 26;

        const perDayRate = worker.wageAmount / divisor;
        grossSalaryEarned = Math.round(effectivePaidDays * perDayRate);
      }
    }

    // Advances and Deductions in this month
    const workerAdvances = salaryAdvances.filter(
      (adv) => adv.workerId === worker.id && adv.date.startsWith(month)
    );

    const totalAdvances = workerAdvances
      .filter((a) => a.type === 'advance')
      .reduce((sum, a) => sum + a.amount, 0);

    const totalDeductions = workerAdvances
      .filter((a) => a.type === 'deduction')
      .reduce((sum, a) => sum + a.amount, 0);

    const finalPayable = Math.max(0, grossSalaryEarned - totalAdvances - totalDeductions);

    // Payments already made for this month
    const monthPayments = salaryPayments.filter(
      (p) => p.workerId === worker.id && p.month === month
    );
    const paidAmount = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    const remainingPayable = Math.max(0, finalPayable - paidAmount);
    const isSettled = paidAmount >= finalPayable && finalPayable > 0;

    return {
      worker,
      month,
      calendarDays: totalDaysInMonth,
      runningDaysInPeriod,
      runningDaysWorked,
      calculationEndDay,
      calculationEndDate,
      isFutureMonth,
      presentDays,
      halfDays,
      absentDays,
      paidOffDays,
      unpaidOffDays,
      paidHolidays,
      unpaidHolidays,
      effectivePaidDays,
      unmarkedDays: 0,
      baseWage: worker.wageAmount,
      grossSalaryEarned,
      totalAdvances,
      totalDeductions,
      finalPayable,
      paidAmount,
      remainingPayable,
      isSettled,
    };
  };

  // SALARY ADVANCES & DEDUCTIONS
  const recordAdvanceOrDeduction = async (
    workerId: string,
    amount: number,
    type: 'advance' | 'deduction',
    date: string,
    reason?: string
  ) => {
    const userId = user ? user.uid : 'local-owner';
    const id = 'adv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const targetWorker = workers.find((w) => w.id === workerId);
    const nowIso = new Date().toISOString();

    const newAdvance: SalaryAdvance = {
      id,
      userId,
      workerId,
      workerName: targetWorker?.name || '',
      amount: Math.max(0, Number(amount)),
      type,
      date,
      ...(reason && reason.trim() ? { reason: reason.trim() } : {}),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (user) {
      const path = `users/${userId}/salaryAdvances/${id}`;
      try {
        const { id: _, ...payload } = newAdvance;
        await setDoc(doc(db, 'users', userId, 'salaryAdvances', id), payload);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    } else {
      const updated = [newAdvance, ...salaryAdvances];
      setSalaryAdvances(updated);
      localStorage.setItem(LOCAL_STORAGE_ADVANCES_KEY, JSON.stringify(updated));
    }
  };

  const deleteAdvanceOrDeduction = async (id: string) => {
    const userId = user ? user.uid : 'local-owner';
    if (user) {
      const path = `users/${userId}/salaryAdvances/${id}`;
      try {
        await deleteDoc(doc(db, 'users', userId, 'salaryAdvances', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    } else {
      const updated = salaryAdvances.filter((a) => a.id !== id);
      setSalaryAdvances(updated);
      localStorage.setItem(LOCAL_STORAGE_ADVANCES_KEY, JSON.stringify(updated));
    }
  };

  // SALARY SETTLEMENT / PAYMENT RECORDING
  const recordSalaryPayment = async (
    workerId: string,
    month: string,
    amount: number,
    paymentDate: string,
    notes?: string,
    syncToExpenses = true
  ) => {
    const userId = user ? user.uid : 'local-owner';
    const id = `pay_${workerId}_${month}_${Date.now()}`;
    const targetWorker = workers.find((w) => w.id === workerId);
    const workerName = targetWorker ? targetWorker.name : 'Worker';
    const nowIso = new Date().toISOString();

    let createdExpenseId: string | undefined = undefined;

    // Synchronize payment into business expenses collection only if confirmed
    if (syncToExpenses) {
      createdExpenseId = await addExpense(
        `Salary Payment: ${workerName}`,
        amount,
        'Staff salary',
        paymentDate,
        `Settled wages for month ${month}. ${notes || ''}`
      );
    }

    const newPayment: SalaryPayment = {
      id,
      userId,
      workerId,
      workerName,
      month,
      amount: Math.max(0, Number(amount)),
      paymentDate,
      ...(createdExpenseId ? { expenseId: createdExpenseId } : {}),
      ...(notes && notes.trim() ? { notes: notes.trim() } : {}),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (user) {
      const path = `users/${userId}/salaryPayments/${id}`;
      try {
        const { id: _, ...payload } = newPayment;
        await setDoc(doc(db, 'users', userId, 'salaryPayments', id), payload);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    } else {
      const updated = [newPayment, ...salaryPayments];
      setSalaryPayments(updated);
      localStorage.setItem(LOCAL_STORAGE_PAYMENTS_KEY, JSON.stringify(updated));
    }
  };

  const seedDemoDataIfEmpty = async () => {
    const userId = user ? user.uid : 'local-owner';
    const sampleWorkers = getInitialSampleWorkers(userId);

    if (user) {
      for (const w of sampleWorkers) {
        const { id, ...data } = w;
        await setDoc(doc(db, 'users', userId, 'workers', id), data);
      }
    } else {
      setWorkers(sampleWorkers);
      localStorage.setItem(LOCAL_STORAGE_WORKERS_KEY, JSON.stringify(sampleWorkers));
    }
  };

  // Aggregated Computations
  const today = getTodayDateString();
  const currentMonthPrefix = today.substring(0, 7); // YYYY-MM

  const todaySalesTotal = useMemo(() => {
    return sales
      .filter((s) => s.date === today)
      .reduce((sum, s) => sum + s.amount, 0);
  }, [sales, today]);

  const todayExpensesTotal = useMemo(() => {
    return expenses
      .filter((e) => e.date === today)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, today]);

  const todayEstimatedProfit = todaySalesTotal - todayExpensesTotal;

  const thisMonthSalesTotal = useMemo(() => {
    return sales
      .filter((s) => s.date.startsWith(currentMonthPrefix))
      .reduce((sum, s) => sum + s.amount, 0);
  }, [sales, currentMonthPrefix]);

  const thisMonthExpensesTotal = useMemo(() => {
    return expenses
      .filter((e) => e.date.startsWith(currentMonthPrefix))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, currentMonthPrefix]);

  const thisMonthEstimatedProfit = thisMonthSalesTotal - thisMonthExpensesTotal;

  // Week expenses
  const thisWeekExpensesTotal = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    const startWeek = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return expenses
      .filter((e) => e.date >= startWeek && e.date <= today)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, today]);

  // Combined daily summaries map
  const dailySummariesMap = useMemo(() => {
    const map = new Map<string, DailySummary>();

    sales.forEach((s) => {
      const existing = map.get(s.date) || {
        date: s.date,
        totalSales: 0,
        salesCount: 0,
        totalExpenses: 0,
        expenseCount: 0,
        estimatedProfit: 0,
        isLoss: false,
      };
      existing.totalSales += s.amount;
      existing.salesCount += 1;
      existing.estimatedProfit = existing.totalSales - existing.totalExpenses;
      existing.isLoss = existing.estimatedProfit < 0;
      map.set(s.date, existing);
    });

    expenses.forEach((e) => {
      const existing = map.get(e.date) || {
        date: e.date,
        totalSales: 0,
        salesCount: 0,
        totalExpenses: 0,
        expenseCount: 0,
        estimatedProfit: 0,
        isLoss: false,
      };
      existing.totalExpenses += e.amount;
      existing.expenseCount += 1;
      existing.estimatedProfit = existing.totalSales - existing.totalExpenses;
      existing.isLoss = existing.estimatedProfit < 0;
      map.set(e.date, existing);
    });

    return map;
  }, [sales, expenses]);

  return (
    <AppContext.Provider
      value={{
        user,
        authLoading,
        activeTab,
        setActiveTab,
        sales,
        expenses,
        workers,
        attendance,
        shopStatuses,
        salaryAdvances,
        salaryPayments,
        settings,
        categories,
        theme,
        setTheme,
        isAddSaleOpen,
        setIsAddSaleOpen,
        isAddExpenseOpen,
        setIsAddExpenseOpen,
        editingSale,
        setEditingSale,
        editingExpense,
        setEditingExpense,
        isAddWorkerOpen,
        setIsAddWorkerOpen,
        editingWorker,
        setEditingWorker,
        isRecordPaymentOpen,
        setIsRecordPaymentOpen,
        paymentWorkerTarget,
        setPaymentWorkerTarget,
        signInWithGoogle,
        signOutUser,
        addSale,
        updateSale,
        deleteSale,
        addExpense,
        updateExpense,
        deleteExpense,
        updateSettings,
        addCustomCategory,
        removeCustomCategory,
        addWorker,
        updateWorker,
        deleteWorker,
        recordAttendance,
        getShopStatusForDate,
        setShopStatus,
        deleteShopStatus,
        getEffectiveAttendanceForWorker,
        calculateDailyWages,
        calculateWorkerSalaryForMonth,
        recordAdvanceOrDeduction,
        deleteAdvanceOrDeduction,
        recordSalaryPayment,
        todaySalesTotal,
        todayExpensesTotal,
        todayEstimatedProfit,
        thisMonthSalesTotal,
        thisMonthExpensesTotal,
        thisMonthEstimatedProfit,
        thisWeekExpensesTotal,
        dailySummariesMap,
        isFirestoreConnected,
        seedDemoDataIfEmpty,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
