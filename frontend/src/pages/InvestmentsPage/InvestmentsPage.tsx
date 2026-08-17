import { useEffect, useMemo, useState } from "react";
import { AssetsTable } from "../../components/AssetsTable/AssetsTable";
import { MonthlyBarsCard } from "../../components/MonthlyBarsCard/MonthlyBarsCard";
import { PeriodFilter } from "../../components/PeriodFilter/PeriodFilter";
import type { PeriodGroup } from "../../components/PeriodFilter/PeriodFilter";
import { RankedBarsCard } from "../../components/RankedBarsCard/RankedBarsCard";
import type { RankedGroup } from "../../components/RankedBarsCard/RankedBarsCard";
import { SplitBarCard } from "../../components/SplitBarCard/SplitBarCard";
import type { SplitSegment } from "../../components/SplitBarCard/SplitBarCard";
import { SummaryHeroCard } from "../../components/SummaryHeroCard/SummaryHeroCard";
import type { HeroComparison } from "../../components/SummaryHeroCard/SummaryHeroCard";
import { usePortfolio } from "../../context/portfolioStore";
import { usePrivacy } from "../../context/privacyStore";
import { getEvolution } from "../../services/api";
import type { BackendAssetSummary, BackendEvolutionPoint } from "../../services/api";
import { formatQty } from "../../utils/formatting";
import {
  allocationGroups,
  contributionPace,
  evolutionYears,
  highlights,
  monthlyDividendAverage,
  resultSplit,
} from "../../utils/portfolioView";
import type { AllocationGroupBy, PortfolioRange } from "../../utils/portfolioView";
import styles from "./InvestmentsPage.module.css";

const ALLOCATION_OPTIONS: { value: AllocationGroupBy; label: string }[] = [
  { value: "tipo", label: "por tipo" },
  { value: "ativo", label: "por ativo" },
  { value: "setor", label: "por setor" },
];

const BACK_LABEL: Record<AllocationGroupBy, string> = {
  tipo: "todos os tipos",
  ativo: "todos os ativos",
  setor: "todos os setores",
};

const PACE_QUICK_OPTIONS = [
  { value: "last6", label: "Últimos 6 meses" },
  { value: "last12", label: "Últimos 12 meses" },
  { value: "last24", label: "Últimos 24 meses" },
];

function paceRangeOf(value: string): PortfolioRange {
  if (value.startsWith("year:")) return { kind: "year", year: Number(value.slice(5)) };
  if (value === "last6") return { kind: "last", count: 6 };
  if (value === "last24") return { kind: "last", count: 24 };
  return { kind: "last", count: 12 };
}

function signed(value: number): string {
  return value >= 0 ? "+" : "−";
}

export function InvestmentsPage() {
  const { data, loading, error } = usePortfolio();
  const { formatCurrency: fmt } = usePrivacy();
  const [allocationBy, setAllocationBy] = useState<AllocationGroupBy>("tipo");
  const [drill, setDrill] = useState<string | null>(null);
  const [paceRange, setPaceRange] = useState("last12");
  const [evolution, setEvolution] = useState<BackendEvolutionPoint[]>([]);

  useEffect(() => {
    let active = true;
    getEvolution()
      .then((result) => {
        if (active) setEvolution(result);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const assets = useMemo(() => data?.assets ?? [], [data]);

  const allocation = useMemo(
    () => allocationGroups(assets, allocationBy, drill),
    [assets, allocationBy, drill],
  );

  const pace = useMemo(
    () => contributionPace(evolution, paceRangeOf(paceRange)),
    [evolution, paceRange],
  );

  const paceGroups: PeriodGroup[] = useMemo(
    () => [
      { title: "Filtros rápidos", options: PACE_QUICK_OPTIONS },
      {
        title: "Filtro anual",
        options: evolutionYears(evolution).map((year) => ({
          value: `year:${year}`,
          label: String(year),
        })),
      },
    ],
    [evolution],
  );

  const best = useMemo(() => highlights(assets), [assets]);

  if (loading) {
    return <div className={styles.state}>Carregando dados da carteira...</div>;
  }

  if (error) {
    return (
      <div className={`${styles.state} ${styles.error}`}>
        Erro ao carregar dados: {error.message}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const split = resultSplit(data);
  const dividendAverage = monthlyDividendAverage(data.monthly_dividends);
  const resultScale = Math.abs(split.capital) + Math.abs(split.dividends);
  const shareOf = (value: number) =>
    resultScale > 0 ? Math.round((Math.abs(value) / resultScale) * 100) : 0;

  const comparisons: HeroComparison[] = [
    {
      label: "Resultado total",
      value: split.total,
      variationPct: data.general_profitability_percent,
      note: "ganho de capital + proventos",
    },
    {
      label: "Valor investido",
      value: data.general_total_invested,
      note: `${assets.length} ${assets.length === 1 ? "ativo" : "ativos"} em carteira`,
    },
  ];

  const segments: SplitSegment[] = [
    {
      name: "Ganho de capital",
      value: split.capital,
      tone: split.capital >= 0 ? "accent" : "warn",
      note: `${shareOf(split.capital)}% do resultado · ${data.general_variation_percent.toFixed(
        1,
      )}% sobre o custo`,
    },
    {
      name: "Proventos",
      value: split.dividends,
      tone: "neutral",
      note: `${shareOf(split.dividends)}% do resultado · ${split.yieldOnCost.toFixed(
        1,
      )}% sobre o custo`,
    },
  ];

  const allocationGroupsView: RankedGroup[] = allocation.map((group) => ({
    name: group.name,
    value: group.value,
    pct: group.pct,
    barColor: group.color,
    note: group.drillable
      ? `${group.count} ${group.count === 1 ? "ativo" : "ativos"} · resultado ${signed(
          group.resultValue,
        )}${fmt(Math.abs(group.resultValue))} (${group.resultPct.toFixed(1)}%)`
      : `${formatQty(group.quantity)} · PM ${fmt(group.averagePrice)} · ${signed(
          group.resultPct,
        )}${Math.abs(group.resultPct).toFixed(1)}%`,
  }));

  const asRankedAsset = (asset: BackendAssetSummary): RankedGroup => ({
    name: asset.ticker,
    value: asset.profitability_value,
    pct: asset.profitability_percent,
    tone: asset.profitability_value >= 0 ? "accent" : "warn",
    note: `${fmt(asset.current_value)} · ${asset.asset_type}`,
  });

  const highlightGroups: RankedGroup[] = [
    ...best.best.map(asRankedAsset),
    ...best.worst.map(asRankedAsset),
  ];

  const drilling = drill !== null;
  const allocationLabel = ALLOCATION_OPTIONS.find((option) => option.value === allocationBy)?.label;
  const drillTotal = allocation.reduce((sum, group) => sum + group.value, 0);

  return (
    <div className={styles.container}>
      <div className={styles.topGrid}>
        <SummaryHeroCard
          kicker="A carteira hoje"
          total={data.general_current_value}
          reference={{ label: "investido", value: data.general_total_invested }}
          deltaLabels={{ above: "acima do custo", below: "abaixo do custo" }}
          comparisons={comparisons}
        />
        <SplitBarCard
          kicker="De onde vem o resultado"
          segments={segments}
          footerLines={[
            {
              label: "Rentabilidade total",
              value: `${data.general_profitability_percent.toFixed(2)}%`,
            },
            { label: "Proventos · média mensal (12m)", value: fmt(dividendAverage) },
          ]}
          emptyLabel="Sem resultado para mostrar ainda."
        />
      </div>

      <MonthlyBarsCard
        kicker="Ritmo de aportes"
        points={pace.points.map((point) => ({
          key: point.key,
          label: point.label,
          value: point.value,
          tone: point.value < 0 ? "warn" : "accent",
        }))}
        reference={
          pace.average > 0 ? { value: pace.average, label: "média do período" } : undefined
        }
        legend={[
          { tone: "accent", label: "aporte" },
          { tone: "warn", label: "venda líquida" },
        ]}
        filter={<PeriodFilter groups={paceGroups} value={paceRange} onChange={setPaceRange} />}
      />

      <div className={styles.splitGrid}>
        <RankedBarsCard
          kicker="Onde está o dinheiro"
          select={{
            value: allocationBy,
            options: ALLOCATION_OPTIONS,
            onChange: (value) => {
              setAllocationBy(value as AllocationGroupBy);
              setDrill(null);
            },
          }}
          subtitle={
            drilling
              ? `${drill} · ${fmt(drillTotal)} em ${allocation.length} ${
                  allocation.length === 1 ? "ativo" : "ativos"
                }`
              : `${fmt(data.general_current_value)} em ${assets.length} ${
                  assets.length === 1 ? "ativo" : "ativos"
                } · ${allocationBy === "ativo" ? allocationLabel : "toque para abrir"}`
          }
          groups={allocationGroupsView}
          onPick={
            allocationBy === "ativo" || drilling ? undefined : (group) => setDrill(group.name)
          }
          breadcrumb={
            drilling ? { label: BACK_LABEL[allocationBy], onBack: () => setDrill(null) } : undefined
          }
          emptyLabel="Nenhum ativo na carteira."
        />
        <RankedBarsCard
          kicker="Melhores e piores"
          subtitle="resultado por ativo, já com os proventos"
          groups={highlightGroups}
          emptyLabel="Nenhum ativo na carteira."
        />
      </div>

      <AssetsTable />
    </div>
  );
}
