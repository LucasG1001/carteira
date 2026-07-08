import { useMemo, useState } from "react";
import { BigNumbers } from "../../components/BigNumbers/BigNumbers";
import type { BigNumberCardProps } from "../../components/BigNumbers/BigNumbers";
import { Charts } from "../../components/Charts/Charts";
import type { BarChartConfig, PieChartConfig } from "../../components/Charts/Charts";
import { ExpensesTable } from "../../components/ExpensesTable/ExpensesTable";
import type { TableFilter } from "../../components/ExpensesTable/ExpensesTable";
import { BudgetCard } from "../../components/BudgetCard/BudgetCard";
import { useExpenses } from "../../context/expensesStore";
import { usePrivacy } from "../../context/privacyStore";
import { useExpensesFilter } from "./expensesFilterStore";
import { monthLabel } from "../../utils/date";
import { buildExpenseView, donutData } from "../../utils/expenseView";
import {
  CHART_FALLBACK_COLOR,
  EXPENSE_CATEGORY_COLORS,
  EXPENSE_SUBCATEGORY_COLORS,
} from "../../utils/chartColors";
import styles from "./ExpensesPage.module.css";

export function ExpensesPage() {
  const { data, loading, error, refresh } = useExpenses();
  const { formatCurrency: fmt } = usePrivacy();
  const { year, month, setMonth } = useExpensesFilter();
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [filter, setFilter] = useState<TableFilter>(null);
  const [scope, setScope] = useState(`${year}-${month}`);

  const currentScope = `${year}-${month}`;
  if (currentScope !== scope) {
    setScope(currentScope);
    setFilter(null);
  }

  const view = useMemo(() => (data ? buildExpenseView(data, { year, month }) : null), [data, year, month]);
  const donutBase = useMemo(() => (data ? donutData(data, { year, month }, null) : []), [data, year, month]);
  const donutSub = useMemo(
    () => (data && categoriaFiltro ? donutData(data, { year, month }, categoriaFiltro) : []),
    [data, year, month, categoriaFiltro],
  );

  if (loading) {
    return <div className={styles.state}>Carregando dados de gastos...</div>;
  }

  if (error) {
    return <div className={`${styles.state} ${styles.error}`}>Erro ao carregar dados: {error.message}</div>;
  }

  if (!data || !view) {
    return null;
  }

  const variation = view.monthScope.variationPct;
  const topSub = view.yearTopSubcategory;

  const cards: BigNumberCardProps[] = [
    {
      label: "Despesa do Mês",
      value: fmt(view.monthScope.expense),
      side:
        variation != null
          ? {
              text: `${variation >= 0 ? "+" : ""}${variation.toFixed(0)}%`,
              tone: variation > 0 ? "down" : "up",
            }
          : undefined,
      details: [
        { label: "Referente a", value: monthLabel(view.monthScope.monthKey) },
        { label: "Média mensal", value: fmt(view.yearAvgMonthly) },
      ],
      accentClass: "red",
      delay: 80,
    },
    {
      label: `Gasto Total (${year})`,
      value: fmt(view.yearExpense),
      details: [
        { label: "Maior subcategoria", value: topSub ? `${topSub.name} · ${fmt(topSub.total)}` : "—" },
        { label: "Média mensal", value: fmt(view.yearAvgMonthly) },
      ],
      accentClass: "amber",
      delay: 160,
    },
    {
      label: "Gastos Fixos",
      value: fmt(view.fixedVariable.fixed),
      details: [
        { label: "Variáveis", value: fmt(view.fixedVariable.variable) },
        { label: "% fixo do total", value: `${view.fixedVariable.fixedPct.toFixed(0)}%` },
      ],
      accentClass: "green",
      delay: 240,
    },
  ];

  const bar: BarChartConfig = {
    title: "Total por Mês",
    badge: `Ano ${year}`,
    color: "#ef4444",
    data: view.barSeries.map((point) => ({
      label: monthLabel(point.month),
      value: point.expense,
      formatted: fmt(point.expense),
      key: point.month,
    })),
    onBarClick: (key) => {
      const clicked = Number(key.split("-")[1]);
      setMonth((prev) => (prev === clicked ? null : clicked));
      setFilter(null);
    },
    activeBar: month ? `${year}-${String(month).padStart(2, "0")}` : null,
  };

  const donutSlices = categoriaFiltro ? donutSub : donutBase;
  const categoriaOptions = donutBase.map((item) => item.category);
  const sliceField = categoriaFiltro ? "subcategory" : "category";
  const colorMap = categoriaFiltro ? EXPENSE_SUBCATEGORY_COLORS : EXPENSE_CATEGORY_COLORS;
  const totalPie = donutSlices.reduce((sum, item) => sum + item.total, 0);

  const pie: PieChartConfig = {
    title: categoriaFiltro ? `Subcategorias — ${categoriaFiltro}` : "Por Categoria",
    data: donutSlices.map((item) => ({
      name: item.category,
      value: item.total,
      percent: totalPie > 0 ? (item.total / totalPie) * 100 : 0,
      color: colorMap[item.category] || CHART_FALLBACK_COLOR,
      formatted: fmt(item.total),
    })),
    select: {
      value: categoriaFiltro,
      options: [
        { value: "", label: "Por categoria" },
        ...categoriaOptions.map((category) => ({ value: category, label: category })),
      ],
      onChange: (value) => {
        setCategoriaFiltro(value);
        setFilter(null);
      },
    },
    onSliceClick: (name) =>
      setFilter((prev) =>
        prev && prev.field === sliceField && prev.value === name ? null : { field: sliceField, value: name },
      ),
    activeSlice: filter && filter.field === sliceField ? filter.value : null,
  };

  return (
    <div className={styles.container}>
      <BigNumbers
        cards={cards}
        prepend={<BudgetCard spentByCategory={view.monthScope.byCategory} budgets={data.budgets} onSaved={refresh} />}
      />
      <Charts bar={bar} pie={pie} />
      <ExpensesTable
        filter={filter}
        onClearFilter={() => setFilter(null)}
        year={year}
        month={view.monthScope.month}
      />
    </div>
  );
}
