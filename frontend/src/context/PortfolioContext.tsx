import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { getPortfolioSummary } from '../services/api';
import type { BackendPortfolioSummary } from '../services/api';

type PortfolioContextType = {
  data: BackendPortfolioSummary | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BackendPortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await getPortfolioSummary();
      setData(summary);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <PortfolioContext.Provider value={{ data, loading, error, refresh: fetchData }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}
