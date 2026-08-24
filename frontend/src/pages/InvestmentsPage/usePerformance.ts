import { useCallback, useEffect, useRef, useState } from 'react';
import { getPerformance } from '../../services/api';
import type { BackendPerformance } from '../../services/api';

export type PerformanceStatus = 'loading' | 'ready' | 'error';

export interface PerformanceData {
  monthly: BackendPerformance | null;
  monthlyStatus: PerformanceStatus;
  days: BackendPerformance | null;
  daysStatus: PerformanceStatus;
  loadedMonth: string | null;
  loadMonth: (key: string | null) => void;
}

export function usePerformance(): PerformanceData {
  const [monthly, setMonthly] = useState<BackendPerformance | null>(null);
  const [monthlyStatus, setMonthlyStatus] = useState<PerformanceStatus>('loading');
  const [days, setDays] = useState<BackendPerformance | null>(null);
  const [daysStatus, setDaysStatus] = useState<PerformanceStatus>('ready');
  const [loadedMonth, setLoadedMonth] = useState<string | null>(null);

  const cache = useRef(new Map<string, BackendPerformance>());
  const inFlight = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    getPerformance()
      .then((result) => {
        if (!active) return;
        setMonthly(result);
        setMonthlyStatus('ready');
      })
      .catch(() => {
        if (active) setMonthlyStatus('error');
      });
    return () => {
      active = false;
    };
  }, []);

  const loadMonth = useCallback((key: string | null) => {
    inFlight.current = key;
    setLoadedMonth(key);

    if (key === null) {
      setDays(null);
      setDaysStatus('ready');
      return;
    }

    const cached = cache.current.get(key);
    if (cached) {
      setDays(cached);
      setDaysStatus('ready');
      return;
    }

    setDays(null);
    setDaysStatus('loading');
    getPerformance({ granularity: 'day', month: key })
      .then((result) => {
        cache.current.set(key, result);
        if (inFlight.current !== key) return;
        setDays(result);
        setDaysStatus('ready');
      })
      .catch(() => {
        if (inFlight.current === key) setDaysStatus('error');
      });
  }, []);

  return { monthly, monthlyStatus, days, daysStatus, loadedMonth, loadMonth };
}
