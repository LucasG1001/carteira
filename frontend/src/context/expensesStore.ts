import { createContext, useContext } from 'react';
import type { BackendExpenseSummary } from '../services/api';

export type ExpensesContextType = {
  data: BackendExpenseSummary | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

export const ExpensesContext = createContext<ExpensesContextType | undefined>(undefined);

export function useExpenses() {
  const context = useContext(ExpensesContext);
  if (context === undefined) {
    throw new Error('useExpenses must be used within an ExpensesProvider');
  }
  return context;
}
