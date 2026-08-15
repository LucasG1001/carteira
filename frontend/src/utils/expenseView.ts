import type { BackendExpenseEntry } from '../services/api';
import { monthLabel } from './date';

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

function sumMonth(expenses: BackendExpenseEntry[], year: number, month: number): number {
  let total = 0;
  for (const entry of expenses) total += monthContribution(entry, year, month);
  return total;
}

export type GroupBy = 'grupo' | 'destino' | 'classificacao' | 'desc' | 'origem';

export const SEM_DESTINO = 'Sem destino';
export const SEM_CLASSIFICACAO = 'Sem classificação';

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

export interface Commitment {
  id: number;
  name: string;
  monthly: number;
  kind: 'recurring' | 'installment';
  recurrence: string | null;
  startKey: string;
  paid: number | null;
  installments: number | null;
  endKey: string | null;
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
  grupo: (entry) => entry.category,
  destino: (entry) => entry.destination || SEM_DESTINO,
  classificacao: (entry) => entry.classification || SEM_CLASSIFICACAO,
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

function monthKey(absolute: number): string {
  return `${Math.floor(absolute / 12)}-${String((absolute % 12) + 1).padStart(2, '0')}`;
}

export function commitments(
  entries: BackendExpenseEntry[],
  year: number,
  month: number,
): Commitment[] {
  const reference = year * 12 + (month - 1);
  const list: Commitment[] = [];

  for (const entry of expensesOf(entries).filter(isLocked)) {
    const [startYear, startMonth] = entry.date.split('-').map(Number);
    const start = startYear * 12 + (startMonth - 1);
    if (reference < start) continue;

    const installments = entry.installments || 1;
    const isInstallment = !entry.is_recurring && installments > 1;
    const elapsed = reference - start;
    if (isInstallment && elapsed >= installments) continue;

    list.push({
      id: entry.id,
      name: entry.description || entry.category,
      monthly: round2(lockedContribution(entry, year, month)),
      kind: isInstallment ? 'installment' : 'recurring',
      recurrence: entry.is_recurring ? entry.recurrence || 'monthly' : null,
      startKey: monthKey(start),
      paid: isInstallment ? elapsed + 1 : null,
      installments: isInstallment ? installments : null,
      endKey: isInstallment ? monthKey(start + installments - 1) : null,
    });
  }

  return list.sort((a, b) => b.monthly - a.monthly);
}

export type PaceRange =
  | { kind: 'last'; count: number }
  | { kind: 'next'; count: number }
  | { kind: 'year'; year: number };

export function paceWindow(
  entries: BackendExpenseEntry[],
  range: PaceRange,
  selectedKey: string | null,
): PacePoint[] {
  const expenses = expensesOf(entries);
  const now = new Date();
  const currentAbsolute = now.getFullYear() * 12 + now.getMonth();

  let start: number;
  let count: number;
  if (range.kind === 'year') {
    start = range.year * 12;
    count = 12;
  } else if (range.kind === 'next') {
    start = currentAbsolute;
    count = range.count;
  } else {
    start = currentAbsolute - (range.count - 1);
    count = range.count;
  }

  return Array.from({ length: count }, (_, index) => {
    const absolute = start + index;
    const pointYear = Math.floor(absolute / 12);
    const pointMonth = (absolute % 12) + 1;
    const key = monthKey(absolute);
    const isFuture = absolute > currentAbsolute;
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
      isSelected: key === selectedKey,
    };
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
