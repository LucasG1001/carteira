import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PiggyBank,
  type LucideIcon,
} from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import styles from './BigNumbers.module.css';

interface BigNumberCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  accentClass: string;
  delay: number;
}

function BigNumberCard({
  label,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  accentClass,
  delay,
}: BigNumberCardProps) {
  return (
    <div
      className={`${styles.card} ${styles[accentClass]}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={styles.cardHeader}>
        <span className={styles.label}>{label}</span>
        <div className={`${styles.iconWrap} ${styles[`icon_${accentClass}`]}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className={styles.valueRow}>
        <span className={styles.value}>{value}</span>
      </div>
      <div className={styles.footer}>
        {trend && trendValue && (
          <span
            className={`${styles.trend} ${
              trend === 'up' ? styles.trendUp : trend === 'down' ? styles.trendDown : ''
            }`}
          >
            {trend === 'up' ? (
              <TrendingUp size={13} />
            ) : trend === 'down' ? (
              <TrendingDown size={13} />
            ) : null}
            {trendValue}
          </span>
        )}
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>
    </div>
  );
}

export function BigNumbers() {
  const { data } = usePortfolio();

  if (!data) return null;

  const patrimonio = data.general_current_value;
  const lucro = data.general_profitability_value;
  const rentabilidade = data.general_profitability_percent;
  const dividendosTotal = data.general_total_dividends;
  const totalAtivos = data.assets.length;

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const cards: BigNumberCardProps[] = [
    {
      label: 'Patrimônio Total',
      value: fmt(patrimonio),
      icon: Wallet,
      trend: data.general_variation_value >= 0 ? 'up' : 'down',
      trendValue: `${data.general_variation_value >= 0 ? '+' : ''}${data.general_variation_percent}% variação total`,
      subtitle: `${totalAtivos} ativos`,
      accentClass: 'indigo',
      delay: 0,
    },
    {
      label: 'Lucro / Prejuízo',
      value: fmt(lucro),
      icon: lucro >= 0 ? TrendingUp : TrendingDown,
      trend: lucro >= 0 ? 'up' : 'down',
      trendValue: `${rentabilidade >= 0 ? '+' : ''}${rentabilidade}%`,
      subtitle: 'acumulado',
      accentClass: lucro >= 0 ? 'green' : 'red',
      delay: 80,
    },
    {
      label: 'Rentabilidade',
      value: `${rentabilidade >= 0 ? '+' : ''}${rentabilidade}%`,
      icon: BarChart3,
      trend: rentabilidade >= 0 ? 'up' : 'down',
      trendValue: 'Acumulada',
      subtitle: 'sobre Total Investido',
      accentClass: 'cyan',
      delay: 160,
    },
    {
      label: 'Dividendos Recebidos',
      value: fmt(dividendosTotal),
      icon: DollarSign,
      trend: 'up',
      trendValue: 'Total acumulado',
      subtitle: 'total acumulado',
      accentClass: 'amber',
      delay: 240,
    },
    {
      label: 'Total Investido (Custo)',
      value: fmt(data.general_total_invested),
      icon: PiggyBank,
      trend: 'neutral',
      subtitle: 'Sem contar variações',
      accentClass: 'purple',
      delay: 320,
    },
  ];

  return (
    <section className={styles.section}>
      <div className={styles.grid}>
        {cards.map((card) => (
          <BigNumberCard key={card.label} {...card} />
        ))}
      </div>
    </section>
  );
}
