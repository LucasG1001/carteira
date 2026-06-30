import { usePortfolio } from '../../context/portfolioStore';
import { usePrivacy } from '../../context/privacyStore';
import styles from './BigNumbers.module.css';

interface CardDetail {
  label: string;
  value: string;
}

interface BigNumberCardProps {
  label: string;
  value: string;
  side?: { text: string; tone: 'up' | 'down' };
  details: CardDetail[];
  accentClass: string;
  delay: number;
}

function BigNumberCard({ label, value, side, details, accentClass, delay }: BigNumberCardProps) {
  return (
    <div
      className={`${styles.card} ${styles[accentClass]}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className={styles.label}>{label}</span>
      <div className={styles.valueRow}>
        <span className={styles.value}>{value}</span>
        {side && (
          <span className={`${styles.side} ${side.tone === 'up' ? styles.up : styles.down}`}>
            {side.text}
          </span>
        )}
      </div>
      <div className={`${styles.details} ${details.length > 1 ? styles.detailsTwo : ''}`}>
        {details.map((detail) => (
          <div key={detail.label} className={styles.detail}>
            <span className={styles.detailLabel}>{detail.label}</span>
            <span className={styles.detailValue}>{detail.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BigNumbers() {
  const { data } = usePortfolio();
  const { formatCurrency: fmt } = usePrivacy();

  if (!data) return null;

  const mesesComProventos = data.monthly_dividends.filter((m) => m.value > 0);
  const mediaProventos = mesesComProventos.length
    ? mesesComProventos.reduce((sum, m) => sum + m.value, 0) / mesesComProventos.length
    : 0;

  const variacao = data.general_variation_percent;
  const lucro = data.general_profitability_value;

  const cards: BigNumberCardProps[] = [
    {
      label: 'Patrimônio Total',
      value: fmt(data.general_current_value),
      side: {
        text: `${variacao >= 0 ? '+' : ''}${variacao}%`,
        tone: variacao >= 0 ? 'up' : 'down',
      },
      details: [{ label: 'Valor Investido', value: fmt(data.general_total_invested) }],
      accentClass: 'indigo',
      delay: 0,
    },
    {
      label: 'Lucro Total',
      value: fmt(lucro),
      details: [
        { label: 'Ganho de Capital', value: fmt(data.general_variation_value) },
        { label: 'Dividendos Recebidos', value: fmt(data.general_total_dividends) },
      ],
      accentClass: lucro >= 0 ? 'green' : 'red',
      delay: 80,
    },
    {
      label: 'Proventos Recebidos',
      value: fmt(mediaProventos),
      details: [{ label: 'Total', value: fmt(data.general_total_dividends) }],
      accentClass: 'amber',
      delay: 160,
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
