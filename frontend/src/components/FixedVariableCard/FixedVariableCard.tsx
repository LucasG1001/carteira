import { usePrivacy } from '../../context/privacyStore';
import type { ScopeTotals } from '../../utils/expenseView';
import styles from './FixedVariableCard.module.css';

interface FixedVariableCardProps {
  kicker: string;
  totals: ScopeTotals;
  averages: { locked: number; free: number };
  averageLabel: string;
}

function pct(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

export function FixedVariableCard({
  kicker,
  totals,
  averages,
  averageLabel,
}: FixedVariableCardProps) {
  const { formatCurrency: fmt } = usePrivacy();
  const lockedPct = pct(totals.locked, totals.total);
  const freePct = pct(totals.free, totals.total);

  const entries = [
    {
      key: 'locked',
      name: 'Travado / parcelado',
      value: totals.locked,
      swatch: styles.swatchLocked,
      note: `${lockedPct}% do mês · ${totals.lockedCount} ${
        totals.lockedCount === 1 ? 'compromisso ativo' : 'compromissos ativos'
      }`,
    },
    {
      key: 'free',
      name: 'Escolha sua',
      value: totals.free,
      swatch: styles.swatchFree,
      note: `${freePct}% do mês · ${totals.freeCount} ${
        totals.freeCount === 1 ? 'lançamento seu' : 'lançamentos seus'
      }`,
    },
  ];

  return (
    <section className={styles.card}>
      <span className={styles.kicker}>{kicker}</span>

      {totals.total > 0 ? (
        <div className={styles.proportion}>
          <div className={styles.segmentLocked} style={{ width: `${lockedPct}%` }} />
          <div className={styles.segmentFree} style={{ width: `${freePct}%` }} />
        </div>
      ) : (
        <div className={styles.proportionEmpty} />
      )}

      <div className={styles.entries}>
        {entries.map((entry) => (
          <div key={entry.key} className={styles.entry}>
            <div className={styles.entryRow}>
              <span className={styles.entryName}>
                <span className={entry.swatch} />
                {entry.name}
              </span>
              <span className={styles.entryValue}>{fmt(entry.value)}</span>
            </div>
            <span className={styles.entryNote}>{entry.note}</span>
          </div>
        ))}
      </div>

      <div className={styles.divider} />

      <div className={styles.averages}>
        <div className={styles.averageRow}>
          <span className={styles.averageLabel}>Média travada · {averageLabel}</span>
          <span className={styles.averageValue}>{fmt(averages.locked)}</span>
        </div>
        <div className={styles.averageRow}>
          <span className={styles.averageLabel}>Média escolha sua · {averageLabel}</span>
          <span className={styles.averageValue}>{fmt(averages.free)}</span>
        </div>
      </div>
    </section>
  );
}
