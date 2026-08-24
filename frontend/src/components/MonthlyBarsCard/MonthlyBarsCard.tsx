import type { ReactNode } from 'react';
import { usePrivacy } from '../../context/privacyStore';
import styles from './MonthlyBarsCard.module.css';

const BAR_AREA = 150;
const PLOT = 150;
const LABEL_SLOT = 17;
const DRAW = PLOT - LABEL_SLOT * 2;
const MONTH_OFFSET = 22;

export type BarTone = 'accent' | 'neutral' | 'warn';

export interface MonthPoint {
  key: string;
  label: string;
  value: number;
  tone?: BarTone;
  selected?: boolean;
  title?: string;
}

interface MonthlyBarsCardProps {
  kicker: string;
  points: MonthPoint[];
  reference?: { value: number; label: string };
  legend?: { tone: BarTone; label: string }[];
  filter?: ReactNode;
  onPick?: (key: string) => void;
  diverging?: boolean;
  labelEvery?: number;
  showValues?: 'all' | 'extremes';
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

function signedShortValue(value: number): string {
  const absolute = Math.abs(value);
  const compact = absolute >= 1000 ? `${(absolute / 1000).toFixed(1)}k` : String(Math.round(absolute));
  return `${value < 0 ? '−' : '+'}${compact}`;
}

export function MonthlyBarsCard({
  kicker,
  points,
  reference,
  legend,
  filter,
  onPick,
  diverging = false,
  labelEvery,
  showValues = 'all',
}: MonthlyBarsCardProps) {
  const { hidden, formatCurrency: fmt } = usePrivacy();
  const referenceValue = reference?.value ?? 0;
  const ceiling =
    Math.max(referenceValue, ...points.map((point) => Math.abs(point.value)), 0) || 1;

  const values = points.map((point) => point.value);
  const posCeiling = Math.max(0, ...values);
  const negFloor = Math.min(0, ...values);
  const rawSpan = posCeiling - negFloor;
  const span = rawSpan || 1;
  const upArea = rawSpan === 0 ? DRAW : Math.round((posCeiling / span) * DRAW);
  const downArea = DRAW - upArea;

  const extremeKeys = new Set<string>();
  if (showValues === 'extremes') {
    const moved = points.filter((point) => point.value !== 0);
    if (moved.length > 0) {
      extremeKeys.add(moved.reduce((top, point) => (point.value > top.value ? point : top)).key);
      extremeKeys.add(moved.reduce((low, point) => (point.value < low.value ? point : low)).key);
    }
  }

  const heightOf = (value: number) =>
    value === 0 ? 0 : Math.max(2, Math.round((Math.abs(value) / span) * DRAW));

  const showsValue = (point: MonthPoint) =>
    showValues === 'all' || point.selected === true || extremeKeys.has(point.key);

  const labelOf = (point: MonthPoint, index: number) =>
    labelEvery === undefined || index % labelEvery === 0 || index === points.length - 1
      ? point.label
      : ' ';

  const valueTextOf = (point: MonthPoint) => {
    if (point.value === 0 || !showsValue(point)) return '';
    if (hidden) return '•••';
    return diverging ? signedShortValue(point.value) : shortValue(point.value);
  };

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
        className={`${styles.chart} ${points.length > 7 ? styles.dense : ''} ${
          labelEvery === undefined ? '' : styles.thinned
        }`}
        style={{ gridTemplateColumns: `repeat(${points.length}, 1fr)` }}
      >
        {diverging ? (
          <div className={styles.zeroLine} style={{ bottom: `${LABEL_SLOT + downArea + MONTH_OFFSET}px` }} />
        ) : (
          referenceValue > 0 && (
            <div
              className={styles.referenceLine}
              style={{ bottom: `${(referenceValue / ceiling) * BAR_AREA + 22}px` }}
            />
          )
        )}

        {diverging && reference && (
          <div
            className={styles.referenceLine}
            style={{
              bottom: `${LABEL_SLOT + downArea + (referenceValue / span) * DRAW + MONTH_OFFSET}px`,
            }}
          />
        )}

        {points.map((point, index) =>
          diverging ? (
            <button
              key={point.key}
              type="button"
              className={`${styles.column} ${styles.columnDiverging}`}
              onClick={() => onPick?.(point.key)}
              disabled={!onPick}
              title={point.title}
            >
              <span className={`${styles.plot} ${point.selected ? styles.plotSelected : ''}`}>
                {point.value >= 0 ? (
                  <>
                    <span
                      className={`${styles.bar} ${styles.barUp} ${TONE_BAR[point.tone ?? 'accent']} ${
                        point.selected ? styles.barSelected : ''
                      }`}
                      style={{
                        bottom: `${LABEL_SLOT + downArea}px`,
                        height: `${heightOf(point.value)}px`,
                      }}
                    />
                    <span
                      className={`${styles.value} ${styles.valueUp}`}
                      style={{ bottom: `${LABEL_SLOT + downArea + heightOf(point.value)}px` }}
                    >
                      {valueTextOf(point)}
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      className={`${styles.bar} ${styles.barDown} ${TONE_BAR[point.tone ?? 'warn']} ${
                        point.selected ? styles.barSelected : ''
                      }`}
                      style={{
                        top: `${LABEL_SLOT + upArea}px`,
                        height: `${heightOf(point.value)}px`,
                      }}
                    />
                    <span
                      className={`${styles.value} ${styles.valueDown}`}
                      style={{ top: `${LABEL_SLOT + upArea + heightOf(point.value)}px` }}
                    >
                      {valueTextOf(point)}
                    </span>
                  </>
                )}
              </span>
              <span className={styles.month}>{labelOf(point, index)}</span>
            </button>
          ) : (
            <button
              key={point.key}
              type="button"
              className={styles.column}
              onClick={() => onPick?.(point.key)}
              disabled={!onPick}
              title={point.title}
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
              <span className={styles.month}>{labelOf(point, index)}</span>
            </button>
          ),
        )}
      </div>

      {reference && (diverging || referenceValue > 0) && (
        <span className={styles.footer}>
          linha tracejada = {reference.label} de {fmt(reference.value)}
        </span>
      )}
    </section>
  );
}
