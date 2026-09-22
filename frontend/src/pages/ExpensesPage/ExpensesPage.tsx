import { useMemo, useState } from "react";
import { CommitmentsCard } from "../../components/CommitmentsCard/CommitmentsCard";
import { ExpensesTable } from "../../components/ExpensesTable/ExpensesTable";
import { FixedVariableCard } from "../../components/FixedVariableCard/FixedVariableCard";
import { MonthSummaryCard } from "../../components/MonthSummaryCard/MonthSummaryCard";
import type { Comparison } from "../../components/MonthSummaryCard/MonthSummaryCard";
import { MonthlyPaceCard } from "../../components/MonthlyPaceCard/MonthlyPaceCard";
import { MonthYearPicker } from "../../components/MonthYearPicker/MonthYearPicker";
import { PeriodFilter } from "../../components/PeriodFilter/PeriodFilter";
import type { PeriodGroup } from "../../components/PeriodFilter/PeriodFilter";
import { SpendBreakdownCard } from "../../components/SpendBreakdownCard/SpendBreakdownCard";
import { useExpenses } from "../../context/expensesStore";
import { MESES } from "../../utils/date";
import {
  availableYears,
  commitments,
  groupBreakdown,
  monthTotal,
  paceWindow,
  scopeTotals,
  trailingAverages,
} from "../../utils/expenseView";
import type { BreakdownGroup, GroupBy, PaceRange } from "../../utils/expenseView";
import { EMPTY_FILTERS } from "../../utils/expenseFilters";
import type { ExpenseFilterState } from "../../utils/expenseFilters";
import styles from "./ExpensesPage.module.css";

type Scope = { year: number; month: number | null };

function variation(current: number, reference: number): number | null {
  if (!reference) return null;
  return ((current - reference) / reference) * 100;
}

function previousMonth(year: number, month: number): [number, number] {
  const absolute = year * 12 + (month - 1) - 1;
  return [Math.floor(absolute / 12), (absolute % 12) + 1];
}

const PACE_QUICK_OPTIONS = [
  { value: "last6", label: "Últimos 6 meses" },
  { value: "last12", label: "Últimos 12 meses" },
  { value: "next12", label: "Próximos 12 meses" },
];

function paceRangeOf(value: string): PaceRange {
  if (value.startsWith("year:")) return { kind: "year", year: Number(value.slice(5)) };
  if (value === "next12") return { kind: "next", count: 12 };
  if (value === "last6") return { kind: "last", count: 6 };
  return { kind: "last", count: 12 };
}

export function ExpensesPage() {
  const { data, loading, error, refresh } = useExpenses();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [groupBy, setGroupBy] = useState<GroupBy>("grupo");
  const [filters, setFilters] = useState<ExpenseFilterState>(EMPTY_FILTERS);
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [paceRange, setPaceRange] = useState("last12");
  const [tableScope, setTableScope] = useState<Scope>({
    year: currentYear,
    month: currentMonth,
  });
  const [lastTableScope, setLastTableScope] = useState(`${currentYear}-${currentMonth}`);

  const tableScopeKey = `${tableScope.year}-${tableScope.month}`;
  if (tableScopeKey !== lastTableScope) {
    setLastTableScope(tableScopeKey);
    setFilters(EMPTY_FILTERS);
    setQuery("");
    setActiveGroup(null);
  }

  const entries = useMemo(() => data?.entries ?? [], [data]);
  const markedKeys = useMemo(
    () => new Set(entries.map((entry) => entry.date.slice(0, 7))),
    [entries],
  );

  const monthTotals = useMemo(
    () => scopeTotals(entries, currentYear, currentMonth),
    [entries, currentYear, currentMonth],
  );
  const averages = useMemo(
    () => trailingAverages(entries, currentYear, currentMonth, 12),
    [entries, currentYear, currentMonth],
  );
  const activeCommitments = useMemo(
    () => commitments(entries, currentYear, currentMonth),
    [entries, currentYear, currentMonth],
  );

  const groups = useMemo(
    () => groupBreakdown(entries, tableScope.year, tableScope.month, groupBy),
    [entries, tableScope, groupBy],
  );

  const pace = useMemo(
    () =>
      paceWindow(
        entries,
        paceRangeOf(paceRange),
        tableScope.month
          ? `${tableScope.year}-${String(tableScope.month).padStart(2, "0")}`
          : null,
      ),
    [entries, paceRange, tableScope],
  );
  const paceGroups: PeriodGroup[] = useMemo(
    () => [
      { title: "Filtros rápidos", options: PACE_QUICK_OPTIONS },
      {
        title: "Filtro anual",
        options: availableYears(entries).map((option) => ({
          value: `year:${option}`,
          label: String(option),
        })),
      },
    ],
    [entries],
  );

  if (loading) {
    return <div className={styles.state}>Carregando dados de gastos...</div>;
  }

  if (error) {
    return <div className={`${styles.state} ${styles.error}`}>Erro ao carregar dados: {error.message}</div>;
  }

  if (!data) return null;

  const meta = data.budgets.find((budget) => budget.category === "Geral")?.amount ?? 0;

  const [prevYear, prevMonth] = previousMonth(currentYear, currentMonth);
  const previousTotal = monthTotal(entries, prevYear, prevMonth);
  const comparisons: Comparison[] = [
    {
      label: MESES[prevMonth - 1],
      value: previousTotal > 0 ? previousTotal : null,
      variationPct: variation(monthTotals.total, previousTotal),
    },
    {
      label: "Média dos 12 meses",
      value: averages.total > 0 ? averages.total : null,
      variationPct: variation(monthTotals.total, averages.total),
    },
  ];

  const handlePick = (group: BreakdownGroup) => {
    if (activeGroup === group.name) {
      setActiveGroup(null);
      setFilters(EMPTY_FILTERS);
      setQuery("");
      return;
    }
    setActiveGroup(group.name);
    if (groupBy === "desc") {
      setFilters(EMPTY_FILTERS);
      setQuery(group.name);
      return;
    }
    setQuery("");
    if (groupBy === "origem") setFilters({ ...EMPTY_FILTERS, origem: [group.name] });
    else if (groupBy === "grupo") setFilters({ ...EMPTY_FILTERS, grupo: [group.name] });
    else if (groupBy === "destino") setFilters({ ...EMPTY_FILTERS, destino: [group.name] });
    else setFilters({ ...EMPTY_FILTERS, classificacao: [group.name] });
  };

  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
    setQuery("");
    setActiveGroup(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.topGrid}>
        <MonthSummaryCard
          kicker={`${MESES[currentMonth - 1]} · o mês até aqui`}
          total={monthTotals.total}
          meta={meta}
          comparisons={comparisons}
          onSaved={refresh}
        />
        <FixedVariableCard
          kicker={`Travado x escolha sua · ${MESES[currentMonth - 1].toLowerCase()}`}
          totals={monthTotals}
          averages={averages}
          averageLabel="12 meses"
        />
      </div>

      <MonthlyPaceCard
        points={pace}
        meta={meta}
        filter={
          <PeriodFilter groups={paceGroups} value={paceRange} onChange={setPaceRange} />
        }
        onPick={(key) => {
          const [pointYear, pointMonth] = key.split("-").map(Number);
          setTableScope({ year: pointYear, month: pointMonth });
        }}
      />

      <div className={styles.ledgerGrid}>
        <div className={styles.ledgerSide}>
          <SpendBreakdownCard
            groups={groups}
            groupBy={groupBy}
            onGroupByChange={(value) => {
              setGroupBy(value);
              clearAll();
            }}
            icons={groupBy === "grupo"}
            onPick={handlePick}
            activeName={activeGroup}
          />

          <CommitmentsCard items={activeCommitments} />
        </div>

        <ExpensesTable
          year={tableScope.year}
          month={tableScope.month}
          filter={
            <MonthYearPicker
              year={tableScope.year}
              month={tableScope.month}
              markedKeys={markedKeys}
              onChange={(nextYear, nextMonth) =>
                setTableScope({ year: nextYear, month: nextMonth })
              }
            />
          }
          filters={filters}
          query={query}
          onQueryChange={setQuery}
        />
      </div>
    </div>
  );
}
