import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { PrivacyProvider } from "./context/PrivacyContext";
import { InvestmentsPage } from "./pages/InvestmentsPage/InvestmentsPage";
import { ExpensesPage } from "./pages/ExpensesPage/ExpensesPage";
import styles from "./App.module.css";

const SIDEBAR_STORAGE_KEY = "sidebar-collapsed";

function App() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true"
  );

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  };

  return (
    <BrowserRouter>
      <PrivacyProvider>
        <div className={styles.layout}>
          <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
          <div
            className={`${styles.content} ${collapsed ? styles.contentCollapsed : ""}`}
          >
          <main className={styles.main}>
            <Routes>
              <Route path="/" element={<Navigate to="/investimentos" replace />} />
              <Route path="/investimentos" element={<InvestmentsPage />} />
              <Route path="/gastos" element={<ExpensesPage />} />
              <Route path="*" element={<Navigate to="/investimentos" replace />} />
            </Routes>
          </main>
          <footer className={styles.footer}>
            <p>© 2026 Carteira Investimentos</p>
          </footer>
          </div>
        </div>
      </PrivacyProvider>
    </BrowserRouter>
  );
}

export default App;
