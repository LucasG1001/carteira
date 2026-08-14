import type { BackendExpenseEntry, BackendExpenseSummary } from '../services/api';
import { monthLabel } from './date';

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

export function isLocked(entry: BackendExpenseEntry): boolean {
  return entry.is_recurring || (entry.installments || 1) > 1;
}

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
      if (isLocked(entry)) fixed += value;
      else variable += value;
    }
  }
  fixed = round2(fixed);
  variable = round2(variable);
  const total = round2(fixed + variable);
  const fixedPct = total > 0 ? (fixed / total) * 100 : 0;

  return {
    barSeries,
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

export type GroupBy = 'sub' | 'category' | 'desc' | 'origem';

export interface ScopeTotals {
  total: number;
  locked: number;
  free: number;
  count: number;
  lockedCount: number;
  freeCount: number;
}

export interface BreakdownGroup {
  name: string;
  total: number;
  pct: number;
  count: number;
  lockedCount: number;
}

export interface LockedMonth {
  key: string;
  label: string;
  total: number;
}

export interface PacePoint {
  key: string;
  label: string;
  total: number;
  isFuture: boolean;
  isSelected: boolean;
}

function expensesOf(entries: BackendExpenseEntry[]): BackendExpenseEntry[] {
  return entries.filter((entry) => entry.type === 'expense');
}

function monthsOf(month: number | null): number[] {
  return month ? [month] : ALL_MONTHS;
}

export function monthTotal(entries: BackendExpenseEntry[], year: number, month: number): number {
  return round2(sumMonth(expensesOf(entries), year, month));
}

export function scopeTotals(
  entries: BackendExpenseEntry[],
  year: number,
  month: number | null,
): ScopeTotals {
  const months = monthsOf(month);
  let locked = 0;
  let free = 0;
  const lockedIds = new Set<number>();
  const freeIds = new Set<number>();

  for (const entry of expensesOf(entries)) {
    for (const m of months) {
      const value = monthContribution(entry, year, m);
      if (value <= 0) continue;
      if (isLocked(entry)) {
        locked += value;
        lockedIds.add(entry.id);
      } else {
        free += value;
        freeIds.add(entry.id);
      }
    }
  }

  return {
    total: round2(locked + free),
    locked: round2(locked),
    free: round2(free),
    count: lockedIds.size + freeIds.size,
    lockedCount: lockedIds.size,
    freeCount: freeIds.size,
  };
}

const GROUP_KEYS: Record<GroupBy, (entry: BackendExpenseEntry) => string> = {
  sub: (entry) => entry.subcategory || 'Outros',
  category: (entry) => entry.category,
  desc: (entry) => entry.description || 'Sem descrição',
  origem: (entry) => entry.payment_method || 'Não informada',
};

export function groupBreakdown(
  entries: BackendExpenseEntry[],
  year: number,
  month: number | null,
  groupBy: GroupBy,
): BreakdownGroup[] {
  const months = monthsOf(month);
  const keyOf = GROUP_KEYS[groupBy];
  const groups = new Map<string, { total: number; ids: Set<number>; lockedIds: Set<number> }>();

  for (const entry of expensesOf(entries)) {
    for (const m of months) {
      const value = monthContribution(entry, year, m);
      if (value <= 0) continue;
      const key = keyOf(entry);
      const group = groups.get(key) ?? { total: 0, ids: new Set(), lockedIds: new Set() };
      group.total += value;
      group.ids.add(entry.id);
      if (isLocked(entry)) group.lockedIds.add(entry.id);
      groups.set(key, group);
    }
  }

  const total = [...groups.values()].reduce((sum, group) => sum + group.total, 0);

  return [...groups.entries()]
    .map(([name, group]) => ({
      name,
      total: round2(group.total),
      pct: total > 0 ? (group.total / total) * 100 : 0,
      count: group.ids.size,
      lockedCount: group.lockedIds.size,
    }))
    .sort((a, b) => b.total - a.total);
}

export function lockedContribution(
  entry: BackendExpenseEntry,
  year: number,
  month: number,
): number {
  const [startYear, startMonth] = entry.date.split('-').map(Number);
  const absolute = year * 12 + (month - 1);
  const startAbsolute = startYear * 12 + (startMonth - 1);
  if (absolute < startAbsolute) return 0;

  const amount = entry.amount || 0;

  if (entry.is_recurring) {
    const recurrence = entry.recurrence || 'monthly';
    if (recurrence === 'yearly') return month === startMonth ? amount : 0;
    if (recurrence === 'weekly') return amount * 4;
    return amount;
  }

  const installments = entry.installments || 1;
  if (installments > 1) {
    return absolute - startAbsolute < installments ? amount / installments : 0;
  }

  return 0;
}

export function lockedAhead(
  entries: BackendExpenseEntry[],
  year: number,
  month: number,
  count = 6,
): LockedMonth[] {
  const locked = expensesOf(entries).filter(isLocked);
  const points: LockedMonth[] = [];

  for (let step = 1; step <= count; step += 1) {
    const absolute = year * 12 + (month - 1) + step;
    const pointYear = Math.floor(absolute / 12);
    const pointMonth = (absolute % 12) + 1;
    let total = 0;
    for (const entry of locked) total += lockedContribution(entry, pointYear, pointMonth);
    const key = `${pointYear}-${String(pointMonth).padStart(2, '0')}`;
    points.push({ key, label: monthLabel(key), total: round2(total) });
  }

  return points;
}

export function paceSeries(
  entries: BackendExpenseEntry[],
  year: number,
  month: number | null,
): PacePoint[] {
  const expenses = expensesOf(entries);
  const now = new Date();
  const currentAbsolute = now.getFullYear() * 12 + now.getMonth();

  const build = (pointYear: number, pointMonth: number, selected: boolean): PacePoint => {
    const key = `${pointYear}-${String(pointMonth).padStart(2, '0')}`;
    const isFuture = pointYear * 12 + (pointMonth - 1) > currentAbsolute;
    let total = 0;
    for (const entry of expenses) {
      total += isFuture
        ? lockedContribution(entry, pointYear, pointMonth)
        : monthContribution(entry, pointYear, pointMonth);
    }
    return {
      key,
      label: monthLabel(key),
      total: round2(total),
      isFuture,
      isSelected: selected,
    };
  };

  if (!month) return ALL_MONTHS.map((m) => build(year, m, false));

  const base = year * 12 + (month - 1);
  return Array.from({ length: 7 }, (_, index) => {
    const absolute = base - 2 + index;
    return build(Math.floor(absolute / 12), (absolute % 12) + 1, index === 2);
  });
}

export function trailingAverages(
  entries: BackendExpenseEntry[],
  year: number,
  month: number,
  monthsBack = 12,
): { total: number; locked: number; free: number } {
  const expenses = expensesOf(entries);
  let total = 0;
  let locked = 0;
  let free = 0;
  let counted = 0;

  for (let step = 0; step < monthsBack; step += 1) {
    const absolute = year * 12 + (month - 1) - step;
    const pointYear = Math.floor(absolute / 12);
    const pointMonth = (absolute % 12) + 1;
    let monthSumTotal = 0;
    for (const entry of expenses) {
      const value = monthContribution(entry, pointYear, pointMonth);
      if (value <= 0) continue;
      monthSumTotal += value;
      if (isLocked(entry)) locked += value;
      else free += value;
    }
    if (monthSumTotal > 0) counted += 1;
    total += monthSumTotal;
  }

  const divisor = counted || 1;
  return {
    total: round2(total / divisor),
    locked: round2(locked / divisor),
    free: round2(free / divisor),
  };
}

export function donutData(
  data: BackendExpenseSummary,
  filter: ExpenseFilter,
  category: string | null,
): CategoryTotal[] {
  const { year, month } = filter;
  const months = month ? [month] : ALL_MONTHS;
  const expenses = data.entries.filter(
    (entry) => entry.type === 'expense' && (category === null || entry.category === category),
  );
  return aggregate(expenses, year, months, (entry) =>
    category === null ? entry.category : entry.subcategory || 'Outros',
  );
}
