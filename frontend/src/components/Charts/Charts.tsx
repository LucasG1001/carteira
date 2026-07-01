import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { usePrivacy } from '../../context/privacyStore';
import styles from './Charts.module.css';

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#12121a',
  border: '1px solid #2a2a40',
  borderRadius: '10px',
  padding: '10px 14px',
  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
};

const CHART_LABEL_STYLE = { fill: '#9090a8', fontSize: 11 };

export interface BarDatum {
  label: string;
  value: number;
  formatted: string;
  key?: string;
}

export interface PieDatum {
  name: string;
  value: number;
  percent: number;
  color: string;
  formatted: string;
}

export interface BarChartConfig {
  title: string;
  badge?: string;
  color: string;
  data: BarDatum[];
  onBarClick?: (key: string) => void;
  activeBar?: string | null;
}

export interface PieChartConfig {
  title: string;
  data: PieDatum[];
  onSliceClick?: (name: string) => void;
  activeSlice?: string | null;
  modes?: { key: string; label: string }[];
  activeMode?: string;
  onModeChange?: (key: string) => void;
  select?: {
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
  };
}

interface PieTooltipSlice {
  name: string;
  payload: { color: string; percent: number; formatted: string };
}

function CustomPieTooltip({ active, payload }: { active?: boolean; payload?: PieTooltipSlice[] }) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div style={CHART_TOOLTIP_STYLE}>
      <p style={{ color: '#9090a8', fontSize: '0.75rem', marginBottom: 4 }}>{data.name}</p>
      <p style={{ color: data.payload.color, fontSize: '1rem', fontWeight: 700 }}>
        {data.payload.formatted}
      </p>
      <p style={{ color: '#e8e8f0', fontSize: '0.8rem' }}>{data.payload.percent.toFixed(1)}%</p>
    </div>
  );
}

function CustomBarTooltip({
  active,
  payload,
  barColor,
}: {
  active?: boolean;
  payload?: { payload: BarDatum }[];
  barColor: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div style={CHART_TOOLTIP_STYLE}>
      <p style={{ color: '#9090a8', fontSize: '0.75rem', marginBottom: 4 }}>{point.label}</p>
      <p style={{ color: barColor, fontSize: '1rem', fontWeight: 700 }}>{point.formatted}</p>
    </div>
  );
}

export function Charts({ bar, pie }: { bar: BarChartConfig; pie: PieChartConfig }) {
  const { hidden } = usePrivacy();

  const formatAxis = (value: number) =>
    hidden ? '•••' : value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });

  return (
    <section className={styles.section}>
      <div className={styles.row}>
        <div className={`${styles.chartCard} ${styles.animateCard}`} style={{ animationDelay: '300ms' }}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>{bar.title}</h3>
            {bar.badge && (
              <div className={styles.chartBadge}>
                <span className={styles.badgeDot} style={{ background: bar.color }} />
                {bar.badge}
              </div>
            )}
          </div>
          <div className={styles.chartBody}>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={bar.data} margin={{ top: 10, right: 2, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradientBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={bar.color} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={bar.color} stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" vertical={false} />
                <XAxis dataKey="label" tick={CHART_LABEL_STYLE} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatAxis} tick={CHART_LABEL_STYLE} axisLine={false} tickLine={false} width={48} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  content={<CustomBarTooltip barColor={bar.color} />}
                />
                <Bar
                  dataKey="value"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                  cursor={bar.onBarClick ? 'pointer' : 'default'}
                  onClick={(d: { payload?: BarDatum }) => {
                    if (d.payload?.key) bar.onBarClick?.(d.payload.key);
                  }}
                >
                  {bar.data.map((d, i) => (
                    <Cell
                      key={i}
                      fill="url(#gradientBar)"
                      fillOpacity={bar.activeBar && bar.activeBar !== d.key ? 0.3 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${styles.chartCard} ${styles.pieCard} ${styles.animateCard}`} style={{ animationDelay: '400ms' }}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>{pie.title}</h3>
            {pie.modes && pie.onModeChange && (
              <div className={styles.modeToggle}>
                {pie.modes.map((mode) => (
                  <button
                    key={mode.key}
                    type="button"
                    className={`${styles.modeButton} ${pie.activeMode === mode.key ? styles.modeButtonActive : ''}`}
                    onClick={() => pie.onModeChange?.(mode.key)}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            )}
            {pie.select && (
              <select
                className={styles.pieSelect}
                value={pie.select.value}
                onChange={(event) => pie.select?.onChange(event.target.value)}
              >
                {pie.select.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className={`${styles.chartBody} ${styles.pieBody}`}>
            <div className={styles.pieChart}>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={pie.data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    strokeWidth={0}
                  >
                    {pie.data.map((entry, i) => {
                      const dimmed = pie.activeSlice != null && pie.activeSlice !== entry.name;
                      return (
                        <Cell
                          key={i}
                          fill={entry.color}
                          fillOpacity={dimmed ? 0.3 : 1}
                          cursor={pie.onSliceClick ? 'pointer' : 'default'}
                          onClick={pie.onSliceClick ? () => pie.onSliceClick?.(entry.name) : undefined}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.pieLegend}>
              {pie.data.map((entry) => {
                const dimmed = pie.activeSlice != null && pie.activeSlice !== entry.name;
                return (
                  <div
                    key={entry.name}
                    className={`${styles.pieLegendRow} ${pie.onSliceClick ? styles.pieLegendClickable : ''}`}
                    style={{ opacity: dimmed ? 0.4 : 1 }}
                    onClick={pie.onSliceClick ? () => pie.onSliceClick?.(entry.name) : undefined}
                  >
                    <span className={styles.pieLegendLeft}>
                      <span className={styles.legendDot} style={{ backgroundColor: entry.color }} />
                      <span className={styles.pieLegendLabel}>{entry.name}</span>
                    </span>
                    <span className={styles.pieLegendValues}>
                      <span className={styles.pieLegendValue}>{entry.formatted}</span>
                      <span className={styles.pieLegendPct}>{entry.percent.toFixed(1)}%</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
