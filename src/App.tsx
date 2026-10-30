import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { SalesPage } from './components/SalesPage';
import { ExpensesPage } from './components/ExpensesPage';
import { AttendancePage } from './components/AttendancePage';
import { ProfitCalculator } from './components/ProfitCalculator';
import { HistoryPage } from './components/HistoryPage';
import { ReportsPage } from './components/ReportsPage';
import { SettingsPage } from './components/SettingsPage';
import { AddSaleModal } from './components/modals/AddSaleModal';
import { AddExpenseModal } from './components/modals/AddExpenseModal';
import { EditRecordModal } from './components/modals/EditRecordModal';
import { AddWorkerModal } from './components/modals/AddWorkerModal';
import { RecordSalaryPaymentModal } from './components/modals/RecordSalaryPaymentModal';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="flex min-h-screen bg-[#FAF7F2] dark:bg-[#14100D] transition-colors">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'sales' && <SalesPage />}
          {activeTab === 'expenses' && <ExpensesPage />}
          {activeTab === 'attendance' && <AttendancePage />}
          {activeTab === 'profit' && <ProfitCalculator />}
          {activeTab === 'history' && <HistoryPage />}
          {activeTab === 'reports' && <ReportsPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global Modals */}
      <AddSaleModal />
      <AddExpenseModal />
      <EditRecordModal />
      <AddWorkerModal />
      <RecordSalaryPaymentModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
