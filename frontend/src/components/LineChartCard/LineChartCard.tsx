import { useEffect, useRef, useState } from 'react';
import type { PointerEvent, ReactNode } from 'react';
import styles from './LineChartCard.module.css';

export interface LineSeries {
  key: string;
  label: string;
  color: string;
  dash?: string;
  emphasis?: boolean;
  values: (number | null)[];
}

interface LineChartCardProps {
  kicker: string;
  filter?: ReactNode;
  labels: string[];
  series: LineSeries[];
  formatValue: (value: number) => string;
  labelEvery?: number;
  note?: (index: number) => string | null;
  readoutLabel?: (index: number, hovering: boolean) => string;
}

const HEIGHT = 220;
const PAD_Y = 12;
const GUTTER = 92;
const END_LABEL_GAP = 16;

function niceStep(span: number): number {
  const raw = span / 4;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const factor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return factor * magnitude;
}

function lastIndexOf(values: (number | null)[], upTo: number): number {
  for (let index = Math.min(upTo, values.length - 1); index >= 0; index -= 1) {
    if (values[index] != null) return index;
  }
  return -1;
}

export function LineChartCard({
  kicker,
  filter,
  labels,
  series,
  formatValue,
  labelEvery = 1,
  note,
  readoutLabel,
}: LineChartCardProps) {
  const plotRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const element = plotRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const count = labels.length;
  const lastIndex = count - 1;
  const activeIndex = hover ?? lastIndex;

  const allValues = series.flatMap((line) => line.values.filter((value): value is number => value != null));
  const step = niceStep(Math.max(1, Math.max(0, ...allValues) - Math.min(0, ...allValues)));
  const top = Math.ceil(Math.max(0, ...allValues) / step) * step || step;
  const bottom = Math.floor(Math.min(0, ...allValues) / step) * step;
  const ticks: number[] = [];
  for (let tick = bottom; tick <= top + step / 2; tick += step) ticks.push(Number(tick.toFixed(6)));

  const plotWidth = Math.max(0, width - GUTTER);
  const xOf = (index: number) => (count > 1 ? (index / lastIndex) * plotWidth : 0);
  const yOf = (value: number) => PAD_Y + ((top - value) / (top - bottom)) * (HEIGHT - PAD_Y * 2);

  const pathOf = (values: (number | null)[]) =>
    values
      .map((value, index) => (value == null ? null : `${xOf(index).toFixed(1)},${yOf(value).toFixed(1)}`))
      .filter((point): point is string => point != null)
      .join(' ');

  const endLabels = series
    .map((line) => {
      const index = lastIndexOf(line.values, lastIndex);
      const value = index >= 0 ? (line.values[index] as number) : null;
      return value == null ? null : { line, value, y: yOf(value) };
    })
    .filter((item): item is { line: LineSeries; value: number; y: number } => item != null)
    .sort((a, b) => a.y - b.y);
  for (let index = 1; index < endLabels.length; index += 1) {
    endLabels[index].y = Math.max(endLabels[index].y, endLabels[index - 1].y + END_LABEL_GAP);
  }
  const overflow = (endLabels[endLabels.length - 1]?.y ?? 0) - (HEIGHT - PAD_Y);
  if (overflow > 0) for (const item of endLabels) item.y -= overflow;

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    if (count < 2 || plotWidth <= 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / plotWidth));
    setHover(Math.round(ratio * lastIndex));
  };

  const noteText = note?.(activeIndex) ?? null;

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <span className={styles.kicker}>{kicker}</span>
        {filter && <div className={styles.controls}>{filter}</div>}
      </div>

      <div className={styles.readout}>
        <span className={styles.readoutLabel}>
          {readoutLabel ? readoutLabel(activeIndex, hover != null) : labels[activeIndex]}
        </span>
        <dl className={styles.stats}>
          {series.map((line) => {
            const index = lastIndexOf(line.values, activeIndex);
            const value = index >= 0 ? line.values[index] : null;
            return (
              <div key={line.key} className={styles.stat}>
                <dt className={styles.statLabel}>
                  <svg className={styles.swatch} viewBox="0 0 18 6" aria-hidden="true">
                    <line
                      x1="1"
                      y1="3"
                      x2="17"
                      y2="3"
                      stroke={line.color}
                      strokeWidth={line.emphasis ? 3 : 2}
                      strokeDasharray={line.dash}
                      strokeLinecap="round"
                    />
                  </svg>
                  {line.label}
                </dt>
                <dd className={line.emphasis ? styles.statValueStrong : styles.statValue}>
                  {value == null ? '—' : formatValue(value)}
                </dd>
              </div>
            );
          })}
        </dl>
        {noteText && <p className={styles.note}>{noteText}</p>}
      </div>

      <div
        ref={plotRef}
        className={styles.plot}
        style={{ height: HEIGHT }}
        onPointerMove={handleMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`${kicker}: ${series
          .map((line) => {
            const index = lastIndexOf(line.values, lastIndex);
            return `${line.label} ${index >= 0 ? formatValue(line.values[index] as number) : 'sem dados'}`;
          })
          .join(', ')}`}
      >
        {width > 0 && (
          <>
            <svg className={styles.svg} width={width} height={HEIGHT} aria-hidden="true">
              {ticks.map((tick) => (
                <line
                  key={tick}
                  x1={0}
                  x2={plotWidth}
                  y1={yOf(tick)}
                  y2={yOf(tick)}
                  className={tick === 0 ? styles.zeroLine : styles.gridLine}
                />
              ))}
              {hover != null && (
                <line x1={xOf(hover)} x2={xOf(hover)} y1={PAD_Y} y2={HEIGHT - PAD_Y} className={styles.guide} />
              )}
              {series
                .slice()
                .reverse()
                .map((line) => (
                  <polyline
                    key={line.key}
                    points={pathOf(line.values)}
                    fill="none"
                    stroke={line.color}
                    strokeWidth={line.emphasis ? 2.5 : 2}
                    strokeDasharray={line.dash}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              {hover != null &&
                series.map((line) => {
                  const value = line.values[hover];
                  return value == null ? null : (
                    <circle
                      key={line.key}
                      cx={xOf(hover)}
                      cy={yOf(value)}
                      r={4}
                      fill={line.color}
                      className={styles.dot}
                    />
                  );
                })}
            </svg>

            {ticks.map((tick) => (
              <span key={tick} className={styles.tickLabel} style={{ top: yOf(tick) }}>
                {formatValue(tick)}
              </span>
            ))}

            {endLabels.map((item) => (
              <span
                key={item.line.key}
                className={item.line.emphasis ? styles.endLabelStrong : styles.endLabel}
                style={{ top: item.y, left: plotWidth + 8 }}
              >
                {item.line.label} {formatValue(item.value)}
              </span>
            ))}
          </>
        )}
      </div>

      <div className={styles.axis} style={{ marginRight: GUTTER }}>
        {labels.map((label, index) =>
          index === 0 || (lastIndex - index) % labelEvery !== 0 ? null : (
            <span
              key={`${label}-${index}`}
              className={index === lastIndex ? styles.axisLabelEnd : styles.axisLabel}
              style={{ left: `${count > 1 ? (index / lastIndex) * 100 : 0}%` }}
            >
              {label}
            </span>
          ),
        )}
      </div>

      <table className={styles.srOnly}>
        <caption>{kicker}</caption>
        <thead>
          <tr>
            <th scope="col">Mês</th>
            {series.map((line) => (
              <th key={line.key} scope="col">
                {line.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.slice(1).map((label, offset) => (
            <tr key={`${label}-${offset}`}>
              <th scope="row">{label}</th>
              {series.map((line) => {
                const value = line.values[offset + 1];
                return <td key={line.key}>{value == null ? '—' : formatValue(value)}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
