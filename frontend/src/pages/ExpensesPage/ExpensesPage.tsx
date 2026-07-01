import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { ExpenseActions } from "../../components/ExpenseActions/ExpenseActions";
import { BigNumbers } from "../../components/BigNumbers/BigNumbers";
import type { BigNumberCardProps } from "../../components/BigNumbers/BigNumbers";
import { Charts } from "../../components/Charts/Charts";
import type { BarChartConfig, PieChartConfig } from "../../components/Charts/Charts";
import { ExpensesTable } from "../../components/ExpensesTable/ExpensesTable";
import type { TableFilter } from "../../components/ExpensesTable/ExpensesTable";
import { BudgetCard } from "../../components/BudgetCard/BudgetCard";
import { ExpensesProvider } from "../../context/ExpensesContext";
import { useExpenses } from "../../context/expensesStore";
import { usePrivacy } from "../../context/privacyStore";
import { MESES, monthLabel } from "../../utils/date";
import { availableYears, buildExpenseView } from "../../utils/expenseView";
import styles from "./ExpensesPage.module.css";

type DonutMode = "category" | "subcategory";

const CATEGORY_CORES: Record<string, string> = {
  Essenciais: "#6366f1",
  Lazer: "#ec4899",
};

const SUBCATEGORY_CORES: Record<string, string> = {
  Moradia: "#6366f1",
  Alimentação: "#ef4444",
  Transporte: "#f59e0b",
  Saúde: "#10b981",
  Educação: "#8b5cf6",
  Compras: "#f97316",
  Serviços: "#22d3ee",
  Finanças: "#14b8a6",
  Pets: "#ec4899",
  Outros: "#94a3b8",
};

function ExpensesContent() {
  const { data, loading, error, refresh } = useExpenses();
  const { hidden, toggle, formatCurrency: fmt } = usePrivacy();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState<number | null>(null);
  const [donutMode, setDonutMode] = useState<DonutMode>("category");
  const [filter, setFilter] = useState<TableFilter>(null);

  const years = useMemo(() => (data ? availableYears(data.entries) : []), [data]);
  const yearOptions = years.length ? years : [year];
  const view = useMemo(() => (data ? buildExpenseView(data, { year, month }) : null), [data, year, month]);

  const resetScope = () => {
    setMonth(null);
    setFilter(null);
  };

  const header = (
    <div className={styles.toolbar}>
      <div className={styles.filters}>
        <select
          className={styles.filterSelect}
          value={year}
          onChange={(event) => {
            setYear(Number(event.target.value));
            resetScope();
          }}
        >
          {yearOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          className={styles.filterSelect}
          value={month ?? ""}
          onChange={(event) => {
            const value = event.target.value;
            setMonth(value ? Number(value) : null);
            setFilter(null);
          }}
        >
          <option value="">Todos os meses</option>
          {MESES.map((label, index) => (
            <option key={label} value={index + 1}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.eyeButton}
          onClick={toggle}
          title={hidden ? "Mostrar valores" : "Ocultar valores"}
        >
          {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
          <span className={styles.eyeLabel}>{hidden ? "Mostrar valores" : "Ocultar valores"}</span>
        </button>
        <ExpenseActions />
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        {header}
        <div className={styles.state}>Carregando dados de gastos...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        {header}
        <div className={`${styles.state} ${styles.error}`}>Erro ao carregar dados: {error.message}</div>
      </>
    );
  }

  if (!data || !view) {
    return header;
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

  const pieSource = donutMode === "category" ? view.donutByCategory : view.donutBySubcategory;
  const colorMap = donutMode === "category" ? CATEGORY_CORES : SUBCATEGORY_CORES;
  const totalPie = pieSource.reduce((sum, item) => sum + item.total, 0);

  const pie: PieChartConfig = {
    title: donutMode === "category" ? "Por Categoria" : "Por Subcategoria",
    data: pieSource.map((item) => ({
      name: item.category,
      value: item.total,
      percent: totalPie > 0 ? (item.total / totalPie) * 100 : 0,
      color: colorMap[item.category] || "#94a3b8",
      formatted: fmt(item.total),
    })),
    modes: [
      { key: "category", label: "Categoria" },
      { key: "subcategory", label: "Subcategoria" },
    ],
    activeMode: donutMode,
    onModeChange: (key) => {
      setDonutMode(key as DonutMode);
      setFilter(null);
    },
    onSliceClick: (name) =>
      setFilter((prev) =>
        prev && prev.field === donutMode && prev.value === name ? null : { field: donutMode, value: name },
      ),
    activeSlice: filter && filter.field === donutMode ? filter.value : null,
  };

  return (
    <>
      {header}
      <div className={styles.container}>
        <BigNumbers
          cards={cards}
          prepend={<BudgetCard spentByCategory={view.monthScope.byCategory} budgets={data.budgets} onSaved={refresh} />}
        />
        <Charts bar={bar} pie={pie} />
        <ExpensesTable filter={filter} onClearFilter={() => setFilter(null)} year={year} month={month} />
      </div>
    </>
  );
}

export function ExpensesPage() {
  return (
    <ExpensesProvider>
      <ExpensesContent />
    </ExpensesProvider>
  );
}
