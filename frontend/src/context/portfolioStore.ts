import { createContext, useContext } from 'react';
import type { BackendPortfolioSummary } from '../services/api';

export type PortfolioContextType = {
  data: BackendPortfolioSummary | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

export const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}
