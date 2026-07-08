import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { MonthYearPicker } from "../../components/MonthYearPicker/MonthYearPicker";
import { ExpenseActions } from "../../components/ExpenseActions/ExpenseActions";
import { GoalActions } from "../../components/GoalActions/GoalActions";
import { ExpensesProvider } from "../../context/ExpensesContext";
import { useExpenses } from "../../context/expensesStore";
import { GoalsProvider } from "../../context/GoalsContext";
import { usePrivacy } from "../../context/privacyStore";
import type { ExpensesOutletContext } from "./expensesFilterStore";
import styles from "./ExpensesLayout.module.css";

const TABS = [
  { to: "/gastos", label: "Gastos", end: true },
  { to: "/gastos/caixinhas", label: "Caixinhas", end: false },
];

function Tabs() {
  return (
    <nav className={styles.tabs}>
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabActive : ""}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}

function EyeButton() {
  const { hidden, toggle } = usePrivacy();
  return (
    <button
      type="button"
      className={styles.eyeButton}
      onClick={toggle}
      title={hidden ? "Mostrar valores" : "Ocultar valores"}
    >
      {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );
}

function GastosShell() {
  const { data } = useExpenses();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState<number | null>(null);

  const markedKeys = useMemo(
    () => new Set((data?.entries ?? []).map((entry) => entry.date.slice(0, 7))),
    [data],
  );

  const context: ExpensesOutletContext = { year, month, setYear, setMonth };

  return (
    <>
      <div className={styles.header}>
        <Tabs />
        <div className={styles.actions}>
          <MonthYearPicker
            year={year}
            month={month}
            markedKeys={markedKeys}
            align="right"
            onChange={(nextYear, nextMonth) => {
              setYear(nextYear);
              setMonth(nextMonth);
            }}
          />
          <EyeButton />
          <ExpenseActions />
        </div>
      </div>
      <Outlet context={context} />
    </>
  );
}

function CaixinhasShell() {
  return (
    <>
      <div className={styles.header}>
        <Tabs />
        <div className={styles.actions}>
          <EyeButton />
          <GoalActions />
        </div>
      </div>
      <Outlet />
    </>
  );
}

export function ExpensesLayout() {
  const { pathname } = useLocation();
  const isGastos = pathname === "/gastos";

  if (isGastos) {
    return (
      <ExpensesProvider>
        <GastosShell />
      </ExpensesProvider>
    );
  }

  return (
    <GoalsProvider>
      <CaixinhasShell />
    </GoalsProvider>
  );
}
