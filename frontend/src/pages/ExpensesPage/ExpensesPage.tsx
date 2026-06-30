import { useState } from "react";
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
import { monthLabel } from "../../utils/date";
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

function ExpensesDashboard() {
  const { data, loading, error, refresh } = useExpenses();
  const { formatCurrency: fmt } = usePrivacy();
  const [donutMode, setDonutMode] = useState<DonutMode>("category");
  const [filter, setFilter] = useState<TableFilter>(null);

  if (loading) {
    return <div className={styles.state}>Carregando dados de gastos...</div>;
  }

  if (error) {
    return (
      <div className={`${styles.state} ${styles.error}`}>Erro ao carregar dados: {error.message}</div>
    );
  }

  if (!data) {
    return null;
  }

  const prevExpense = data.monthly.length >= 2 ? data.monthly[data.monthly.length - 2].expense : 0;
  const expenseVariation = prevExpense > 0 ? ((data.month_expense - prevExpense) / prevExpense) * 100 : null;

  const cards: BigNumberCardProps[] = [
    {
      label: "Despesa do Mês",
      value: fmt(data.month_expense),
      side:
        expenseVariation != null
          ? {
              text: `${expenseVariation >= 0 ? "+" : ""}${expenseVariation.toFixed(0)}%`,
              tone: expenseVariation > 0 ? "down" : "up",
            }
          : undefined,
      details: [{ label: "Média mensal (12m)", value: fmt(data.avg_monthly_expense) }],
      accentClass: "red",
      delay: 80,
    },
    {
      label: "Receita do Mês",
      value: fmt(data.month_income),
      details: [{ label: "Média mensal (12m)", value: fmt(data.avg_monthly_income) }],
      accentClass: "green",
      delay: 160,
    },
  ];

  const bar: BarChartConfig = {
    title: "Gasto total por Mês",
    badge: "Últimos 12 meses",
    color: "#ef4444",
    data: data.monthly.map((m) => ({
      label: monthLabel(m.month),
      value: m.expense,
      formatted: fmt(m.expense),
      key: m.month,
    })),
    onBarClick: (key) =>
      setFilter((prev) =>
        prev && prev.field === "month" && prev.value === key ? null : { field: "month", value: key },
      ),
    activeBar: filter && filter.field === "month" ? filter.value : null,
  };

  const pieSource = donutMode === "category" ? data.by_category : data.by_subcategory;
  const colorMap = donutMode === "category" ? CATEGORY_CORES : SUBCATEGORY_CORES;
  const totalPie = pieSource.reduce((sum, item) => sum + item.total, 0);

  const pie: PieChartConfig = {
    title: donutMode === "category" ? "Gastos por Categoria" : "Gastos por Subcategoria",
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
    <div className={styles.container}>
      <BigNumbers cards={cards} prepend={<BudgetCard summary={data} onSaved={refresh} />} />
      <Charts bar={bar} pie={pie} />
      <ExpensesTable filter={filter} onClearFilter={() => setFilter(null)} />
    </div>
  );
}

export function ExpensesPage() {
  const { hidden, toggle } = usePrivacy();

  return (
    <ExpensesProvider>
      <div className={styles.toolbar}>
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
      <ExpensesDashboard />
    </ExpensesProvider>
  );
}
