import { useEffect, useMemo, useState } from "react";
import { BigNumbers } from "../../components/BigNumbers/BigNumbers";
import type { BigNumberCardProps } from "../../components/BigNumbers/BigNumbers";
import { Charts } from "../../components/Charts/Charts";
import type { BarChartConfig, PieChartConfig } from "../../components/Charts/Charts";
import { AssetsTable } from "../../components/AssetsTable/AssetsTable";
import { usePortfolio } from "../../context/portfolioStore";
import { usePrivacy } from "../../context/privacyStore";
import { getEvolution } from "../../services/api";
import type { BackendAssetSummary, BackendEvolutionPoint } from "../../services/api";
import { monthLabel } from "../../utils/date";
import { ASSET_TYPE_COLORS, CHART_FALLBACK_COLOR, CHART_PALETTE } from "../../utils/chartColors";
import styles from "./InvestmentsPage.module.css";

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
      cor: ASSET_TYPE_COLORS[tipo] || CHART_FALLBACK_COLOR,
    }))
    .sort((a, b) => b.valor - a.valor);
}

export function InvestmentsPage() {
  const { data, loading, error } = usePortfolio();
  const { formatCurrency: fmt } = usePrivacy();
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [evolution, setEvolution] = useState<BackendEvolutionPoint[]>([]);

  useEffect(() => {
    let active = true;
    getEvolution()
      .then((result) => {
        if (active) setEvolution(result);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const porTipo = useMemo(
    () => (data ? alocacaoPorTipo(data.assets, data.general_current_value) : []),
    [data],
  );

  const pieData = useMemo(() => {
    if (!data) return [];
    if (!tipoFiltro) {
      return porTipo.map((slice) => ({
        name: slice.tipo,
        value: slice.valor,
        percent: slice.percentual,
        color: slice.cor,
        formatted: fmt(slice.valor),
      }));
    }
    const ativosDoTipo = data.assets.filter((asset) => asset.asset_type === tipoFiltro);
    const totalTipo = ativosDoTipo.reduce((sum, asset) => sum + asset.current_value, 0);
    return ativosDoTipo
      .slice()
      .sort((a, b) => b.current_value - a.current_value)
      .map((asset, index) => ({
        name: asset.ticker,
        value: asset.current_value,
        percent: totalTipo > 0 ? (asset.current_value / totalTipo) * 100 : 0,
        color: CHART_PALETTE[index % CHART_PALETTE.length],
        formatted: fmt(asset.current_value),
      }));
  }, [data, tipoFiltro, porTipo, fmt]);

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
      label: "Proventos Recebidos Média (12M)",
      value: fmt(mediaProventos),
      details: [{ label: "Total", value: fmt(data.general_total_dividends) }],
      accentClass: "amber",
      delay: 160,
    },
  ];

  const bar: BarChartConfig = {
    title: "Evolução do Patrimônio",
    badge: "Aporte acumulado",
    color: "#8b5cf6",
    data: evolution.map((point) => ({
      label: monthLabel(point.month),
      value: point.invested,
      formatted: fmt(point.invested),
      key: point.month,
    })),
  };

  const pie: PieChartConfig = {
    title: tipoFiltro ? `Ativos — ${tipoFiltro}` : "Alocação por Tipo",
    data: pieData,
    select: {
      value: tipoFiltro,
      options: [{ value: "", label: "Por tipo" }, ...porTipo.map((slice) => ({ value: slice.tipo, label: slice.tipo }))],
      onChange: setTipoFiltro,
    },
  };

  return (
    <div className={styles.container}>
      <BigNumbers cards={cards} />
      <Charts bar={bar} pie={pie} />
      <AssetsTable />
    </div>
  );
}
