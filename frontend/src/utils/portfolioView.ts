import type { BackendAssetSummary, BackendEvolutionPoint, BackendPortfolioSummary } from '../services/api';
import { monthLabel } from './date';

export type AllocationGroupBy = 'tipo' | 'ativo' | 'setor';

export type PortfolioRange = { kind: 'last'; count: number } | { kind: 'year'; year: number };

export const SEM_SETOR = 'Sem setor';

const ASSET_TYPE_TOKENS: Record<string, string> = {
  Acao: 'var(--color-asset-acao)',
  FII: 'var(--color-asset-fii)',
  ETF: 'var(--color-asset-etf)',
  Cripto: 'var(--color-asset-cripto)',
  'Renda Fixa': 'var(--color-asset-rf)',
};

export interface AllocationGroup {
  name: string;
  value: number;
  pct: number;
  count: number;
  resultValue: number;
  resultPct: number;
  quantity: number;
  averagePrice: number;
  color?: string;
  drillable: boolean;
}

export interface ContributionPoint {
  key: string;
  label: string;
  value: number;
}

export interface ContributionPace {
  points: ContributionPoint[];
  average: number;
  total: number;
}

export interface ResultSplit {
  capital: number;
  dividends: number;
  total: number;
  yieldOnCost: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function monthKey(absolute: number): string {
  const year = Math.floor(absolute / 12);
  const month = (absolute % 12) + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function assetTypeColor(type: string | null | undefined): string | undefined {
  return type ? ASSET_TYPE_TOKENS[type] : undefined;
}

function groupNameOf(asset: BackendAssetSummary, groupBy: AllocationGroupBy): string {
  if (groupBy === 'ativo') return asset.ticker;
  if (groupBy === 'setor') return asset.sector || SEM_SETOR;
  return asset.asset_type;
}

export function allocationGroups(
  assets: BackendAssetSummary[],
  groupBy: AllocationGroupBy,
  drill: string | null = null,
): AllocationGroup[] {
  const scoped = drill ? assets.filter((asset) => groupNameOf(asset, groupBy) === drill) : assets;
  const mode: AllocationGroupBy = drill ? 'ativo' : groupBy;
  const total = scoped.reduce((sum, asset) => sum + asset.current_value, 0);

  const buckets = new Map<
    string,
    {
      value: number;
      invested: number;
      result: number;
      count: number;
      quantity: number;
      averagePrice: number;
      assetType: string;
    }
  >();

  for (const asset of scoped) {
    const name = groupNameOf(asset, mode);
    const bucket = buckets.get(name) ?? {
      value: 0,
      invested: 0,
      result: 0,
      count: 0,
      quantity: 0,
      averagePrice: 0,
      assetType: asset.asset_type,
    };
    bucket.value += asset.current_value;
    bucket.invested += asset.total_invested;
    bucket.result += asset.profitability_value;
    bucket.count += 1;
    if (mode === 'ativo') {
      bucket.quantity = asset.total_quantity;
      bucket.averagePrice = asset.average_price;
    }
    buckets.set(name, bucket);
  }

  return Array.from(buckets.entries())
    .map(([name, bucket]) => ({
      name,
      value: round2(bucket.value),
      pct: total > 0 ? (bucket.value / total) * 100 : 0,
      count: bucket.count,
      resultValue: round2(bucket.result),
      resultPct: bucket.invested > 0 ? (bucket.result / bucket.invested) * 100 : 0,
      quantity: bucket.quantity,
      averagePrice: bucket.averagePrice,
      color: assetTypeColor(mode === 'setor' ? null : bucket.assetType),
      drillable: mode !== 'ativo',
    }))
    .sort((left, right) => right.value - left.value);
}

export function contributionPace(
  evolution: BackendEvolutionPoint[],
  range: PortfolioRange,
): ContributionPace {
  const deltas = new Map<string, number>();
  let previous = 0;
  for (const point of evolution) {
    deltas.set(point.month, point.invested - previous);
    previous = point.invested;
  }

  const now = new Date();
  const currentAbsolute = now.getFullYear() * 12 + now.getMonth();
  const start = range.kind === 'year' ? range.year * 12 : currentAbsolute - (range.count - 1);
  const count = range.kind === 'year' ? 12 : range.count;

  const points = Array.from({ length: count }, (_, index) => {
    const key = monthKey(start + index);
    return { key, label: monthLabel(key), value: round2(deltas.get(key) ?? 0) };
  });

  const total = points.reduce((sum, point) => sum + point.value, 0);

  return { points, total: round2(total), average: points.length ? round2(total / points.length) : 0 };
}

export function evolutionYears(evolution: BackendEvolutionPoint[]): number[] {
  const years = new Set<number>([new Date().getFullYear()]);
  for (const point of evolution) years.add(Number(point.month.split('-')[0]));
  return Array.from(years).sort((left, right) => right - left);
}

export function highlights(
  assets: BackendAssetSummary[],
  size = 3,
): { best: BackendAssetSummary[]; worst: BackendAssetSummary[] } {
  const sorted = [...assets].sort(
    (left, right) => right.profitability_value - left.profitability_value,
  );
  const best = sorted.slice(0, size);
  const worst = sorted
    .slice(-size)
    .reverse()
    .filter((asset) => !best.includes(asset));
  return { best, worst };
}

export function resultSplit(summary: BackendPortfolioSummary): ResultSplit {
  return {
    capital: summary.general_variation_value,
    dividends: summary.general_total_dividends,
    total: summary.general_profitability_value,
    yieldOnCost:
      summary.general_total_invested > 0
        ? (summary.general_total_dividends / summary.general_total_invested) * 100
        : 0,
  };
}

export function monthlyDividendAverage(monthly: { month: string; value: number }[]): number {
  const paid = monthly.filter((point) => point.value > 0);
  if (paid.length === 0) return 0;
  return round2(paid.reduce((sum, point) => sum + point.value, 0) / paid.length);
}
