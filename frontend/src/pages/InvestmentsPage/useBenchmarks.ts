import { useEffect, useState } from 'react';
import { getBenchmarks } from '../../services/api';
import type { BackendBenchmarkMonth } from '../../services/api';
import type { PerformanceStatus } from './usePerformance';

export function useBenchmarks(): { benchmarks: BackendBenchmarkMonth[]; status: PerformanceStatus } {
  const [benchmarks, setBenchmarks] = useState<BackendBenchmarkMonth[]>([]);
  const [status, setStatus] = useState<PerformanceStatus>('loading');

  useEffect(() => {
    let active = true;
    getBenchmarks()
      .then((result) => {
        if (!active) return;
        setBenchmarks(result);
        setStatus('ready');
      })
      .catch(() => {
        if (active) setStatus('error');
      });
    return () => {
      active = false;
    };
  }, []);

  return { benchmarks, status };
}
