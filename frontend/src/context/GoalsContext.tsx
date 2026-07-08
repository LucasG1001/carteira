import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { getGoals } from '../services/api';
import type { BackendGoal } from '../services/api';
import { GoalsContext } from './goalsStore';

export function GoalsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BackendGoal[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setError(null);
    try {
      const goals = await getGoals();
      setData(goals);
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
    <GoalsContext.Provider value={{ data, loading, error, refresh: fetchData }}>
      {children}
    </GoalsContext.Provider>
  );
}
