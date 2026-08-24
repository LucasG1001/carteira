import type {
  BackendPerformanceBucket,
  BackendPerformanceContribution,
} from '../services/api';
import { currentAbsolute, monthKey, monthLabel } from './date';
import { round2 } from './formatting';
import { SEM_SETOR } from './portfolioView';
import type { AllocationGroupBy } from './portfolioView';

export type PerformanceRange =
  | { kind: 'last'; count: number }
  | { kind: 'year'; year: number }
  | { kind: 'all' };

export type PerformanceScope =
  | { kind: 'window' }
  | { kind: 'month'; key: string }
  | { kind: 'day'; key: string };

export interface PerformancePoint {
  key: string;
  label: string;
  value: number;
}

export interface PerformanceSeries {
  points: PerformancePoint[];
  total: number;
  best: PerformancePoint | null;
  worst: PerformancePoint | null;
}

export interface ContributionRow {
  name: string;
  value: number;
  pct: number;
  sharePct: number;
  priceValue: number;
  dividendValue: number;
  count: number;
  priced: boolean;
}

export interface ContributionBreakdown {
  rows: ContributionRow[];
  total: number;
  movement: number;
  concentration: { count: number; pct: number } | null;
}

function extremesOf(points: PerformancePoint[]): {
  best: PerformancePoint | null;
  worst: PerformancePoint | null;
} {
  const moved = points.filter((point) => point.value !== 0);
  if (moved.length === 0) return { best: null, worst: null };
  return {
    best: moved.reduce((top, point) => (point.value > top.value ? point : top)),
    worst: moved.reduce((low, point) => (point.value < low.value ? point : low)),
  };
}

function seriesOf(points: PerformancePoint[]): PerformanceSeries {
  const total = points.reduce((sum, point) => sum + point.value, 0);
  return { points, total: round2(total), ...extremesOf(points) };
}

export function monthSeries(
  buckets: BackendPerformanceBucket[],
  range: PerformanceRange,
): PerformanceSeries {
  const values = new Map(buckets.map((bucket) => [bucket.key, bucket.value]));

  if (range.kind === 'all') {
    return seriesOf(
      buckets.map((bucket) => ({
        key: bucket.key,
        label: monthLabel(bucket.key),
        value: round2(bucket.value),
      })),
    );
  }

  const start = range.kind === 'year' ? range.year * 12 : currentAbsolute() - (range.count - 1);
  const count = range.kind === 'year' ? 12 : range.count;

  return seriesOf(
    Array.from({ length: count }, (_, index) => {
      const key = monthKey(start + index);
      return { key, label: monthLabel(key), value: round2(values.get(key) ?? 0) };
    }),
  );
}

export function daySeries(buckets: BackendPerformanceBucket[]): PerformanceSeries {
  return seriesOf(
    buckets.map((bucket) => ({
      key: bucket.key,
      label: String(Number(bucket.key.slice(8))),
      value: round2(bucket.value),
    })),
  );
}

export function dayLabelStep(count: number): number {
  if (count <= 12) return 1;
  if (count <= 20) return 2;
  return 3;
}

export function contributionYears(buckets: BackendPerformanceBucket[]): number[] {
  const years = new Set<number>([new Date().getFullYear()]);
  for (const bucket of buckets) years.add(Number(bucket.key.slice(0, 4)));
  return Array.from(years).sort((left, right) => right - left);
}

export function bucketKeysOf(scope: PerformanceScope, series: PerformanceSeries): Set<string> {
  if (scope.kind === 'window') return new Set(series.points.map((point) => point.key));
  return new Set([scope.key]);
}

function dimensionOf(
  row: BackendPerformanceContribution,
  groupBy: AllocationGroupBy,
): string {
  if (groupBy === 'ativo') return row.ticker;
  if (groupBy === 'setor') return row.sector || SEM_SETOR;
  return row.asset_type;
}

export function contributionBreakdown(
  contributions: BackendPerformanceContribution[],
  keys: Set<string>,
  groupBy: AllocationGroupBy,
  drill: string | null,
  portfolioValue: number,
): ContributionBreakdown {
  const scoped = contributions.filter(
    (row) => keys.has(row.bucket) && (drill === null || dimensionOf(row, groupBy) === drill),
  );
  const mode: AllocationGroupBy = drill ? 'ativo' : groupBy;

  const buckets = new Map<
    string,
    {
      value: number;
      priceValue: number;
      dividendValue: number;
      endValue: number;
      tickers: Set<string>;
      priced: boolean;
    }
  >();

  for (const row of scoped) {
    const name = dimensionOf(row, mode);
    const bucket = buckets.get(name) ?? {
      value: 0,
      priceValue: 0,
      dividendValue: 0,
      endValue: 0,
      tickers: new Set<string>(),
      priced: false,
    };
    bucket.value += row.value;
    bucket.priceValue += row.price_value;
    bucket.dividendValue += row.dividend_value;
    bucket.tickers.add(row.ticker);
    bucket.priced = bucket.priced || row.priced;
    buckets.set(name, bucket);
  }

  // O valor da posição é o do último bucket do escopo, não a soma dos buckets.
  const lastByName = new Map<string, Map<string, number>>();
  for (const row of scoped) {
    const name = dimensionOf(row, mode);
    const perTicker = lastByName.get(name) ?? new Map<string, number>();
    perTicker.set(row.ticker, row.end_value);
    lastByName.set(name, perTicker);
  }
  for (const [name, perTicker] of lastByName) {
    const bucket = buckets.get(name);
    if (bucket) {
      bucket.endValue = Array.from(perTicker.values()).reduce((sum, value) => sum + value, 0);
    }
  }

  const total = scoped.reduce((sum, row) => sum + row.value, 0);
  const rows = Array.from(buckets.entries())
    .map(([name, bucket]) => ({
      name,
      value: round2(bucket.value),
      priceValue: round2(bucket.priceValue),
      dividendValue: round2(bucket.dividendValue),
      sharePct: portfolioValue > 0 ? (bucket.endValue / portfolioValue) * 100 : 0,
      count: bucket.tickers.size,
      priced: bucket.priced,
      pct: 0,
    }))
    .filter((row) => row.value !== 0)
    .sort((left, right) => Math.abs(right.value) - Math.abs(left.value));

  const movement = rows.reduce((sum, row) => sum + Math.abs(row.value), 0);
  for (const row of rows) {
    row.pct = movement > 0 ? (Math.abs(row.value) / movement) * 100 : 0;
  }

  return {
    rows,
    total: round2(total),
    movement: round2(movement),
    concentration: concentrationOf(rows, movement),
  };
}

function concentrationOf(
  rows: ContributionRow[],
  movement: number,
): { count: number; pct: number } | null {
  if (rows.length === 0 || movement <= 0) return null;

  let accumulated = 0;
  for (let index = 0; index < rows.length; index += 1) {
    accumulated += Math.abs(rows[index].value);
    if (accumulated / movement >= 0.8) {
      const count = index + 1;
      return count === rows.length
        ? null
        : { count, pct: Math.round((accumulated / movement) * 100) };
    }
  }
  return null;
}
