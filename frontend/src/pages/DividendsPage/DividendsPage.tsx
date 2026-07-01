import { useEffect, useMemo, useState } from "react";
import { BigNumbers } from "../../components/BigNumbers/BigNumbers";
import type { BigNumberCardProps } from "../../components/BigNumbers/BigNumbers";
import { Charts } from "../../components/Charts/Charts";
import type { BarChartConfig, PieChartConfig } from "../../components/Charts/Charts";
import { MonthYearPicker } from "../../components/MonthYearPicker/MonthYearPicker";
import { useDragScroll } from "../../hooks/useDragScroll";
import { usePrivacy } from "../../context/privacyStore";
import { getDividends } from "../../services/api";
import type { BackendDividend } from "../../services/api";
import { monthLabel } from "../../utils/date";
import tableStyles from "../../components/AssetsTable/AssetsTable.module.css";
import styles from "./DividendsPage.module.css";

const PALETTE = [
  "#22d3ee", "#6366f1", "#f59e0b", "#10b981", "#ec4899", "#f97316",
  "#8b5cf6", "#ef4444", "#14b8a6", "#a3e635", "#f472b6", "#38bdf8",
];

function lastMonths(count: number): string[] {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;
  const months: string[] = [];
  for (let i = 0; i < count; i += 1) {
    months.push(`${year}-${String(month).padStart(2, "0")}`);
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }
  return months.reverse();
}

function formatDate(value: string) {
  return value.split("-").reverse().join("/");
}

export function DividendsPage() {
  const { formatCurrency: fmt } = usePrivacy();
  const scrollRef = useDragScroll<HTMLDivElement>();
  const [data, setData] = useState<BackendDividend[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    getDividends()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err : new Error("Erro"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const view = useMemo(() => {
    const entries = data ?? [];
    const months = lastMonths(12);
    const monthSet = new Set(months);
    const byMonth: Record<string, number> = {};
    const byAsset: Record<string, number> = {};
    let total12m = 0;
    let totalAll = 0;
    for (const entry of entries) {
      totalAll += entry.value;
      const monthKey = entry.date.slice(0, 7);
      if (monthSet.has(monthKey)) {
        byMonth[monthKey] = (byMonth[monthKey] || 0) + entry.value;
        byAsset[entry.ticker] = (byAsset[entry.ticker] || 0) + entry.value;
        total12m += entry.value;
      }
    }
    const barData = months.map((month) => ({ month, value: byMonth[month] || 0 }));
    const activeMonths = barData.filter((point) => point.value > 0).length;
    const assets = Object.entries(byAsset)
      .map(([ticker, value]) => ({ ticker, value }))
      .sort((a, b) => b.value - a.value);
    return {
      barData,
      assets,
      total12m,
      totalAll,
      media: activeMonths ? total12m / activeMonths : 0,
    };
  }, [data]);

  if (loading) {
    return <div className={styles.state}>Carregando proventos...</div>;
  }

  if (error) {
    return <div className={`${styles.state} ${styles.error}`}>Erro ao carregar dados: {error.message}</div>;
  }

  if (!data || data.length === 0) {
    return <div className={styles.state}>Nenhum provento recebido ainda.</div>;
  }

  const cards: BigNumberCardProps[] = [
    { label: "Média mensal (12m)", value: fmt(view.media), details: [], accentClass: "indigo", delay: 80 },
    { label: "Recebido (12 meses)", value: fmt(view.total12m), details: [], accentClass: "green", delay: 160 },
    { label: "Total recebido", value: fmt(view.totalAll), details: [], accentClass: "amber", delay: 240 },
  ];

  const bar: BarChartConfig = {
    title: "Proventos por Mês",
    badge: "Últimos 12 meses",
    color: "#10b981",
    data: view.barData.map((point) => ({
      label: monthLabel(point.month),
      value: point.value,
      formatted: fmt(point.value),
      key: point.month,
    })),
  };

  const totalPie = view.assets.reduce((sum, item) => sum + item.value, 0);
  const pie: PieChartConfig = {
    title: "Por Ativo (12m)",
    data: view.assets.map((item, index) => ({
      name: item.ticker,
      value: item.value,
      percent: totalPie > 0 ? (item.value / totalPie) * 100 : 0,
      color: PALETTE[index % PALETTE.length],
      formatted: fmt(item.value),
    })),
  };

  const scopePrefix = pickerMonth ? `${pickerYear}-${String(pickerMonth).padStart(2, "0")}` : String(pickerYear);
  const tableEntries = data.filter((entry) => entry.date.startsWith(scopePrefix));
  const tableTotal = tableEntries.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div className={styles.container}>
      <BigNumbers cards={cards} compact />
      <Charts bar={bar} pie={pie} />

      <div className={styles.tableToolbar}>
        <MonthYearPicker
          year={pickerYear}
          month={pickerMonth}
          onChange={(year, month) => {
            setPickerYear(year);
            setPickerMonth(month);
          }}
        />
      </div>

      <section className={tableStyles.section}>
        <div className={tableStyles.card}>
          <div className={tableStyles.cardHeader}>
            <div className={tableStyles.titleRow}>
              <h3 className={tableStyles.title}>Detalhamento de proventos</h3>
              <span className={tableStyles.count}>{tableEntries.length}</span>
              <span className={tableStyles.saldoNeutral}>{fmt(tableTotal)}</span>
            </div>
          </div>

          <div className={tableStyles.tableWrapper} ref={scrollRef}>
            <table className={`${tableStyles.table} ${tableStyles.compact}`}>
              <thead>
                <tr>
                  <th>
                    <span className={tableStyles.thContent}>Data</span>
                  </th>
                  <th>
                    <span className={tableStyles.thContent}>Ativo</span>
                  </th>
                  <th>
                    <span className={tableStyles.thContent}>Tipo</span>
                  </th>
                  <th>
                    <span className={tableStyles.thContent}>Valor</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableEntries.map((entry, index) => (
                  <tr
                    key={`${entry.ticker}-${entry.date}-${index}`}
                    className={tableStyles.row}
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    <td className={tableStyles.numCell}>{formatDate(entry.date)}</td>
                    <td>
                      <span className={tableStyles.bold}>{entry.ticker}</span>
                    </td>
                    <td>{entry.type}</td>
                    <td className={tableStyles.numCell}>
                      <span className={tableStyles.positive}>{fmt(entry.value)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {tableEntries.length === 0 && (
            <div className={tableStyles.empty}>
              <p>Nenhum provento no período</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
