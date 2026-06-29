import { PortfolioActions } from "../../components/PortfolioActions/PortfolioActions";
import { BigNumbers } from "../../components/BigNumbers/BigNumbers";
import { Charts } from "../../components/Charts/Charts";
import { AssetsTable } from "../../components/AssetsTable/AssetsTable";
import { PortfolioProvider } from "../../context/PortfolioContext";
import { usePortfolio } from "../../context/portfolioStore";
import styles from "./InvestmentsPage.module.css";

function PortfolioDashboard() {
  const { data, loading, error } = usePortfolio();

  if (loading) {
    return <div className={styles.state}>Carregando dados da carteira...</div>;
  }

  if (error) {
    return (
      <div className={`${styles.state} ${styles.error}`}>
        Erro ao carregar dados: {error.message}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className={styles.container}>
      <PortfolioActions />
      <BigNumbers />
      <Charts />
      <AssetsTable />
    </div>
  );
}

export function InvestmentsPage() {
  return (
    <PortfolioProvider>
      <PortfolioDashboard />
    </PortfolioProvider>
  );
}
