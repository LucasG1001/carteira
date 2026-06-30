import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { usePortfolio } from '../../context/portfolioStore';
import { usePrivacy } from '../../context/privacyStore';
import type { BackendAssetSummary } from '../../services/api';
import styles from './Charts.module.css';

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#12121a',
  border: '1px solid #2a2a40',
  borderRadius: '10px',
  padding: '10px 14px',
  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
};

const CHART_LABEL_STYLE = { fill: '#9090a8', fontSize: 11 };

const MESES_ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function monthLabel(ym: string) {
  const [year, month] = ym.split('-').map(Number);
  return `${MESES_ABREV[month - 1]}/${String(year).slice(2)}`;
}

interface PieTooltipSlice {
  name: string;
  payload: { cor: string; percentual: number; formatted: string };
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
        {data.payload.formatted}
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

interface DividendTooltipProps {
  active?: boolean;
  payload?: { payload: { mes: string; formatted: string } }[];
}

function CustomDividendTooltip({ active, payload }: DividendTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div style={CHART_TOOLTIP_STYLE}>
      <p style={{ color: '#9090a8', fontSize: '0.75rem', marginBottom: 4 }}>{point.mes}</p>
      <p style={{ color: '#10b981', fontSize: '1rem', fontWeight: 700 }}>{point.formatted}</p>
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

export function Charts() {
  const { data } = usePortfolio();
  const { formatCurrency, hidden } = usePrivacy();

  if (!data) return null;

  const formatAxis = (value: number) =>
    hidden ? '•••' : value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });

  const alocacaoTipo = calcAlocacaoTipo(data.assets, data.general_current_value).map((slice) => ({
    ...slice,
    formatted: formatCurrency(slice.valor),
  }));
  const proventos = data.monthly_dividends.map((item) => ({
    mes: monthLabel(item.month),
    valor: item.value,
    formatted: formatCurrency(item.value),
  }));

  return (
    <section className={styles.section}>
      <div className={styles.row}>
        <div className={`${styles.chartCard} ${styles.animateCard}`} style={{ animationDelay: '300ms' }}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Proventos por Mês</h3>
            <div className={styles.chartBadge}>
              <span className={styles.badgeDot} style={{ background: '#10b981' }} />
              Últimos 12 meses
            </div>
          </div>
          <div className={styles.chartBody}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={proventos} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradientProventos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" vertical={false} />
                <XAxis dataKey="mes" tick={CHART_LABEL_STYLE} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatAxis} tick={CHART_LABEL_STYLE} axisLine={false} tickLine={false} width={70} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<CustomDividendTooltip />} />
                <Bar dataKey="valor" fill="url(#gradientProventos)" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${styles.chartCard} ${styles.pieCard} ${styles.animateCard}`} style={{ animationDelay: '400ms' }}>
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
      </div>
    </section>
  );
}
