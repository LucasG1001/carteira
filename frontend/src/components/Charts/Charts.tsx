import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { usePortfolio } from '../../context/portfolioStore';
import type { BackendAssetSummary } from '../../services/api';
import styles from './Charts.module.css';

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#12121a',
  border: '1px solid #2a2a40',
  borderRadius: '10px',
  padding: '10px 14px',
  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
};

interface PieTooltipSlice {
  name: string;
  value: number;
  payload: { cor: string; percentual: number };
}

interface PieTooltipProps {
  active?: boolean;
  payload?: PieTooltipSlice[];
}

function CustomPieTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div style={CHART_TOOLTIP_STYLE}>
      <p style={{ color: '#9090a8', fontSize: '0.75rem', marginBottom: 4 }}>
        {data.name}
      </p>
      <p style={{ color: data.payload.cor, fontSize: '1rem', fontWeight: 700 }}>
        {data.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </p>
      <p style={{ color: '#e8e8f0', fontSize: '0.8rem' }}>
        {data.payload.percentual.toFixed(1)}%
      </p>
    </div>
  );
}

interface LegendEntry {
  color?: string;
  value?: string;
}

interface LegendContentProps {
  payload?: readonly LegendEntry[];
}

function renderCustomLegend({ payload }: LegendContentProps) {
  if (!payload) return null;
  return (
    <div className={styles.legendContainer}>
      {payload.map((entry, index) => (
        <div key={index} className={styles.legendItem}>
          <span
            className={styles.legendDot}
            style={{ backgroundColor: entry.color }}
          />
          <span className={styles.legendLabel}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function calcAlocacaoTipo(assets: BackendAssetSummary[], total: number) {
  const cores: Record<string, string> = {
    Acao: '#6366f1',
    'FII': '#22d3ee',
    'ETF': '#f59e0b',
    'Cripto': '#f97316',
    'Renda Fixa': '#10b981',
  };

  const mapa: Record<string, number> = {};

  assets.forEach((ativo) => {
    mapa[ativo.asset_type] = (mapa[ativo.asset_type] || 0) + ativo.current_value;
  });

  return Object.entries(mapa).map(([tipo, valor]) => ({
    tipo,
    valor,
    percentual: total > 0 ? (valor / total) * 100 : 0,
    cor: cores[tipo] || '#94a3b8',
  })).sort((a, b) => b.valor - a.valor);
}

const SETOR_PALETTE = [
  '#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f97316',
  '#ec4899', '#8b5cf6', '#3b82f6', '#a78bfa', '#14b8a6',
];

function setorLabel(asset: BackendAssetSummary) {
  if (asset.sector) return asset.sector;
  const fallback: Record<string, string> = {
    FII: 'Fundos Imobiliários',
    ETF: 'ETFs',
    'Renda Fixa': 'Renda Fixa',
    Cripto: 'Cripto',
  };
  return fallback[asset.asset_type] || 'Outros';
}

function calcAlocacaoSetor(assets: BackendAssetSummary[], total: number) {
  const mapa: Record<string, number> = {};

  assets.forEach((ativo) => {
    const setor = setorLabel(ativo);
    mapa[setor] = (mapa[setor] || 0) + ativo.current_value;
  });

  return Object.entries(mapa)
    .map(([tipo, valor]) => ({
      tipo,
      valor,
      percentual: total > 0 ? (valor / total) * 100 : 0,
    }))
    .sort((a, b) => b.valor - a.valor)
    .map((item, index) => ({ ...item, cor: SETOR_PALETTE[index % SETOR_PALETTE.length] }));
}

export function Charts() {
  const { data } = usePortfolio();

  if (!data) return null;

  const alocacaoTipo = calcAlocacaoTipo(data.assets, data.general_current_value);
  const alocacaoSetor = calcAlocacaoSetor(data.assets, data.general_current_value);

  return (
    <section className={styles.section}>
      <div className={styles.row} style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className={`${styles.chartCard} ${styles.pieCard} ${styles.animateCard}`} style={{ animationDelay: '300ms' }}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Alocação por Tipo</h3>
          </div>
          <div className={styles.chartBody} style={{ display: 'flex', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={alocacaoTipo}
                  dataKey="valor"
                  nameKey="tipo"
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={100}
                  strokeWidth={2}
                  stroke="#0a0a0f"
                >
                  {alocacaoTipo.map((entry, i) => (
                    <Cell key={i} fill={entry.cor} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend content={renderCustomLegend} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${styles.chartCard} ${styles.pieCard} ${styles.animateCard}`} style={{ animationDelay: '400ms' }}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Alocação por Setor</h3>
          </div>
          <div className={styles.chartBody} style={{ display: 'flex', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={alocacaoSetor}
                  dataKey="valor"
                  nameKey="tipo"
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={100}
                  strokeWidth={2}
                  stroke="#0a0a0f"
                >
                  {alocacaoSetor.map((entry, i) => (
                    <Cell key={i} fill={entry.cor} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend content={renderCustomLegend} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
