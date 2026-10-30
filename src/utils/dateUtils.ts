import { DateFilterPreset } from '../types';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatRupee(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }
  const isNegative = amount < 0;
  const abs = Math.abs(Math.round(amount));
  const formatted = new Intl.NumberFormat('en-IN').format(abs);
  return isNegative ? `-₹${formatted}` : `₹${formatted}`;
}

export function formatDisplayDate(dateString: string): string {
  if (!dateString) return '';
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  if (dateString === today) {
    return 'Today';
  }
  if (dateString === yesterday) {
    return 'Yesterday';
  }

  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  } catch {
    // fallback
  }
  return dateString;
}

export function formatFullDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  } catch {
    // fallback
  }
  return dateString;
}

export function getDateRangeForPreset(
  preset: DateFilterPreset,
  customStart?: string,
  customEnd?: string
): { startDate: string; endDate: string; label: string } {
  const today = getTodayDateString();
  const now = new Date();

  switch (preset) {
    case 'today':
      return { startDate: today, endDate: today, label: 'Today' };

    case 'yesterday': {
      const y = getYesterdayDateString();
      return { startDate: y, endDate: y, label: 'Yesterday' };
    }

    case 'last7days': {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return { startDate: start, endDate: today, label: 'Last 7 Days' };
    }

    case 'thisMonth': {
      const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      return { startDate: start, endDate: today, label: 'This Month' };
    }

    case 'previousMonth': {
      const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const start = `${firstDayPrevMonth.getFullYear()}-${String(firstDayPrevMonth.getMonth() + 1).padStart(2, '0')}-01`;
      const end = `${lastDayPrevMonth.getFullYear()}-${String(lastDayPrevMonth.getMonth() + 1).padStart(2, '0')}-${String(lastDayPrevMonth.getDate()).padStart(2, '0')}`;
      return { startDate: start, endDate: end, label: 'Previous Month' };
    }

    case 'custom': {
      const start = customStart || today;
      const end = customEnd || today;
      return { startDate: start, endDate: end, label: `${start} to ${end}` };
    }

    default:
      return { startDate: today, endDate: today, label: 'Today' };
  }
}

export function isDateInRange(dateString: string, startDate: string, endDate: string): boolean {
  if (!dateString) return false;
  return dateString >= startDate && dateString <= endDate;
}

export function getThisWeekRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday
  const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - distanceToMonday);
  
  const start = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
  const today = getTodayDateString();
  return { startDate: start, endDate: today };
}
