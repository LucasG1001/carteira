import { useMemo, useState } from "react";
import { CommitmentsCard } from "../../components/CommitmentsCard/CommitmentsCard";
import { ExpensesTable } from "../../components/ExpensesTable/ExpensesTable";
import { FixedVariableCard } from "../../components/FixedVariableCard/FixedVariableCard";
import { MonthSummaryCard } from "../../components/MonthSummaryCard/MonthSummaryCard";
import type { Comparison } from "../../components/MonthSummaryCard/MonthSummaryCard";
import { MonthlyPaceCard } from "../../components/MonthlyPaceCard/MonthlyPaceCard";
import { MonthStepper } from "../../components/MonthStepper/MonthStepper";
import { SpendBreakdownCard } from "../../components/SpendBreakdownCard/SpendBreakdownCard";
import { useExpenses } from "../../context/expensesStore";
import { usePrivacy } from "../../context/privacyStore";
import { useExpensesFilter } from "./expensesFilterStore";
import { MESES } from "../../utils/date";
import {
  commitments,
  groupBreakdown,
  monthTotal,
  paceSeries,
  scopeTotals,
  trailingAverages,
} from "../../utils/expenseView";
import type { BreakdownGroup, GroupBy } from "../../utils/expenseView";
import { EMPTY_FILTERS } from "../../utils/expenseFilters";
import type { ExpenseFilterState } from "../../utils/expenseFilters";
import styles from "./ExpensesPage.module.css";

function variation(current: number, reference: number): number | null {
  if (!reference) return null;
  return ((current - reference) / reference) * 100;
}

export function ExpensesPage() {
  const { data, loading, error, refresh } = useExpenses();
  const { formatCurrency: fmt } = usePrivacy();
  const { year, month, setYear, setMonth } = useExpensesFilter();

  const [groupBy, setGroupBy] = useState<GroupBy>("sub");
  const [filters, setFilters] = useState<ExpenseFilterState>(EMPTY_FILTERS);
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [scope, setScope] = useState(`${year}-${month}`);

  const currentScope = `${year}-${month}`;
  if (currentScope !== scope) {
    setScope(currentScope);
    setFilters(EMPTY_FILTERS);
    setQuery("");
    setActiveGroup(null);
  }

  const entries = useMemo(() => data?.entries ?? [], [data]);
  const markedKeys = useMemo(
    () => new Set(entries.map((entry) => entry.date.slice(0, 7))),
    [entries],
  );
  const now = new Date();
  const referenceMonth =
    month ?? (year === now.getFullYear() ? now.getMonth() + 1 : 12);

  const totals = useMemo(() => scopeTotals(entries, year, month), [entries, year, month]);
  const groups = useMemo(
    () => groupBreakdown(entries, year, month, groupBy),
    [entries, year, month, groupBy],
  );
  const activeCommitments = useMemo(
    () => commitments(entries, year, referenceMonth),
    [entries, year, referenceMonth],
  );
  const pace = useMemo(() => paceSeries(entries, year, month), [entries, year, month]);
  const averages = useMemo(
    () => trailingAverages(entries, year, referenceMonth, 12),
    [entries, year, referenceMonth],
  );

  const origemOptions = useMemo(
    () => groupBreakdown(entries, year, month, "origem").map((group) => group.name),
    [entries, year, month],
  );
  const subOptions = useMemo(
    () => groupBreakdown(entries, year, month, "sub").map((group) => group.name),
    [entries, year, month],
  );

  if (loading) {
    return <div className={styles.state}>Carregando dados de gastos...</div>;
  }

  if (error) {
    return <div className={`${styles.state} ${styles.error}`}>Erro ao carregar dados: {error.message}</div>;
  }

  if (!data) return null;

  const meta = data.budgets.find((budget) => budget.category === "Geral")?.amount ?? 0;

  const activeMonths = pace.filter((point) => point.total > 0).length;

  const comparisons: Comparison[] = month
    ? (() => {
        const [prevYear, prevMonth] = previousMonth(year, month);
        const previous = monthTotal(entries, prevYear, prevMonth);
        return [
          {
            label: MESES[prevMonth - 1],
            value: previous > 0 ? previous : null,
            variationPct: variation(totals.total, previous),
          },
          {
            label: "Média dos 12 meses",
            value: averages.total > 0 ? averages.total : null,
            variationPct: variation(totals.total, averages.total),
          },
        ];
      })()
    : (() => {
        const previousYear = scopeTotals(entries, year - 1, null).total;
        return [
          {
            label: `Ano de ${year - 1}`,
            value: previousYear > 0 ? previousYear : null,
            variationPct: variation(totals.total, previousYear),
          },
          {
            label: "Média mensal do ano",
            value: activeMonths > 0 ? totals.total / activeMonths : null,
            variationPct: null,
            emptyNote: "sem lançamentos",
          },
        ];
      })();

  const scopeLabel = month ? MESES[month - 1].toLowerCase() : `ano de ${year}`;

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
    else if (groupBy === "sub") setFilters({ ...EMPTY_FILTERS, sub: [group.name] });
    else setFilters(EMPTY_FILTERS);
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
          period={
            <MonthStepper
              year={year}
              month={month}
              markedKeys={markedKeys}
              onChange={(nextYear, nextMonth) => {
                setYear(nextYear);
                setMonth(nextMonth);
              }}
            />
          }
          total={totals.total}
          meta={month ? meta : meta * Math.max(activeMonths, 1)}
          comparisons={comparisons}
          onSaved={refresh}
        />
        <FixedVariableCard
          kicker={`Travado x escolha sua · ${scopeLabel}`}
          totals={totals}
          averages={averages}
          averageLabel="12 meses"
        />
      </div>

      <MonthlyPaceCard
        points={pace}
        meta={meta}
        onPick={(key) => {
          const [pointYear, pointMonth] = key.split("-").map(Number);
          setYear(pointYear);
          setMonth((prev) => (prev === pointMonth && year === pointYear ? null : pointMonth));
        }}
      />

      <div className={styles.splitGrid}>
        <SpendBreakdownCard
          groups={groups}
          groupBy={groupBy}
          onGroupByChange={(value) => {
            setGroupBy(value);
            clearAll();
          }}
          subtitle={`${scopeLabel} · ${fmt(totals.total)} em ${totals.count} ${
            totals.count === 1 ? "lançamento" : "lançamentos"
          } · toque para filtrar a lista`}
          onPick={handlePick}
          activeName={activeGroup}
        />
        <CommitmentsCard items={activeCommitments} />
      </div>

      <ExpensesTable
        year={year}
        month={month}
        filters={filters}
        onFiltersChange={setFilters}
        query={query}
        onQueryChange={setQuery}
        onClearAll={clearAll}
        origemOptions={origemOptions}
        subOptions={subOptions}
      />
    </div>
  );
}

function previousMonth(year: number, month: number): [number, number] {
  const absolute = year * 12 + (month - 1) - 1;
  return [Math.floor(absolute / 12), (absolute % 12) + 1];
}
