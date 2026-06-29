import type { ReactNode } from 'react';
import { useState } from 'react';
import { PrivacyContext } from './privacyStore';

const STORAGE_KEY = 'values-hidden';
const MASK = 'R$ ••••';

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');

  const toggle = () => {
    setHidden((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  const formatCurrency = (value: number) =>
    hidden ? MASK : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <PrivacyContext.Provider value={{ hidden, toggle, formatCurrency }}>
      {children}
    </PrivacyContext.Provider>
  );
}
