import { NavLink, Outlet } from "react-router-dom";
import styles from "./ExpensesLayout.module.css";

const TABS = [
  { to: "/gastos", label: "Gastos", end: true },
  { to: "/gastos/caixinhas", label: "Caixinhas", end: false },
];

export function ExpensesLayout() {
  return (
    <>
      <div className={styles.header}>
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
      </div>

      <Outlet />
    </>
  );
}
