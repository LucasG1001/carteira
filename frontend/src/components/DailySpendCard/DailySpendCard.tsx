import { useState } from 'react';
import { usePrivacy } from '../../context/privacyStore';
import { MESES } from '../../utils/date';
import type { DailySpend } from '../../utils/expenseView';
import styles from './DailySpendCard.module.css';

const WEEKDAY_INITIALS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const LEVELS = [styles.level1, styles.level2, styles.level3, styles.level4];

interface DailySpendCardProps {
  year: number;
  month: number | null;
  data: DailySpend;
}

function shortValue(value: number) {
  if (value >= 1000) return `R$${(value / 1000).toFixed(1).replace('.', ',')}k`;
  return `R$${Math.round(value)}`;
}

function weekdayAverages(data: DailySpend) {
  const sums = new Array<number>(7).fill(0);
  const counts = new Array<number>(7).fill(0);
  for (const day of data.days) {
    if (day.isFuture) continue;
    const weekday = (data.firstWeekday + day.day - 1) % 7;
    sums[weekday] += day.total;
    counts[weekday] += 1;
  }
  return sums.map((sum, weekday) => (counts[weekday] ? sum / counts[weekday] : 0));
}

function tooltipAlign(day: number, count: number) {
  if (day <= 3) return styles.tooltipStart;
  if (day > count - 3) return styles.tooltipEnd;
  return '';
}

function axisLabel(day: number, activeDay: number | null) {
  if (activeDay !== null) {
    if (day === activeDay) return day;
    if (Math.abs(day - activeDay) === 1) return '';
  }
  return day === 1 || day % 5 === 0 ? day : '';
}

function levelOf(total: number, max: number) {
  if (total <= 0 || max <= 0) return '';
  return LEVELS[Math.min(3, Math.floor((total / max) * 4))];
}

export function DailySpendCard({ year, month, data }: DailySpendCardProps) {
  const { hidden, formatCurrency: fmt } = usePrivacy();
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const max = Math.max(0, ...data.days.map((day) => day.total));
  const weekdays = weekdayAverages(data);
  const weekdayMax = Math.max(0, ...weekdays);
  const lockedPct = data.total > 0 ? Math.round((data.locked / data.total) * 100) : 0;
  const unit = month ? 'mês' : 'ano';
  const scopeLabel = month
    ? `${MESES[month - 1].slice(0, 3).toLowerCase()} ${year}`
    : String(year);

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <span className={styles.kicker}>Gasto por dia</span>
        <span className={styles.muted}>{scopeLabel}</span>
      </div>

      {month ? (
        <>
          <div className={styles.calendar}>
            {WEEKDAY_INITIALS.map((initial, index) => (
              <span key={index} className={styles.weekday}>
                {initial}
              </span>
            ))}
            {Array.from({ length: data.firstWeekday }, (_, index) => (
              <span key={`pad-${index}`} />
            ))}
            {data.days.map((day) => (
              <div
                key={day.day}
                className={`${styles.day} ${levelOf(day.total, max)} ${
                  day.isFuture ? styles.dayFuture : ''
                } ${activeDay === day.day ? styles.dayActive : ''}`}
                onPointerEnter={() => setActiveDay(day.day)}
                onPointerLeave={() => setActiveDay(null)}
              >
                <span className={styles.dayNumber}>{day.day}</span>
                {day.total > 0 && (
                  <span className={styles.dayValue}>
                    {hidden ? '•••' : shortValue(day.total)}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className={styles.legend}>
            menos
            <span className={styles.swatch} />
            {LEVELS.map((level) => (
              <span key={level} className={`${styles.swatch} ${level}`} />
            ))}
            mais
          </div>

          <div className={styles.barsBlock}>
            <div className={styles.barsHeader}>
              <span>Gasto por dia</span>
              <span className={styles.muted}>média {fmt(data.average)}/dia</span>
            </div>
            <div className={styles.bars} onPointerLeave={() => setActiveDay(null)}>
              {max > 0 && data.average > 0 && (
                <div
                  className={styles.averageLine}
                  style={{ bottom: `${(data.average / max) * 100}%` }}
                />
              )}
              {data.days.map((day) => {
                const pct = max > 0 ? (day.total / max) * 100 : 0;
                const isActive = activeDay === day.day;
                return (
                  <div
                    key={day.day}
                    className={`${styles.barColumn} ${isActive ? styles.barColumnActive : ''}`}
                    onPointerEnter={() => setActiveDay(day.day)}
                  >
                    <span
                      className={`${styles.bar} ${day.total > 0 ? '' : styles.barEmpty}`}
                      style={day.total > 0 ? { height: `${pct}%` } : undefined}
                    />
                    {isActive && (
                      <span
                        className={`${styles.tooltip} ${tooltipAlign(day.day, data.days.length)}`}
                        style={{ bottom: `calc(${pct}% + 6px)` }}
                      >
                        <span className={styles.tooltipDate}>
                          {WEEKDAY_NAMES[(data.firstWeekday + day.day - 1) % 7].toLowerCase()},{' '}
                          {String(day.day).padStart(2, '0')} {scopeLabel.slice(0, 3)}
                        </span>
                        <span className={styles.tooltipValue}>
                          {day.total > 0 ? fmt(day.total) : 'sem gasto'}
                        </span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className={styles.axis}>
              {data.days.map((day) => (
                <span
                  key={day.day}
                  className={activeDay === day.day ? styles.axisActive : ''}
                >
                  {axisLabel(day.day, activeDay)}
                </span>
              ))}
            </div>
          </div>

          {weekdayMax > 0 && (
            <div className={styles.weekdayBlock}>
              <div className={styles.barsHeader}>
                <span>Por dia da semana</span>
                <span className={styles.muted}>média por dia</span>
              </div>
              <ul className={styles.weekdayList}>
                {weekdays.map((average, weekday) => (
                  <li key={weekday} className={styles.weekdayRow}>
                    <span className={styles.weekdayName}>{WEEKDAY_NAMES[weekday]}</span>
                    <span className={styles.weekdayTrack}>
                      <span
                        className={`${styles.weekdayFill} ${
                          average === weekdayMax ? styles.weekdayPeak : ''
                        }`}
                        style={{ width: `${(average / weekdayMax) * 100}%` }}
                      />
                    </span>
                    <span className={styles.weekdayValue}>{fmt(average)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <p className={styles.muted}>Selecione um mês para ver o gasto por dia.</p>
      )}

      <div className={styles.locked}>
        <span className={styles.muted}>Fixos + parcelados no {unit}</span>
        <span className={styles.lockedTotal}>
          {fmt(data.locked)} · <strong>{lockedPct}%</strong> do {unit}
        </span>
        <div className={styles.lockedSplit}>
          <span>Fixos {fmt(data.lockedFixed)}</span>
          <span>Parcelados {fmt(data.lockedInstallments)}</span>
        </div>
      </div>
    </section>
  );
}
