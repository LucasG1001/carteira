import { createContext, useContext } from 'react';

export type QuickAddContextType = {
  addHandler: (() => void) | null;
  registerAdd: (fn: (() => void) | null) => void;
  triggerAdd: () => void;
};

export const QuickAddContext = createContext<QuickAddContextType | undefined>(undefined);

export function useQuickAdd() {
  const context = useContext(QuickAddContext);
  if (context === undefined) {
    throw new Error('useQuickAdd must be used within a QuickAddProvider');
  }
  return context;
}
