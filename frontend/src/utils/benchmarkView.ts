import type { BackendBenchmarkMonth, BackendPerformanceBucket } from '../services/api';
import type { PerformanceRange } from './performanceView';

export type ComparisonKey = 'carteira' | 'cdi' | 'ibov' | 'ipca';

export interface ComparisonData {
  months: string[];
  lines: Record<ComparisonKey, (number | null)[]>;
}

export function portfolioMonthlyReturns(buckets: BackendPerformanceBucket[]): Map<string, number> {
  const returns = new Map<string, number>();
  for (const bucket of buckets) {
    const base = bucket.start_value + bucket.net_flow / 2;
    returns.set(bucket.key, base > 0 ? (bucket.value / base) * 100 : 0);
  }
  return returns;
}

export function comparableMonths(benchmarks: BackendBenchmarkMonth[]): string[] {
  const months = benchmarks.map((row) => row.month);
  const last = benchmarks[benchmarks.length - 1];
  if (last && last.cdi == null && last.ibov == null) months.pop();
  return months;
}

export function comparisonYears(months: string[]): number[] {
  return Array.from(new Set(months.map((month) => Number(month.slice(0, 4))))).sort((a, b) => b - a);
}

function windowOf(months: string[], range: PerformanceRange): string[] {
  if (range.kind === 'all') return months;
  if (range.kind === 'year') return months.filter((month) => month.startsWith(`${range.year}-`));
  return months.slice(-range.count);
}

function accumulate(months: string[], monthly: (month: string) => number | null): (number | null)[] {
  const values: (number | null)[] = [0];
  let factor = 1;
  let open = true;
  for (const month of months) {
    const rate = open ? monthly(month) : null;
    if (rate == null) {
      open = false;
      values.push(null);
      continue;
    }
    factor *= 1 + rate / 100;
    values.push((factor - 1) * 100);
  }
  return values;
}

export function buildComparison(
  benchmarks: BackendBenchmarkMonth[],
  buckets: BackendPerformanceBucket[],
  range: PerformanceRange,
): ComparisonData {
  const months = windowOf(comparableMonths(benchmarks), range);
  const byMonth = new Map(benchmarks.map((row) => [row.month, row]));
  const portfolio = portfolioMonthlyReturns(buckets);

  return {
    months,
    lines: {
      carteira: accumulate(months, (month) => portfolio.get(month) ?? null),
      cdi: accumulate(months, (month) => byMonth.get(month)?.cdi ?? null),
      ibov: accumulate(months, (month) => byMonth.get(month)?.ibov ?? null),
      ipca: accumulate(months, (month) => byMonth.get(month)?.ipca ?? null),
    },
  };
}

export function lastValueAt(values: (number | null)[], index: number): { value: number; index: number } | null {
  for (let cursor = Math.min(index, values.length - 1); cursor >= 0; cursor -= 1) {
    const value = values[cursor];
    if (value != null) return { value, index: cursor };
  }
  return null;
}
