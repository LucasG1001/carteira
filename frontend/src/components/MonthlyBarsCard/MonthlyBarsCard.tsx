import type { ReactNode } from 'react';
import { usePrivacy } from '../../context/privacyStore';
import styles from './MonthlyBarsCard.module.css';

const BAR_AREA = 150;

export type BarTone = 'accent' | 'neutral' | 'warn';

export interface MonthPoint {
  key: string;
  label: string;
  value: number;
  tone?: BarTone;
  selected?: boolean;
}

interface MonthlyBarsCardProps {
  kicker: string;
  points: MonthPoint[];
  reference?: { value: number; label: string };
  legend?: { tone: BarTone; label: string }[];
  filter?: ReactNode;
  onPick?: (key: string) => void;
}

const TONE_BAR: Record<BarTone, string> = {
  accent: styles.barAccent,
  neutral: styles.barNeutral,
  warn: styles.barWarn,
};

const TONE_SWATCH: Record<BarTone, string> = {
  accent: styles.swatchAccent,
  neutral: styles.swatchNeutral,
  warn: styles.swatchWarn,
};

function shortValue(value: number): string {
  const absolute = Math.abs(value);
  const compact = absolute >= 1000 ? `${(absolute / 1000).toFixed(1)}k` : String(Math.round(absolute));
  return value < 0 ? `-${compact}` : compact;
}

export function MonthlyBarsCard({
  kicker,
  points,
  reference,
  legend,
  filter,
  onPick,
}: MonthlyBarsCardProps) {
  const { hidden, formatCurrency: fmt } = usePrivacy();
  const referenceValue = reference?.value ?? 0;
  const ceiling =
    Math.max(referenceValue, ...points.map((point) => Math.abs(point.value)), 0) || 1;

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <span className={styles.kicker}>{kicker}</span>

        <div className={styles.controls}>
          {legend && legend.length > 0 && (
            <div className={styles.legend}>
              {legend.map((item) => (
                <span key={item.label} className={styles.legendItem}>
                  <span className={TONE_SWATCH[item.tone]} /> {item.label}
                </span>
              ))}
            </div>
          )}
          {filter}
        </div>
      </div>

      <div
        className={`${styles.chart} ${points.length > 7 ? styles.dense : ''}`}
        style={{ gridTemplateColumns: `repeat(${points.length}, 1fr)` }}
      >
        {referenceValue > 0 && (
          <div
            className={styles.referenceLine}
            style={{ bottom: `${(referenceValue / ceiling) * BAR_AREA + 22}px` }}
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
              {point.value === 0 ? '' : hidden ? '•••' : shortValue(point.value)}
            </span>
            <span
              className={`${styles.bar} ${TONE_BAR[point.tone ?? 'accent']} ${
                point.selected ? styles.barSelected : ''
              }`}
              style={{ height: `${Math.max(2, (Math.abs(point.value) / ceiling) * BAR_AREA)}px` }}
            />
            <span className={styles.month}>{point.label}</span>
          </button>
        ))}
      </div>

      {reference && referenceValue > 0 && (
        <span className={styles.footer}>
          linha tracejada = {reference.label} de {fmt(reference.value)}
        </span>
      )}
    </section>
  );
}
