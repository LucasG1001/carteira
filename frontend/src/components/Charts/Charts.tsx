import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { usePortfolio } from '../../context/PortfolioContext';
import type { BackendAssetSummary } from '../../services/api';
import styles from './Charts.module.css';

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#1a1f2e',
  border: '1px solid #2a3042',
  borderRadius: '10px',
  padding: '10px 14px',
  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
};

function CustomPieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div style={CHART_TOOLTIP_STYLE}>
      <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: 4 }}>
        {data.name}
      </p>
      <p style={{ color: data.payload.cor, fontSize: '1rem', fontWeight: 700 }}>
        {data.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </p>
      <p style={{ color: '#f1f5f9', fontSize: '0.8rem' }}>
        {data.payload.percentual.toFixed(1)}%
      </p>
    </div>
  );
}

function renderCustomLegend(props: any) {
  const { payload } = props;
  return (
    <div className={styles.legendContainer}>
      {payload.map((entry: any, index: number) => (
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
    'Ação': '#6366f1',
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
  
  if (!data) return null;

  const alocacaoTipo = calcAlocacaoTipo(data.assets, data.general_current_value);

  return (
    <section className={styles.section}>
      <div className={styles.row}>

        <div className={`${styles.chartCard} ${styles.pieCard} ${styles.animateCard}`} style={{ animationDelay: '300ms', flex: '1' }}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Alocação por Tipo</h3>
          </div>
          <div className={styles.chartBody} style={{ display: 'flex', justifyContent: 'center' }}>
            <ResponsiveContainer width="70%" height={300}>
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
                  stroke="#0a0e17"
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

        {/* <div className={`${styles.chartCard} ${styles.animateCard}`} style={{ animationDelay: '200ms' }}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Dividendos Mensais</h3>
            <div className={styles.chartBadge}>
              <span className={styles.badgeDot} style={{ background: '#22d3ee' }} />
              Recebidos
            </div>
          </div>
          <div className={styles.chartBody}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dividendosMensais} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradientDividendos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" vertical={false} />
                <XAxis dataKey="mes" tick={CHART_LABEL_STYLE} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={formatCurrency}
                  tick={CHART_LABEL_STYLE}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                <Tooltip content={<CustomTooltipDividendos />} />
                <Bar
                  dataKey="valor"
                  fill="url(#gradientDividendos)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div> */}
      </div>

      {/* Row 2: Alocação por Tipo + Setor */}
      <div className={styles.row}>


        {/* <div className={`${styles.chartCard} ${styles.pieCard} ${styles.animateCard}`} style={{ animationDelay: '400ms' }}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Alocação por Setor</h3>
          </div>
          <div className={styles.chartBody}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={alocacaoSetor}
                  dataKey="valor"
                  nameKey="setor"
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={100}
                  strokeWidth={2}
                  stroke="#0a0e17"
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
        </div> */}
      </div>
    </section>
  );
}
