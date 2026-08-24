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
import { usePortfolio } from "../../context/portfolioStore";
import { usePrivacy } from "../../context/privacyStore";
import { useIsMobile } from "../../hooks/useIsMobile";
import { getEvolution } from "../../services/api";
import type { BackendEvolutionPoint } from "../../services/api";
import { MESES, formatDate, monthLabel } from "../../utils/date";
import { formatQty } from "../../utils/formatting";
import {
  bucketKeysOf,
  contributionBreakdown,
  contributionYears,
  dayLabelStep,
  daySeries,
  monthSeries,
} from "../../utils/performanceView";
import type { PerformanceRange, PerformanceScope } from "../../utils/performanceView";
import {
  allocationGroups,
  contributionPace,
  monthlyDividendAverage,
  resultSplit,
} from "../../utils/portfolioView";
import type { AllocationGroupBy } from "../../utils/portfolioView";
import { usePerformance } from "./usePerformance";
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

const GROUP_NOUN: Record<AllocationGroupBy, { one: string; many: string }> = {
  tipo: { one: "tipo", many: "tipos" },
  ativo: { one: "ativo", many: "ativos" },
  setor: { one: "setor", many: "setores" },
};

const RESULT_QUICK_OPTIONS = [
  { value: "last6", label: "Últimos 6 meses" },
  { value: "last12", label: "Últimos 12 meses" },
  { value: "last24", label: "Últimos 24 meses" },
  { value: "all", label: "Todo o período" },
];

function resultRangeOf(value: string): PerformanceRange {
  if (value === "all") return { kind: "all" };
  if (value.startsWith("year:")) return { kind: "year", year: Number(value.slice(5)) };
  if (value === "last6") return { kind: "last", count: 6 };
  if (value === "last24") return { kind: "last", count: 24 };
  return { kind: "last", count: 12 };
}

function signed(value: number): string {
  return value >= 0 ? "+" : "−";
}

function longMonthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return `${MESES[month - 1].toLowerCase()} de ${year}`;
}

function longDayLabel(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  return `${day} de ${MESES[month - 1].toLowerCase()} de ${year}`;
}

export function InvestmentsPage() {
  const { data, loading, error } = usePortfolio();
  const { formatCurrency: fmt, hidden } = usePrivacy();
  const isMobile = useIsMobile();
  const [allocationBy, setAllocationBy] = useState<AllocationGroupBy>("tipo");
  const [drill, setDrill] = useState<string | null>(null);
  const [evolution, setEvolution] = useState<BackendEvolutionPoint[]>([]);

  const [resultRange, setResultRange] = useState("last12");
  const [resultScope, setResultScope] = useState<PerformanceScope>({ kind: "window" });
  const [resultGroupBy, setResultGroupBy] = useState<AllocationGroupBy>("ativo");
  const [resultDrill, setResultDrill] = useState<string | null>(null);
  const [lastResultRange, setLastResultRange] = useState("last12");

  const performance = usePerformance();
  const { monthly, monthlyStatus, days, daysStatus, loadedMonth, loadMonth } = performance;

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

  if (resultRange !== lastResultRange) {
    setLastResultRange(resultRange);
    setResultScope({ kind: "window" });
    setResultDrill(null);
    loadMonth(null);
  }

  const assets = useMemo(() => data?.assets ?? [], [data]);

  const allocation = useMemo(
    () => allocationGroups(assets, allocationBy, drill),
    [assets, allocationBy, drill],
  );

  const pace = useMemo(() => contributionPace(evolution, { kind: "last", count: 6 }), [evolution]);

  const monthBuckets = useMemo(() => monthly?.buckets ?? [], [monthly]);

  const resultGroups: PeriodGroup[] = useMemo(
    () => [
      { title: "Filtros rápidos", options: RESULT_QUICK_OPTIONS },
      {
        title: "Filtro anual",
        options: contributionYears(monthBuckets).map((year) => ({
          value: `year:${year}`,
          label: String(year),
        })),
      },
    ],
    [monthBuckets],
  );

  const windowSeries = useMemo(
    () => monthSeries(monthBuckets, resultRangeOf(resultRange)),
    [monthBuckets, resultRange],
  );

  const drilling = loadedMonth !== null;
  const dailySeries = useMemo(() => daySeries(days?.buckets ?? []), [days]);
  const series = drilling ? dailySeries : windowSeries;

  const activeSource = drilling ? days : monthly;
  const scopeKeys = useMemo(
    () => bucketKeysOf(resultScope, series),
    [resultScope, series],
  );

  const breakdown = useMemo(
    () =>
      contributionBreakdown(
        activeSource?.contributions ?? [],
        scopeKeys,
        resultGroupBy,
        resultDrill,
        data?.general_current_value ?? 0,
      ),
    [activeSource, scopeKeys, resultGroupBy, resultDrill, data],
  );

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

  const comparisons = [
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
    {
      label: "Aporte médio",
      value: pace.average,
      note: "últimos 6 meses",
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

  const drillingAllocation = drill !== null;
  const allocationLabel = ALLOCATION_OPTIONS.find((option) => option.value === allocationBy)?.label;
  const drillTotal = allocation.reduce((sum, group) => sum + group.value, 0);

  const selectedKey = resultScope.kind === "window" ? null : resultScope.key;

  const resultPoints = series.points.map((point) => ({
    key: point.key,
    label: point.label,
    value: point.value,
    tone: point.value < 0 ? ("warn" as const) : ("accent" as const),
    selected: point.key === selectedKey,
    title: hidden
      ? undefined
      : `${drilling ? formatDate(point.key) : monthLabel(point.key)} · ${signed(
          point.value,
        )}${fmt(Math.abs(point.value))}`,
  }));

  const handlePickBar = (key: string) => {
    if (drilling) {
      setResultScope((current) =>
        current.kind === "day" && current.key === key ? { kind: "window" } : { kind: "day", key },
      );
      setResultDrill(null);
      return;
    }

    if (resultScope.kind === "month" && resultScope.key === key) {
      loadMonth(key);
      setResultScope({ kind: "window" });
      setResultDrill(null);
      return;
    }

    setResultScope({ kind: "month", key });
    setResultDrill(null);
  };

  const leaveDrill = () => {
    loadMonth(null);
    setResultScope({ kind: "window" });
    setResultDrill(null);
  };

  const scopeLabel = (() => {
    if (resultScope.kind === "day") return longDayLabel(resultScope.key);
    if (resultScope.kind === "month") return longMonthLabel(resultScope.key);
    if (loadedMonth !== null) return longMonthLabel(loadedMonth);
    if (resultRange === "all") return "todo o período";
    if (resultRange.startsWith("year:")) return `ano de ${resultRange.slice(5)}`;
    const quick = RESULT_QUICK_OPTIONS.find((option) => option.value === resultRange);
    return quick ? quick.label.toLowerCase() : "período selecionado";
  })();

  const scopeResult =
    resultScope.kind === "window"
      ? series.total
      : series.points.find((point) => point.key === resultScope.key)?.value ?? 0;

  const noun = GROUP_NOUN[resultDrill ? "ativo" : resultGroupBy];
  const concentration = breakdown.concentration;
  const subtitleParts = [
    scopeLabel,
    `resultado ${signed(scopeResult)}${fmt(Math.abs(scopeResult))}`,
  ];
  if (concentration) {
    subtitleParts.push(
      `${concentration.count} ${
        concentration.count === 1 ? noun.one : noun.many
      } ${concentration.count === 1 ? "explica" : "explicam"} ${concentration.pct}% do movimento`,
    );
  } else if (breakdown.rows.length > 0) {
    subtitleParts.push(`movimento espalhado por ${breakdown.rows.length} ${noun.many}`);
  }
  if (resultScope.kind === "month" && !drilling) {
    subtitleParts.push("toque de novo na barra para ver os dias");
  }

  const contributionNote = (row: (typeof breakdown.rows)[number]): string => {
    const parts: string[] = [];
    if (row.count > 1) parts.push(`${row.count} ativos`);
    parts.push(`${row.sharePct.toFixed(1)}% da carteira`);
    if (!row.priced) {
      parts.push("avaliado a custo");
    } else if (row.dividendValue === 0) {
      parts.push("só variação de preço");
    } else if (row.priceValue === 0) {
      parts.push("só provento");
    } else {
      parts.push(`${signed(row.priceValue)}${fmt(Math.abs(row.priceValue))} de preço`);
      parts.push(`${signed(row.dividendValue)}${fmt(Math.abs(row.dividendValue))} de provento`);
    }
    return parts.join(" · ");
  };

  const contributionGroups: RankedGroup[] = breakdown.rows.map((row) => ({
    name: row.name,
    value: row.value,
    pct: row.pct,
    tone: row.value >= 0 ? "accent" : "warn",
    note: contributionNote(row),
  }));

  const resultStatus = drilling ? daysStatus : monthlyStatus;
  const resultKicker = drilling ? "Resultado dia a dia" : "Resultado mês a mês";
  const resultLegend = drilling
    ? [
        { tone: "accent" as const, label: "dia positivo" },
        { tone: "warn" as const, label: "dia negativo" },
      ]
    : [
        { tone: "accent" as const, label: "mês positivo" },
        { tone: "warn" as const, label: "mês negativo" },
      ];

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

      {resultStatus === "loading" && (
        <div className={styles.cardState}>Carregando o resultado...</div>
      )}
      {resultStatus === "error" && (
        <div className={`${styles.cardState} ${styles.error}`}>
          Não foi possível carregar o resultado do período.
        </div>
      )}
      {resultStatus === "ready" && resultPoints.length > 0 && (
        <MonthlyBarsCard
          kicker={resultKicker}
          diverging
          points={resultPoints}
          legend={resultLegend}
          labelEvery={
            drilling ? (isMobile ? 7 : dayLabelStep(resultPoints.length)) : undefined
          }
          showValues={isMobile || resultPoints.length > 16 ? "extremes" : "all"}
          onPick={handlePickBar}
          filter={
            <>
              {(drilling || resultScope.kind !== "window") && (
                <button type="button" className={styles.ghostAction} onClick={leaveDrill}>
                  {drilling ? "← todos os meses" : "voltar ao período"}
                </button>
              )}
              <PeriodFilter groups={resultGroups} value={resultRange} onChange={setResultRange} />
            </>
          }
        />
      )}

      <div className={styles.splitGrid}>
        <RankedBarsCard
          kicker="Quem moveu o ponteiro"
          select={{
            value: resultGroupBy,
            options: ALLOCATION_OPTIONS,
            onChange: (value) => {
              setResultGroupBy(value as AllocationGroupBy);
              setResultDrill(null);
            },
          }}
          subtitle={subtitleParts.join(" · ")}
          groups={contributionGroups}
          onPick={
            resultGroupBy === "ativo" || resultDrill !== null
              ? undefined
              : (group) => setResultDrill(group.name)
          }
          breadcrumb={
            resultDrill !== null
              ? { label: BACK_LABEL[resultGroupBy], onBack: () => setResultDrill(null) }
              : undefined
          }
          emptyLabel="Sem movimento neste período."
        />
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
            drillingAllocation
              ? `${drill} · ${fmt(drillTotal)} em ${allocation.length} ${
                  allocation.length === 1 ? "ativo" : "ativos"
                }`
              : `${fmt(data.general_current_value)} em ${assets.length} ${
                  assets.length === 1 ? "ativo" : "ativos"
                } · ${allocationBy === "ativo" ? allocationLabel : "toque para abrir"}`
          }
          groups={allocationGroupsView}
          onPick={
            allocationBy === "ativo" || drillingAllocation
              ? undefined
              : (group) => setDrill(group.name)
          }
          breadcrumb={
            drillingAllocation
              ? { label: BACK_LABEL[allocationBy], onBack: () => setDrill(null) }
              : undefined
          }
          emptyLabel="Nenhum ativo na carteira."
        />
      </div>

      <AssetsTable />
    </div>
  );
}
