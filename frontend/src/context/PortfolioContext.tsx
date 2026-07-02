import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { getPortfolioSummary } from '../services/api';
import type { BackendPortfolioSummary } from '../services/api';
import { PortfolioContext } from './portfolioStore';

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BackendPortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
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
