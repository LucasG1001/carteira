import type { BackendExpenseEntry, BackendExpenseSummary } from '../services/api';

export interface MonthPoint {
  month: string;
  expense: number;
}

export interface CategoryTotal {
  category: string;
  total: number;
}

export interface MonthScope {
  monthKey: string;
  month: number;
  expense: number;
  variationPct: number | null;
  byCategory: CategoryTotal[];
}

export interface FixedVariable {
  fixed: number;
  variable: number;
  total: number;
  fixedPct: number;
}

export interface ExpenseView {
  barSeries: MonthPoint[];
  donutByCategory: CategoryTotal[];
  donutBySubcategory: CategoryTotal[];
  monthScope: MonthScope;
  yearExpense: number;
  yearTopSubcategory: { name: string; total: number } | null;
  yearAvgMonthly: number;
  fixedVariable: FixedVariable;
}

export interface ExpenseFilter {
  year: number;
  month: number | null;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

const ALL_MONTHS: number[] = Array.from({ length: 12 }, (_, i) => i + 1);

export function monthContribution(entry: BackendExpenseEntry, year: number, month: number): number {
  const [startYear, startMonth] = entry.date.split('-').map(Number);
  if (year < startYear || (year === startYear && month < startMonth)) return 0;

  const amount = entry.amount || 0;

  if (entry.is_recurring) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    if (year > currentYear || (year === currentYear && month > currentMonth)) return 0;
    const recurrence = entry.recurrence || 'monthly';
    if (recurrence === 'yearly') return month === startMonth ? amount : 0;
    if (recurrence === 'weekly') return amount * 4;
    return amount;
  }

  const installments = entry.installments || 1;
  if (installments > 1) {
    const monthsDiff = (year - startYear) * 12 + (month - startMonth);
    if (monthsDiff >= 0 && monthsDiff < installments) return amount / installments;
    return 0;
  }

  if (year === startYear && month === startMonth) return amount;
  return 0;
}

export function availableYears(entries: BackendExpenseEntry[]): number[] {
  const years = new Set<number>();
  years.add(new Date().getFullYear());
  for (const entry of entries) years.add(Number(entry.date.split('-')[0]));
  return Array.from(years).sort((a, b) => b - a);
}

function aggregate(
  expenses: BackendExpenseEntry[],
  year: number,
  months: number[],
  keyFn: (entry: BackendExpenseEntry) => string,
): CategoryTotal[] {
  const totals: Record<string, number> = {};
  for (const entry of expenses) {
    for (const month of months) {
      const value = monthContribution(entry, year, month);
      if (value <= 0) continue;
      const key = keyFn(entry);
      totals[key] = (totals[key] || 0) + value;
    }
  }
  return Object.entries(totals)
    .map(([category, total]) => ({ category, total: round2(total) }))
    .sort((a, b) => b.total - a.total);
}

function sumMonth(expenses: BackendExpenseEntry[], year: number, month: number): number {
  let total = 0;
  for (const entry of expenses) total += monthContribution(entry, year, month);
  return total;
}

function latestMonthOf(year: number, barSeries: MonthPoint[]): number {
  const now = new Date();
  if (year === now.getFullYear()) return now.getMonth() + 1;
  for (let month = 12; month >= 1; month -= 1) {
    if (barSeries[month - 1].expense > 0) return month;
  }
  return 12;
}

export function buildExpenseView(data: BackendExpenseSummary, filter: ExpenseFilter): ExpenseView {
  const { year, month } = filter;
  const expenses = data.entries.filter((entry) => entry.type === 'expense');

  const barSeries: MonthPoint[] = ALL_MONTHS.map((m) => ({
    month: `${year}-${String(m).padStart(2, '0')}`,
    expense: round2(sumMonth(expenses, year, m)),
  }));

  const yearExpense = round2(barSeries.reduce((sum, point) => sum + point.expense, 0));
  const activeMonths = barSeries.filter((point) => point.expense > 0).length;
  const yearAvgMonthly = activeMonths ? round2(yearExpense / activeMonths) : 0;

  const scopeMonths = month ? [month] : ALL_MONTHS;
  const donutByCategory = aggregate(expenses, year, scopeMonths, (entry) => entry.category);
  const donutBySubcategory = aggregate(expenses, year, scopeMonths, (entry) => entry.subcategory || 'Outros');

  const scopeMonth = month ?? latestMonthOf(year, barSeries);
  const monthExpense = round2(sumMonth(expenses, year, scopeMonth));
  const prevMonthExpense = scopeMonth > 1 ? sumMonth(expenses, year, scopeMonth - 1) : null;
  const variationPct =
    prevMonthExpense && prevMonthExpense > 0
      ? ((monthExpense - prevMonthExpense) / prevMonthExpense) * 100
      : null;
  const monthByCategory = aggregate(expenses, year, [scopeMonth], (entry) => entry.category);

  const yearBySubcategory = aggregate(expenses, year, ALL_MONTHS, (entry) => entry.subcategory || 'Outros');
  const yearTopSubcategory = yearBySubcategory.length
    ? { name: yearBySubcategory[0].category, total: yearBySubcategory[0].total }
    : null;

  let fixed = 0;
  let variable = 0;
  for (const entry of expenses) {
    for (const m of scopeMonths) {
      const value = monthContribution(entry, year, m);
      if (value <= 0) continue;
      if (entry.is_recurring) fixed += value;
      else variable += value;
    }
  }
  fixed = round2(fixed);
  variable = round2(variable);
  const total = round2(fixed + variable);
  const fixedPct = total > 0 ? (fixed / total) * 100 : 0;

  return {
    barSeries,
    donutByCategory,
    donutBySubcategory,
    monthScope: {
      monthKey: `${year}-${String(scopeMonth).padStart(2, '0')}`,
      month: scopeMonth,
      expense: monthExpense,
      variationPct,
      byCategory: monthByCategory,
    },
    yearExpense,
    yearTopSubcategory,
    yearAvgMonthly,
    fixedVariable: { fixed, variable, total, fixedPct },
  };
}
