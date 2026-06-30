import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { QuickAddContext } from './quickAddStore';

export function QuickAddProvider({ children }: { children: ReactNode }) {
  const [addHandler, setAddHandler] = useState<(() => void) | null>(null);

  const registerAdd = useCallback((fn: (() => void) | null) => {
    setAddHandler(() => fn);
  }, []);

  const triggerAdd = useCallback(() => {
    if (addHandler) addHandler();
  }, [addHandler]);

  return (
    <QuickAddContext.Provider value={{ addHandler, registerAdd, triggerAdd }}>
      {children}
    </QuickAddContext.Provider>
  );
}
