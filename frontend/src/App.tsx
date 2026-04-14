import { Header } from './components/Header/Header';
import { BigNumbers } from './components/BigNumbers/BigNumbers';
import { Charts } from './components/Charts/Charts';
import { AssetsTable } from './components/AssetsTable/AssetsTable';
import styles from './App.module.css';

function App() {
  return (
    <div className={styles.app}>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <BigNumbers />
          <Charts />
          <AssetsTable />
        </div>
      </main>

      <footer className={styles.footer}>
        <p>
          © 2026 Carteira Investimentos — Dados meramente ilustrativos
        </p>
      </footer>
    </div>
  );
}

export default App;
