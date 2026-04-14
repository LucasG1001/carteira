import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PiggyBank,
  type LucideIcon,
} from 'lucide-react';
import {
  calcularPatrimonioTotal,
  calcularLucroTotal,
  calcularRentabilidade,
  calcularDividendosTotais,
  calcularDividendoMedio,
  ativos,
} from '../../data/mockData';
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
  const patrimonio = calcularPatrimonioTotal();
  const lucro = calcularLucroTotal();
  const rentabilidade = calcularRentabilidade();
  const dividendosTotal = calcularDividendosTotais();
  const dividendoMedio = calcularDividendoMedio();
  const totalAtivos = ativos.length;

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const cards: BigNumberCardProps[] = [
    {
      label: 'Patrimônio Total',
      value: fmt(patrimonio),
      icon: Wallet,
      trend: 'up',
      trendValue: '+3.2% este mês',
      subtitle: `${totalAtivos} ativos`,
      accentClass: 'indigo',
      delay: 0,
    },
    {
      label: 'Lucro / Prejuízo',
      value: fmt(lucro),
      icon: lucro >= 0 ? TrendingUp : TrendingDown,
      trend: lucro >= 0 ? 'up' : 'down',
      trendValue: `${rentabilidade >= 0 ? '+' : ''}${rentabilidade.toFixed(2)}%`,
      subtitle: 'desde o início',
      accentClass: lucro >= 0 ? 'green' : 'red',
      delay: 80,
    },
    {
      label: 'Rentabilidade',
      value: `${rentabilidade >= 0 ? '+' : ''}${rentabilidade.toFixed(2)}%`,
      icon: BarChart3,
      trend: rentabilidade >= 0 ? 'up' : 'down',
      trendValue: 'Acumulada',
      subtitle: 'vs. CDI: +8.4%',
      accentClass: 'cyan',
      delay: 160,
    },
    {
      label: 'Dividendos Recebidos',
      value: fmt(dividendosTotal),
      icon: DollarSign,
      trend: 'up',
      trendValue: fmt(dividendoMedio) + '/mês',
      subtitle: 'últimos 16 meses',
      accentClass: 'amber',
      delay: 240,
    },
    {
      label: 'Dividendo Médio/Mês',
      value: fmt(dividendoMedio),
      icon: PiggyBank,
      trend: 'up',
      trendValue: '+12.5% vs. ano anterior',
      subtitle: 'yield on cost',
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
