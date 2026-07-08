import { createContext, useContext } from 'react';
import type { BackendGoal } from '../services/api';

export type GoalsContextType = {
  data: BackendGoal[] | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

export const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export function useGoals() {
  const context = useContext(GoalsContext);
  if (context === undefined) {
    throw new Error('useGoals must be used within a GoalsProvider');
  }
  return context;
}
