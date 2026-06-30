import { Eye, EyeOff } from "lucide-react";
import { ExpenseActions } from "../../components/ExpenseActions/ExpenseActions";
import { BigNumbers } from "../../components/BigNumbers/BigNumbers";
import type { BigNumberCardProps } from "../../components/BigNumbers/BigNumbers";
import { Charts } from "../../components/Charts/Charts";
import type { BarChartConfig, PieChartConfig } from "../../components/Charts/Charts";
import { ExpensesTable } from "../../components/ExpensesTable/ExpensesTable";
import { ExpensesProvider } from "../../context/ExpensesContext";
import { useExpenses } from "../../context/expensesStore";
import { usePrivacy } from "../../context/privacyStore";
import { monthLabel } from "../../utils/date";
import styles from "./ExpensesPage.module.css";

const CATEGORY_CORES: Record<string, string> = {
  Alimentação: "#ef4444",
  Transporte: "#f59e0b",
  Moradia: "#6366f1",
  Contas: "#22d3ee",
  Saúde: "#10b981",
  Lazer: "#ec4899",
  Educação: "#8b5cf6",
  Compras: "#f97316",
  Outros: "#94a3b8",
};

function ExpensesDashboard() {
  const { data, loading, error } = useExpenses();
  const { formatCurrency: fmt } = usePrivacy();

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

  const cards: BigNumberCardProps[] = [
    {
      label: "Saldo do mês",
      value: fmt(data.month_balance),
      details: [
        { label: "Receitas", value: fmt(data.month_income) },
        { label: "Despesas", value: fmt(data.month_expense) },
      ],
      accentClass: "indigo",
      delay: 0,
    },
    {
      label: "Despesas do mês",
      value: fmt(data.month_expense),
      details: [{ label: "Média mensal (12m)", value: fmt(data.avg_monthly_expense) }],
      accentClass: "red",
      delay: 80,
    },
    {
      label: "Receitas do mês",
      value: fmt(data.month_income),
      details: [{ label: "Saldo do mês", value: fmt(data.month_balance) }],
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
    })),
  };

  const totalCategorias = data.by_category.reduce((sum, item) => sum + item.total, 0);
  const pie: PieChartConfig = {
    title: "Gasto por Categoria",
    data: data.by_category.map((item) => ({
      name: item.category,
      value: item.total,
      percent: totalCategorias > 0 ? (item.total / totalCategorias) * 100 : 0,
      color: CATEGORY_CORES[item.category] || "#94a3b8",
      formatted: fmt(item.total),
    })),
  };

  return (
    <div className={styles.container}>
      <BigNumbers cards={cards} />
      <Charts bar={bar} pie={pie} />
      <ExpensesTable />
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
