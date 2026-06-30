import { Eye, EyeOff } from "lucide-react";
import { PortfolioActions } from "../../components/PortfolioActions/PortfolioActions";
import { BigNumbers } from "../../components/BigNumbers/BigNumbers";
import type { BigNumberCardProps } from "../../components/BigNumbers/BigNumbers";
import { Charts } from "../../components/Charts/Charts";
import type { BarChartConfig, PieChartConfig } from "../../components/Charts/Charts";
import { AssetsTable } from "../../components/AssetsTable/AssetsTable";
import { PortfolioProvider } from "../../context/PortfolioContext";
import { usePortfolio } from "../../context/portfolioStore";
import { usePrivacy } from "../../context/privacyStore";
import type { BackendAssetSummary } from "../../services/api";
import { monthLabel } from "../../utils/date";
import styles from "./InvestmentsPage.module.css";

const TIPO_CORES: Record<string, string> = {
  Acao: "#6366f1",
  FII: "#22d3ee",
  ETF: "#f59e0b",
  Cripto: "#f97316",
  "Renda Fixa": "#10b981",
};

function alocacaoPorTipo(assets: BackendAssetSummary[], total: number) {
  const mapa: Record<string, number> = {};
  assets.forEach((ativo) => {
    mapa[ativo.asset_type] = (mapa[ativo.asset_type] || 0) + ativo.current_value;
  });
  return Object.entries(mapa)
    .map(([tipo, valor]) => ({
      tipo,
      valor,
      percentual: total > 0 ? (valor / total) * 100 : 0,
      cor: TIPO_CORES[tipo] || "#94a3b8",
    }))
    .sort((a, b) => b.valor - a.valor);
}

function PortfolioDashboard() {
  const { data, loading, error } = usePortfolio();
  const { formatCurrency: fmt } = usePrivacy();

  if (loading) {
    return <div className={styles.state}>Carregando dados da carteira...</div>;
  }

  if (error) {
    return (
      <div className={`${styles.state} ${styles.error}`}>
        Erro ao carregar dados: {error.message}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const mesesComProventos = data.monthly_dividends.filter((m) => m.value > 0);
  const mediaProventos = mesesComProventos.length
    ? mesesComProventos.reduce((sum, m) => sum + m.value, 0) / mesesComProventos.length
    : 0;
  const variacao = data.general_variation_percent;
  const lucro = data.general_profitability_value;

  const cards: BigNumberCardProps[] = [
    {
      label: "Patrimônio Total",
      value: fmt(data.general_current_value),
      side: { text: `${variacao >= 0 ? "+" : ""}${variacao}%`, tone: variacao >= 0 ? "up" : "down" },
      details: [{ label: "Valor Investido", value: fmt(data.general_total_invested) }],
      accentClass: "indigo",
      delay: 0,
    },
    {
      label: "Lucro Total",
      value: fmt(lucro),
      details: [
        { label: "Ganho de Capital", value: fmt(data.general_variation_value) },
        { label: "Dividendos Recebidos", value: fmt(data.general_total_dividends) },
      ],
      accentClass: lucro >= 0 ? "green" : "red",
      delay: 80,
    },
    {
      label: "Proventos Recebidos",
      value: fmt(mediaProventos),
      details: [{ label: "Total", value: fmt(data.general_total_dividends) }],
      accentClass: "amber",
      delay: 160,
    },
  ];

  const bar: BarChartConfig = {
    title: "Proventos por Mês",
    badge: "Últimos 12 meses",
    color: "#10b981",
    data: data.monthly_dividends.map((m) => ({
      label: monthLabel(m.month),
      value: m.value,
      formatted: fmt(m.value),
    })),
  };

  const pie: PieChartConfig = {
    title: "Alocação por Tipo",
    data: alocacaoPorTipo(data.assets, data.general_current_value).map((slice) => ({
      name: slice.tipo,
      value: slice.valor,
      percent: slice.percentual,
      color: slice.cor,
      formatted: fmt(slice.valor),
    })),
  };

  return (
    <div className={styles.container}>
      <BigNumbers cards={cards} />
      <Charts bar={bar} pie={pie} />
      <AssetsTable />
    </div>
  );
}

export function InvestmentsPage() {
  const { hidden, toggle } = usePrivacy();

  return (
    <PortfolioProvider>
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
        <PortfolioActions />
      </div>
      <PortfolioDashboard />
    </PortfolioProvider>
  );
}
