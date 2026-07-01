import type { ReactNode } from 'react';
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

function BigNumberCard({ label, value, side, details, accentClass, delay, compact }: BigNumberCardProps & { compact?: boolean }) {
  return (
    <div
      className={`${styles.card} ${styles[accentClass]} ${compact ? styles.compact : ''}`}
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
      {details.length > 0 && (
        <div className={`${styles.details} ${details.length > 1 ? styles.detailsTwo : ''}`}>
          {details.map((detail) => (
            <div key={detail.label} className={styles.detail}>
              <span className={styles.detailLabel}>{detail.label}</span>
              <span className={styles.detailValue}>{detail.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BigNumbers({ cards, prepend, compact }: { cards: BigNumberCardProps[]; prepend?: ReactNode; compact?: boolean }) {
  return (
    <section className={styles.section}>
      <div className={styles.grid}>
        {prepend}
        {cards.map((card) => (
          <BigNumberCard key={card.label} {...card} compact={compact} />
        ))}
      </div>
    </section>
  );
}
