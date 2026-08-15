import { Outlet, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { ExpenseActions } from "../../components/ExpenseActions/ExpenseActions";
import { GoalActions } from "../../components/GoalActions/GoalActions";
import { ExpensesProvider } from "../../context/ExpensesContext";
import { GoalsProvider } from "../../context/GoalsContext";
import { usePrivacy } from "../../context/privacyStore";
import styles from "./ExpensesLayout.module.css";

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
  return (
    <>
      <PageHeader
        actions={
          <>
            <EyeButton />
            <ExpenseActions />
          </>
        }
      />
      <Outlet />
    </>
  );
}

function CaixinhasShell() {
  return (
    <>
      <PageHeader
        actions={
          <>
            <EyeButton />
            <GoalActions />
          </>
        }
      />
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
