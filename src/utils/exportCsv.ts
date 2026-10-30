import { SaleRecord, ExpenseRecord } from '../types';

function downloadFile(content: string, fileName: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportSalesToCsv(sales: SaleRecord[], filenamePrefix = 'tea_shop_sales'): void {
  const headers = ['Date', 'Amount (INR)', 'Note', 'Record ID', 'Created At'];
  const rows = sales.map((sale) => [
    `"${sale.date}"`,
    sale.amount,
    `"${(sale.note || '').replace(/"/g, '""')}"`,
    `"${sale.id}"`,
    `"${sale.createdAt}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(csvContent, `${filenamePrefix}_${dateStr}.csv`, 'text/csv;charset=utf-8;');
}

export function exportExpensesToCsv(expenses: ExpenseRecord[], filenamePrefix = 'tea_shop_expenses'): void {
  const headers = ['Date', 'Expense Name', 'Category', 'Amount (INR)', 'Description', 'Record ID', 'Created At'];
  const rows = expenses.map((exp) => [
    `"${exp.date}"`,
    `"${exp.name.replace(/"/g, '""')}"`,
    `"${exp.category.replace(/"/g, '""')}"`,
    exp.amount,
    `"${(exp.description || '').replace(/"/g, '""')}"`,
    `"${exp.id}"`,
    `"${exp.createdAt}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(csvContent, `${filenamePrefix}_${dateStr}.csv`, 'text/csv;charset=utf-8;');
}

export function exportFinancialSummaryToCsv(
  dailySummaries: Array<{
    date: string;
    totalSales: number;
    totalExpenses: number;
    estimatedProfit: number;
    isLoss: boolean;
  }>,
  rangeLabel = 'Summary'
): void {
  const headers = ['Date', 'Sales (INR)', 'Expenses (INR)', 'Estimated Profit / Loss (INR)', 'Status'];
  const rows = dailySummaries.map((item) => [
    `"${item.date}"`,
    item.totalSales,
    item.totalExpenses,
    item.estimatedProfit,
    item.isLoss ? '"Loss"' : '"Profit"',
  ]);

  // Total summary footer
  const totalSales = dailySummaries.reduce((acc, curr) => acc + curr.totalSales, 0);
  const totalExpenses = dailySummaries.reduce((acc, curr) => acc + curr.totalExpenses, 0);
  const netProfit = totalSales - totalExpenses;
  rows.push([
    '"TOTAL"',
    totalSales,
    totalExpenses,
    netProfit,
    netProfit < 0 ? '"Net Loss"' : '"Net Profit"',
  ]);

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(csvContent, `tea_shop_${rangeLabel.toLowerCase().replace(/\s+/g, '_')}_${dateStr}.csv`, 'text/csv;charset=utf-8;');
}

export function exportAttendanceMonthlyToCsv(
  summaries: Array<{
    workerName: string;
    phone?: string;
    wageType: string;
    baseWage: number;
    calendarDays: number;
    runningDaysWorked?: number;
    presentDays: number;
    halfDays?: number;
    absentDays: number;
    paidOffDays: number;
    unpaidOffDays: number;
    paidHolidays?: number;
    unpaidHolidays?: number;
    effectivePaidDays?: number;
    grossSalaryEarned: number;
    totalAdvances: number;
    totalDeductions: number;
    finalPayable: number;
    paidAmount: number;
    remainingPayable: number;
  }>,
  month: string
): void {
  const headers = [
    'Worker Name',
    'Phone',
    'Wage Type',
    'Base Wage (INR)',
    'Month Days',
    'Present Days (100%)',
    'Half Days (50%)',
    'Absent Days (0%)',
    'Paid Off Days',
    'Paid Holidays',
    'Effective Paid Days',
    'Gross Earned (INR)',
    'Advances Taken (INR)',
    'Deductions (INR)',
    'Net Payable (INR)',
    'Settled Paid (INR)',
    'Balance Due (INR)',
  ];

  const rows = summaries.map((s) => [
    `"${s.workerName.replace(/"/g, '""')}"`,
    `"${s.phone || '-'}"`,
    `"${s.wageType.toUpperCase()}"`,
    s.baseWage,
    s.calendarDays,
    s.presentDays,
    s.halfDays ?? 0,
    s.absentDays,
    s.paidOffDays,
    s.paidHolidays ?? 0,
    s.effectivePaidDays ?? (s.presentDays + (s.halfDays || 0) * 0.5 + s.paidOffDays),
    s.grossSalaryEarned,
    s.totalAdvances,
    s.totalDeductions,
    s.finalPayable,
    s.paidAmount,
    s.remainingPayable,
  ]);

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  downloadFile(csvContent, `worker_attendance_salary_${month}.csv`, 'text/csv;charset=utf-8;');
}


