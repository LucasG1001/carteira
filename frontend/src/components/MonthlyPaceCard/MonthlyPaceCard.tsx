import { usePrivacy } from '../../context/privacyStore';
import type { PacePoint } from '../../utils/expenseView';
import styles from './MonthlyPaceCard.module.css';

const BAR_AREA = 150;

interface MonthlyPaceCardProps {
  points: PacePoint[];
  meta: number;
  onPick?: (key: string) => void;
}

function shortValue(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(Math.round(value));
}

export function MonthlyPaceCard({ points, meta, onPick }: MonthlyPaceCardProps) {
  const { hidden } = usePrivacy();
  const ceiling = Math.max(meta, ...points.map((point) => point.total)) || 1;

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <span className={styles.kicker}>Ritmo mês a mês</span>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.swatchDone} /> realizado
          </span>
          <span className={styles.legendItem}>
            <span className={styles.swatchFuture} /> travado
          </span>
        </div>
      </div>

      <div
        className={`${styles.chart} ${points.length > 7 ? styles.dense : ''}`}
        style={{ gridTemplateColumns: `repeat(${points.length}, 1fr)` }}
      >
        {meta > 0 && (
          <div
            className={styles.metaLine}
            style={{ bottom: `${(meta / ceiling) * BAR_AREA + 22}px` }}
          />
        )}

        {points.map((point) => (
          <button
            key={point.key}
            type="button"
            className={styles.column}
            onClick={() => onPick?.(point.key)}
            disabled={!onPick}
          >
            <span className={styles.value}>
              {point.total > 0 ? (hidden ? '•••' : shortValue(point.total)) : ''}
            </span>
            <span
              className={`${styles.bar} ${point.isFuture ? styles.barFuture : styles.barDone} ${
                point.isSelected ? styles.barSelected : ''
              }`}
              style={{ height: `${Math.max(2, (point.total / ceiling) * BAR_AREA)}px` }}
            />
            <span className={styles.month}>{point.label}</span>
          </button>
        ))}
      </div>

      {meta > 0 && (
        <span className={styles.footer}>
          linha tracejada = meta de {meta.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })}
          /mês
        </span>
      )}
    </section>
  );
}
