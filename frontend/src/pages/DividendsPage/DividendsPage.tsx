import { useEffect, useMemo, useState } from "react";
import { DividendsTable } from "../../components/DividendsTable/DividendsTable";
import { MonthlyBarsCard } from "../../components/MonthlyBarsCard/MonthlyBarsCard";
import { MonthYearPicker } from "../../components/MonthYearPicker/MonthYearPicker";
import { PeriodFilter } from "../../components/PeriodFilter/PeriodFilter";
import type { PeriodGroup } from "../../components/PeriodFilter/PeriodFilter";
import { RankedBarsCard } from "../../components/RankedBarsCard/RankedBarsCard";
import type { RankedGroup } from "../../components/RankedBarsCard/RankedBarsCard";
import { SplitBarCard } from "../../components/SplitBarCard/SplitBarCard";
import type { SplitSegment, SplitTone } from "../../components/SplitBarCard/SplitBarCard";
import { SummaryHeroCard } from "../../components/SummaryHeroCard/SummaryHeroCard";
import type { HeroComparison } from "../../components/SummaryHeroCard/SummaryHeroCard";
import { usePortfolio } from "../../context/portfolioStore";
import { usePrivacy } from "../../context/privacyStore";
import { getDividends } from "../../services/api";
import type { BackendDividend } from "../../services/api";
import { MESES } from "../../utils/date";
import {
  EMPTY_DIVIDEND_FILTERS,
  availableYears,
  groupDividends,
  lastMonthWithDividend,
  monthTotal,
  monthlySeries,
  monthsWithDividend,
  paymentMix,
  scopeTotals,
  trailingWindow,
  yearTotals,
} from "../../utils/dividendsView";
import type { DividendFilterState, DividendGroupBy, DividendRange } from "../../utils/dividendsView";
import styles from "./DividendsPage.module.css";

type Scope = { year: number; month: number | null };

const GROUP_OPTIONS: { value: DividendGroupBy; label: string }[] = [
  { value: "ativo", label: "por ativo" },
  { value: "classe", label: "por classe" },
  { value: "tipo", label: "por tipo de pagamento" },
];

const PACE_QUICK_OPTIONS = [
  { value: "last6", label: "Últimos 6 meses" },
  { value: "last12", label: "Últimos 12 meses" },
  { value: "last24", label: "Últimos 24 meses" },
];

const MIX_TONES: SplitTone[] = ["accent", "accentDeep", "neutral", "neutralDeep"];

function paceRangeOf(value: string): DividendRange {
  if (value.startsWith("year:")) return { kind: "year", year: Number(value.slice(5)) };
  if (value === "last6") return { kind: "last", count: 6 };
  if (value === "last24") return { kind: "last", count: 24 };
  return { kind: "last", count: 12 };
}

function scopeLabelOf(scope: Scope): string {
  return scope.month ? MESES[scope.month - 1].toLowerCase() : `ano de ${scope.year}`;
}

export function DividendsPage() {
  const { formatCurrency: fmt } = usePrivacy();
  const { data: portfolio } = usePortfolio();
  const [entries, setEntries] = useState<BackendDividend[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [groupBy, setGroupBy] = useState<DividendGroupBy>("ativo");
  const [paceRange, setPaceRange] = useState("last12");
  const [breakdownScope, setBreakdownScope] = useState<Scope>({
    year: currentYear,
    month: currentMonth,
  });
  const [tableScope, setTableScope] = useState<Scope>({ year: currentYear, month: currentMonth });
  const [filters, setFilters] = useState<DividendFilterState>(EMPTY_DIVIDEND_FILTERS);
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [lastTableScope, setLastTableScope] = useState(`${currentYear}-${currentMonth}`);

  useEffect(() => {
    let active = true;
    getDividends()
      .then((result) => {
        if (!active) return;
        setEntries(result);
        const latest = lastMonthWithDividend(result);
        if (latest) {
          setBreakdownScope(latest);
          setTableScope(latest);
          setLastTableScope(`${latest.year}-${latest.month}`);
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err : new Error("Erro"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const tableScopeKey = `${tableScope.year}-${tableScope.month}`;
  if (tableScopeKey !== lastTableScope) {
    setLastTableScope(tableScopeKey);
    setFilters(EMPTY_DIVIDEND_FILTERS);
    setQuery("");
    setActiveGroup(null);
  }

  const list = useMemo(() => entries ?? [], [entries]);
  const markedKeys = useMemo(() => monthsWithDividend(list), [list]);
  const trailing = useMemo(() => trailingWindow(list, 12), [list]);
  const previousWindow = useMemo(() => trailingWindow(list, 12, 12), [list]);
  const series = useMemo(() => monthlySeries(list, paceRangeOf(paceRange)), [list, paceRange]);
  const mix = useMemo(() => paymentMix(list, 12), [list]);
  const years = useMemo(() => yearTotals(list), [list]);
  const breakdown = useMemo(
    () => groupDividends(list, breakdownScope.year, breakdownScope.month, groupBy),
    [list, breakdownScope, groupBy],
  );
  const breakdownTotals = useMemo(
    () => scopeTotals(list, breakdownScope.year, breakdownScope.month),
    [list, breakdownScope],
  );
  const filterOptions = useMemo(() => {
    const scoped = groupDividends(list, tableScope.year, tableScope.month, "ativo");
    return {
      ativo: scoped.map((group) => group.name),
      classe: groupDividends(list, tableScope.year, tableScope.month, "classe").map(
        (group) => group.name,
      ),
      tipo: groupDividends(list, tableScope.year, tableScope.month, "tipo").map(
        (group) => group.name,
      ),
    };
  }, [list, tableScope]);
  const paceGroups: PeriodGroup[] = useMemo(
    () => [
      { title: "Filtros rápidos", options: PACE_QUICK_OPTIONS },
      {
        title: "Filtro anual",
        options: availableYears(list).map((year) => ({ value: `year:${year}`, label: String(year) })),
      },
    ],
    [list],
  );

  if (loading) {
    return <div className={styles.state}>Carregando proventos...</div>;
  }

  if (error) {
    return (
      <div className={`${styles.state} ${styles.error}`}>Erro ao carregar dados: {error.message}</div>
    );
  }

  if (!entries || entries.length === 0) {
    return <div className={styles.state}>Nenhum provento recebido ainda.</div>;
  }

  const monthValue = monthTotal(list, currentYear, currentMonth);
  const invested = portfolio?.general_total_invested ?? 0;
  const yieldOnCost = invested > 0 ? (trailing.total / invested) * 100 : null;
  const totalAll = list.reduce((sum, entry) => sum + entry.value, 0);

  const comparisons: HeroComparison[] = [
    {
      label: `${MESES[currentMonth - 1]} · em curso`,
      value: monthValue > 0 ? monthValue : null,
      emptyNote: "nada recebido ainda",
    },
    {
      label: "Média mensal",
      value: trailing.average,
      note: `${trailing.monthsWithPayment} ${
        trailing.monthsWithPayment === 1 ? "mês com pagamento" : "meses com pagamento"
      }`,
    },
  ];

  const segments: SplitSegment[] = mix.map((group, index) => ({
    name: group.name,
    value: group.value,
    tone: MIX_TONES[index % MIX_TONES.length],
    note: `${group.pct.toFixed(0)}% · ${group.count} ${
      group.count === 1 ? "pagamento" : "pagamentos"
    }`,
  }));

  const breakdownGroups: RankedGroup[] = breakdown.map((group) => ({
    name: group.name,
    value: group.value,
    pct: group.pct,
    note: `${group.count} ${group.count === 1 ? "pagamento" : "pagamentos"}`,
  }));

  const yearGroups: RankedGroup[] = years.map((year) => ({
    name: String(year.year),
    value: year.value,
    pct: year.pct,
    note:
      year.yoyPct == null
        ? `${year.count} ${year.count === 1 ? "pagamento" : "pagamentos"}`
        : `${year.yoyPct >= 0 ? "↑" : "↓"} ${Math.abs(year.yoyPct).toFixed(0)}% vs ${
            year.year - 1
          } · ${year.count} ${year.count === 1 ? "pagamento" : "pagamentos"}`,
  }));

  const handlePick = (group: RankedGroup) => {
    setTableScope(breakdownScope);

    if (activeGroup === group.name) {
      setActiveGroup(null);
      setFilters(EMPTY_DIVIDEND_FILTERS);
      setQuery("");
      return;
    }

    setActiveGroup(group.name);
    setQuery("");
    if (groupBy === "ativo") setFilters({ ...EMPTY_DIVIDEND_FILTERS, ativo: [group.name] });
    else if (groupBy === "classe") setFilters({ ...EMPTY_DIVIDEND_FILTERS, classe: [group.name] });
    else setFilters({ ...EMPTY_DIVIDEND_FILTERS, tipo: [group.name] });
  };

  const clearAll = () => {
    setFilters(EMPTY_DIVIDEND_FILTERS);
    setQuery("");
    setActiveGroup(null);
  };

  const footerLines = [
    {
      label: "Yield on cost · 12 meses",
      value: yieldOnCost == null ? "—" : `${yieldOnCost.toFixed(2)}%`,
    },
    { label: "Total recebido · histórico", value: fmt(totalAll) },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.topGrid}>
        <SummaryHeroCard
          kicker="Proventos · últimos 12 meses"
          total={trailing.total}
          reference={
            previousWindow.total > 0
              ? { label: "12m anteriores", value: previousWindow.total }
              : undefined
          }
          deltaLabels={{ above: "acima dos 12m anteriores", below: "abaixo dos 12m anteriores" }}
          comparisons={comparisons}
        />
        <SplitBarCard
          kicker="Composição · 12 meses"
          segments={segments}
          footerLines={footerLines}
          emptyLabel="Nenhum provento nos últimos 12 meses."
        />
      </div>

      <MonthlyBarsCard
        kicker="Ritmo mês a mês"
        points={series.map((point) => ({
          key: point.key,
          label: point.label,
          value: point.value,
          selected:
            tableScope.month != null &&
            point.key === `${tableScope.year}-${String(tableScope.month).padStart(2, "0")}`,
        }))}
        reference={
          trailing.average > 0
            ? { value: trailing.average, label: "média dos 12 meses" }
            : undefined
        }
        legend={[{ tone: "accent", label: "recebido" }]}
        filter={<PeriodFilter groups={paceGroups} value={paceRange} onChange={setPaceRange} />}
        onPick={(key) => {
          const [pointYear, pointMonth] = key.split("-").map(Number);
          const next: Scope = { year: pointYear, month: pointMonth };
          setBreakdownScope(next);
          setTableScope(next);
        }}
      />

      <div className={styles.splitGrid}>
        <RankedBarsCard
          kicker="Quem paga os proventos"
          select={{
            value: groupBy,
            options: GROUP_OPTIONS,
            onChange: (value) => {
              setGroupBy(value as DividendGroupBy);
              clearAll();
            },
          }}
          filter={
            <MonthYearPicker
              year={breakdownScope.year}
              month={breakdownScope.month}
              markedKeys={markedKeys}
              align="right"
              onChange={(year, month) => setBreakdownScope({ year, month })}
            />
          }
          subtitle={`${scopeLabelOf(breakdownScope)} · ${fmt(breakdownTotals.total)} em ${
            breakdownTotals.count
          } ${
            breakdownTotals.count === 1 ? "pagamento" : "pagamentos"
          } · toque para filtrar a lista`}
          groups={breakdownGroups}
          onPick={handlePick}
          activeName={activeGroup}
          emptyLabel="Nenhum provento neste período."
        />
        <RankedBarsCard
          kicker="Ano a ano"
          subtitle="histórico completo · toque para ver o ano na lista"
          groups={yearGroups}
          onPick={(group) => setTableScope({ year: Number(group.name), month: null })}
          emptyLabel="Nenhum provento recebido ainda."
        />
      </div>

      <DividendsTable
        entries={list}
        year={tableScope.year}
        month={tableScope.month}
        filter={
          <MonthYearPicker
            year={tableScope.year}
            month={tableScope.month}
            markedKeys={markedKeys}
            align="right"
            onChange={(year, month) => setTableScope({ year, month })}
          />
        }
        filters={filters}
        onFiltersChange={setFilters}
        query={query}
        onQueryChange={setQuery}
        onClearAll={clearAll}
        classeOptions={filterOptions.classe}
        tipoOptions={filterOptions.tipo}
        ativoOptions={filterOptions.ativo}
      />
    </div>
  );
}
