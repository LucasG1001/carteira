import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { formatBRL } from '../utils/formatting';
import { PrivacyContext } from './privacyStore';

const STORAGE_KEY = 'values-hidden';
const MASK = 'R$ ••••';

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');

  const toggle = useCallback(() => {
    setHidden((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const formatCurrency = useCallback(
    (value: number) => (hidden ? MASK : formatBRL(value)),
    [hidden],
  );

  const value = useMemo(() => ({ hidden, toggle, formatCurrency }), [hidden, toggle, formatCurrency]);

  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>;
}
