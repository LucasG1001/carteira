import { Outlet, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { PortfolioProvider } from "../../context/PortfolioContext";
import { PageHeader } from "../../components/PageHeader/PageHeader";
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
      <PageHeader
        tabs={TABS}
        actions={
          <>
            <button
              type="button"
              className={styles.eyeButton}
              onClick={toggle}
              title={hidden ? "Mostrar valores" : "Ocultar valores"}
            >
              {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            {isCarteira && <PortfolioActions />}
          </>
        }
      />

      <Outlet />
    </PortfolioProvider>
  );
}
