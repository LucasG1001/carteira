import { createContext, useContext } from 'react';

export type PrivacyContextType = {
  hidden: boolean;
  toggle: () => void;
  formatCurrency: (value: number) => string;
};

export const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (context === undefined) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
}
