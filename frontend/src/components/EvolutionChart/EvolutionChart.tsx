import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { usePrivacy } from "../../context/privacyStore";
import { monthLabel } from "../../utils/date";
import styles from "../Charts/Charts.module.css";

const LABEL_STYLE = { fill: "#9090a8", fontSize: 11 };
const TOOLTIP_STYLE = {
  backgroundColor: "#12121a",
  border: "1px solid #2a2a40",
  borderRadius: "10px",
  padding: "10px 14px",
  boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
};

export interface EvolutionPoint {
  month: string;
  invested: number;
}

function EvolutionTooltip({
  active,
  payload,
  fmt,
}: {
  active?: boolean;
  payload?: { payload: EvolutionPoint }[];
  fmt: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div style={TOOLTIP_STYLE}>
      <p style={{ color: "#9090a8", fontSize: "0.75rem", marginBottom: 4 }}>{monthLabel(point.month)}</p>
      <p style={{ color: "#8b5cf6", fontSize: "1rem", fontWeight: 700 }}>{fmt(point.invested)}</p>
    </div>
  );
}

export function EvolutionChart({ data }: { data: EvolutionPoint[] }) {
  const { hidden, formatCurrency: fmt } = usePrivacy();
  const formatAxis = (value: number) =>
    hidden ? "•••" : value.toLocaleString("pt-BR", { maximumFractionDigits: 0, notation: "compact" });

  return (
    <section className={styles.section}>
      <div className={`${styles.chartCard} ${styles.animateCard}`} style={{ animationDelay: "200ms" }}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>Evolução do Patrimônio</h3>
          <div className={styles.chartBadge}>
            <span className={styles.badgeDot} style={{ background: "#8b5cf6" }} />
            Aporte acumulado
          </div>
        </div>
        <div className={styles.chartBody}>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientEvolution" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" vertical={false} />
              <XAxis dataKey="month" tickFormatter={monthLabel} tick={LABEL_STYLE} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatAxis} tick={LABEL_STYLE} axisLine={false} tickLine={false} width={52} />
              <Tooltip content={<EvolutionTooltip fmt={fmt} />} />
              <Area type="monotone" dataKey="invested" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradientEvolution)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
