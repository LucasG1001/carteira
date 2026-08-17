import type { BackendDividend } from '../services/api';
import { monthLabel } from './date';
import { normalizeText } from './text';

export type DividendGroupBy = 'ativo' | 'classe' | 'tipo';

export type DividendRange = { kind: 'last'; count: number } | { kind: 'year'; year: number };

export interface DividendMonth {
  key: string;
  label: string;
  value: number;
  count: number;
}

export interface DividendGroup {
  name: string;
  value: number;
  pct: number;
  count: number;
}

export interface DividendYear {
  year: number;
  value: number;
  pct: number;
  count: number;
  yoyPct: number | null;
}

export interface DividendScopeTotals {
  total: number;
  count: number;
}

export type DividendFilterState = {
  classe: string[];
  tipo: string[];
  ativo: string[];
};

export type DividendFilterGroup = keyof DividendFilterState;

export const EMPTY_DIVIDEND_FILTERS: DividendFilterState = { classe: [], tipo: [], ativo: [] };

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function monthKey(absolute: number): string {
  const year = Math.floor(absolute / 12);
  const month = (absolute % 12) + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

function currentAbsolute(): number {
  const now = new Date();
  return now.getFullYear() * 12 + now.getMonth();
}

export function paymentLabel(raw: string): string {
  const normalized = normalizeText(raw);
  if (normalized.includes('juros') && normalized.includes('capital')) return 'JCP';
  if (normalized.includes('dividendo')) return 'Dividendo';
  if (normalized.includes('rendimento')) return 'Rendimento';
  if (normalized.includes('leil')) return 'Leilão de fração';
  return raw;
}

function scopePrefix(year: number, month: number | null): string {
  return month ? `${year}-${String(month).padStart(2, '0')}` : String(year);
}

function inScope(entry: BackendDividend, year: number, month: number | null): boolean {
  return entry.date.startsWith(scopePrefix(year, month));
}

export function scopeTotals(
  entries: BackendDividend[],
  year: number,
  month: number | null,
): DividendScopeTotals {
  let total = 0;
  let count = 0;
  for (const entry of entries) {
    if (!inScope(entry, year, month)) continue;
    total += entry.value;
    count += 1;
  }
  return { total: round2(total), count };
}

export function monthTotal(entries: BackendDividend[], year: number, month: number): number {
  return scopeTotals(entries, year, month).total;
}

export function trailingWindow(
  entries: BackendDividend[],
  months = 12,
  offsetMonths = 0,
): { total: number; average: number; monthsWithPayment: number } {
  const start = currentAbsolute() - (months - 1) - offsetMonths;
  const keys = new Set(Array.from({ length: months }, (_, index) => monthKey(start + index)));
  const byMonth = new Map<string, number>();
  let total = 0;
  for (const entry of entries) {
    const key = entry.date.slice(0, 7);
    if (!keys.has(key)) continue;
    total += entry.value;
    byMonth.set(key, (byMonth.get(key) ?? 0) + entry.value);
  }
  const paid = Array.from(byMonth.values()).filter((value) => value > 0).length;
  return {
    total: round2(total),
    average: paid > 0 ? round2(total / paid) : 0,
    monthsWithPayment: paid,
  };
}

export function monthlySeries(entries: BackendDividend[], range: DividendRange): DividendMonth[] {
  const start = range.kind === 'year' ? range.year * 12 : currentAbsolute() - (range.count - 1);
  const count = range.kind === 'year' ? 12 : range.count;

  const byMonth = new Map<string, { value: number; count: number }>();
  for (const entry of entries) {
    const key = entry.date.slice(0, 7);
    const bucket = byMonth.get(key) ?? { value: 0, count: 0 };
    bucket.value += entry.value;
    bucket.count += 1;
    byMonth.set(key, bucket);
  }

  return Array.from({ length: count }, (_, index) => {
    const key = monthKey(start + index);
    const bucket = byMonth.get(key);
    return {
      key,
      label: monthLabel(key),
      value: round2(bucket?.value ?? 0),
      count: bucket?.count ?? 0,
    };
  });
}

export function groupDividends(
  entries: BackendDividend[],
  year: number,
  month: number | null,
  groupBy: DividendGroupBy,
): DividendGroup[] {
  const buckets = new Map<string, { value: number; count: number }>();
  let total = 0;

  for (const entry of entries) {
    if (!inScope(entry, year, month)) continue;
    const name =
      groupBy === 'ativo'
        ? entry.ticker
        : groupBy === 'classe'
          ? entry.asset_type
          : paymentLabel(entry.type);
    const bucket = buckets.get(name) ?? { value: 0, count: 0 };
    bucket.value += entry.value;
    bucket.count += 1;
    buckets.set(name, bucket);
    total += entry.value;
  }

  return Array.from(buckets.entries())
    .map(([name, bucket]) => ({
      name,
      value: round2(bucket.value),
      pct: total > 0 ? (bucket.value / total) * 100 : 0,
      count: bucket.count,
    }))
    .sort((left, right) => right.value - left.value);
}

export function paymentMix(entries: BackendDividend[], months = 12): DividendGroup[] {
  const start = currentAbsolute() - (months - 1);
  const keys = new Set(Array.from({ length: months }, (_, index) => monthKey(start + index)));
  const scoped = entries.filter((entry) => keys.has(entry.date.slice(0, 7)));
  const buckets = new Map<string, { value: number; count: number }>();
  let total = 0;

  for (const entry of scoped) {
    const name = paymentLabel(entry.type);
    const bucket = buckets.get(name) ?? { value: 0, count: 0 };
    bucket.value += entry.value;
    bucket.count += 1;
    buckets.set(name, bucket);
    total += entry.value;
  }

  return Array.from(buckets.entries())
    .map(([name, bucket]) => ({
      name,
      value: round2(bucket.value),
      pct: total > 0 ? (bucket.value / total) * 100 : 0,
      count: bucket.count,
    }))
    .sort((left, right) => right.value - left.value);
}

export function yearTotals(entries: BackendDividend[]): DividendYear[] {
  const buckets = new Map<number, { value: number; count: number }>();
  let total = 0;

  for (const entry of entries) {
    const year = Number(entry.date.slice(0, 4));
    const bucket = buckets.get(year) ?? { value: 0, count: 0 };
    bucket.value += entry.value;
    bucket.count += 1;
    buckets.set(year, bucket);
    total += entry.value;
  }

  const ascending = Array.from(buckets.entries()).sort((left, right) => left[0] - right[0]);

  return ascending
    .map(([year, bucket], index) => {
      const previous = index > 0 ? ascending[index - 1] : null;
      const previousValue = previous && previous[0] === year - 1 ? previous[1].value : null;
      return {
        year,
        value: round2(bucket.value),
        pct: total > 0 ? (bucket.value / total) * 100 : 0,
        count: bucket.count,
        yoyPct:
          previousValue && previousValue > 0
            ? ((bucket.value - previousValue) / previousValue) * 100
            : null,
      };
    })
    .reverse();
}

export function availableYears(entries: BackendDividend[]): number[] {
  const years = new Set<number>([new Date().getFullYear()]);
  for (const entry of entries) years.add(Number(entry.date.slice(0, 4)));
  return Array.from(years).sort((left, right) => right - left);
}

export function monthsWithDividend(entries: BackendDividend[]): Set<string> {
  return new Set(entries.map((entry) => entry.date.slice(0, 7)));
}

export function lastMonthWithDividend(
  entries: BackendDividend[],
): { year: number; month: number } | null {
  let latest: string | null = null;
  for (const entry of entries) {
    const key = entry.date.slice(0, 7);
    if (!latest || key > latest) latest = key;
  }
  if (!latest) return null;
  const [year, month] = latest.split('-').map(Number);
  return { year, month };
}

export function dividendFilterCount(state: DividendFilterState): number {
  return state.classe.length + state.tipo.length + state.ativo.length;
}

export function toggleDividendFilter(
  state: DividendFilterState,
  group: DividendFilterGroup,
  value: string,
): DividendFilterState {
  const current = state[group];
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
  return { ...state, [group]: next };
}

export function matchesDividendFilters(
  entry: BackendDividend,
  state: DividendFilterState,
  query: string,
): boolean {
  const term = normalizeText(query);
  if (term) {
    const haystack = [entry.ticker, entry.asset_type, paymentLabel(entry.type)].map((value) =>
      normalizeText(value),
    );
    if (!haystack.some((value) => value.includes(term))) return false;
  }

  if (state.classe.length > 0 && !state.classe.includes(entry.asset_type)) return false;
  if (state.tipo.length > 0 && !state.tipo.includes(paymentLabel(entry.type))) return false;
  if (state.ativo.length > 0 && !state.ativo.includes(entry.ticker)) return false;

  return true;
}
