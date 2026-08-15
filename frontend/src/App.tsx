import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MobileNav } from "./components/MobileNav/MobileNav";
import { useIsMobile } from "./hooks/useIsMobile";
import { PrivacyProvider } from "./context/PrivacyContext";
import { QuickAddProvider } from "./context/QuickAddContext";
import { InvestmentsLayout } from "./pages/InvestmentsPage/InvestmentsLayout";
import { InvestmentsPage } from "./pages/InvestmentsPage/InvestmentsPage";
import { ExpensesLayout } from "./pages/ExpensesPage/ExpensesLayout";
import { ExpensesPage } from "./pages/ExpensesPage/ExpensesPage";
import { GoalsPage } from "./pages/GoalsPage/GoalsPage";
import { TaxReportPage } from "./pages/TaxReportPage/TaxReportPage";
import { DividendsPage } from "./pages/DividendsPage/DividendsPage";
import { TransactionsPage } from "./pages/TransactionsPage/TransactionsPage";
import styles from "./App.module.css";

function App() {
  const isMobile = useIsMobile();

  return (
    <BrowserRouter>
      <PrivacyProvider>
        <QuickAddProvider>
          <div className={styles.layout}>
            <main className={styles.main}>
              <Routes>
                <Route path="/" element={<Navigate to="/investimentos" replace />} />
                <Route path="/investimentos" element={<InvestmentsLayout />}>
                  <Route index element={<InvestmentsPage />} />
                  <Route path="proventos" element={<DividendsPage />} />
                  <Route path="lancamentos" element={<TransactionsPage />} />
                  <Route path="imposto-de-renda" element={<TaxReportPage />} />
                </Route>
                <Route path="/gastos" element={<ExpensesLayout />}>
                  <Route index element={<ExpensesPage />} />
                  <Route path="caixinhas" element={<GoalsPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/investimentos" replace />} />
              </Routes>
            </main>
          </div>

          {isMobile && <MobileNav />}
        </QuickAddProvider>
      </PrivacyProvider>
    </BrowserRouter>
  );
}

export default App;
