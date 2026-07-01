import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { SectionTabs } from "../../components/SectionTabs/SectionTabs";
import { BigNumbers } from "../../components/BigNumbers/BigNumbers";
import type { BigNumberCardProps } from "../../components/BigNumbers/BigNumbers";
import { Charts } from "../../components/Charts/Charts";
import type { BarChartConfig, PieChartConfig } from "../../components/Charts/Charts";
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

function DividendsContent() {
  const { hidden, toggle, formatCurrency: fmt } = usePrivacy();
  const scrollRef = useDragScroll<HTMLDivElement>();
  const [data, setData] = useState<BackendDividend[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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
      activeMonths,
      topAsset: assets[0] ?? null,
    };
  }, [data]);

  const header = (
    <div className={styles.toolbar}>
      <button
        type="button"
        className={styles.eyeButton}
        onClick={toggle}
        title={hidden ? "Mostrar valores" : "Ocultar valores"}
      >
        {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
        <span className={styles.eyeLabel}>{hidden ? "Mostrar valores" : "Ocultar valores"}</span>
      </button>
    </div>
  );

  if (loading) {
    return (
      <>
        {header}
        <div className={styles.state}>Carregando proventos...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        {header}
        <div className={`${styles.state} ${styles.error}`}>Erro ao carregar dados: {error.message}</div>
      </>
    );
  }

  if (!data || data.length === 0) {
    return (
      <>
        {header}
        <div className={styles.state}>Nenhum provento recebido ainda.</div>
      </>
    );
  }

  const cards: BigNumberCardProps[] = [
    {
      label: "Recebido (12 meses)",
      value: fmt(view.total12m),
      details: [{ label: "Todo o período", value: fmt(view.totalAll) }],
      accentClass: "green",
      delay: 80,
    },
    {
      label: "Média mensal (12m)",
      value: fmt(view.media),
      details: [{ label: "Meses com proventos", value: String(view.activeMonths) }],
      accentClass: "indigo",
      delay: 160,
    },
    {
      label: "Maior pagador (12m)",
      value: view.topAsset ? view.topAsset.ticker : "—",
      details: [{ label: "Recebido", value: view.topAsset ? fmt(view.topAsset.value) : "—" }],
      accentClass: "amber",
      delay: 240,
    },
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

  return (
    <>
      {header}
      <div className={styles.container}>
        <BigNumbers cards={cards} />
        <Charts bar={bar} pie={pie} />

        <section className={tableStyles.section}>
          <div className={tableStyles.card}>
            <div className={tableStyles.cardHeader}>
              <div className={tableStyles.titleRow}>
                <h3 className={tableStyles.title}>Agenda de proventos</h3>
                <span className={tableStyles.count}>{data.length}</span>
                <span className={tableStyles.saldoNeutral}>{fmt(view.totalAll)}</span>
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
                  {data.map((entry, index) => (
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
          </div>
        </section>
      </div>
    </>
  );
}

export function DividendsPage() {
  return (
    <>
      <SectionTabs
        tabs={[
          { to: "/investimentos", label: "Carteira", end: true },
          { to: "/investimentos/proventos", label: "Proventos" },
        ]}
      />
      <DividendsContent />
    </>
  );
}
