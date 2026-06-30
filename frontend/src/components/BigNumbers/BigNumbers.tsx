import styles from './BigNumbers.module.css';

export interface CardDetail {
  label: string;
  value: string;
}

export interface BigNumberCardProps {
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

export function BigNumbers({ cards }: { cards: BigNumberCardProps[] }) {
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
