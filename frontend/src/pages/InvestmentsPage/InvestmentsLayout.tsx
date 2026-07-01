import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { PortfolioProvider } from "../../context/PortfolioContext";
import { PortfolioActions } from "../../components/PortfolioActions/PortfolioActions";
import { usePrivacy } from "../../context/privacyStore";
import styles from "./InvestmentsLayout.module.css";

const TABS = [
  { to: "/investimentos", label: "Carteira", end: true },
  { to: "/investimentos/proventos", label: "Proventos", end: false },
  { to: "/investimentos/lancamentos", label: "Lançamentos", end: false },
  { to: "/investimentos/imposto-de-renda", label: "Imposto de Renda", end: false },
];

export function InvestmentsLayout() {
  const { hidden, toggle } = usePrivacy();
  const { pathname } = useLocation();
  const isCarteira = pathname === "/investimentos";

  return (
    <PortfolioProvider>
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

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.eyeButton}
            onClick={toggle}
            title={hidden ? "Mostrar valores" : "Ocultar valores"}
          >
            {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          {isCarteira && <PortfolioActions />}
        </div>
      </div>

      <Outlet />
    </PortfolioProvider>
  );
}
