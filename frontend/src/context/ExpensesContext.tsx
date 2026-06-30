import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { getExpensesSummary } from '../services/api';
import type { BackendExpenseSummary } from '../services/api';
import { ExpensesContext } from './expensesStore';

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BackendExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await getExpensesSummary();
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
    <ExpensesContext.Provider value={{ data, loading, error, refresh: fetchData }}>
      {children}
    </ExpensesContext.Provider>
  );
}
