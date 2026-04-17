import { Header } from './components/Header/Header';
import { PortfolioActions } from './components/PortfolioActions/PortfolioActions';
import { BigNumbers } from './components/BigNumbers/BigNumbers';
import { Charts } from './components/Charts/Charts';
import { AssetsTable } from './components/AssetsTable/AssetsTable';
import { PortfolioProvider, usePortfolio } from './context/PortfolioContext';
import styles from './App.module.css';

function MainContent() {
  const { data, loading, error } = usePortfolio();

  if (loading) {
    return <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Carregando dados da carteira...</div>;
  }

  if (error) {
    return <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>Erro ao carregar dados: {error.message}</div>;
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

function App() {
  return (
    <PortfolioProvider>
      <div className={styles.app}>
        <Header />
        <main className={styles.main}>
          <MainContent />
        </main>

        <footer className={styles.footer}>
          <p>
            © 2026 Carteira Investimentos
          </p>
        </footer>
      </div>
    </PortfolioProvider>
  );
}

export default App;
