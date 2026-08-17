import { usePrivacy } from '../../context/privacyStore';
import styles from './SummaryHeroCard.module.css';

export interface HeroComparison {
  label: string;
  value: number | null;
  valueText?: string;
  variationPct?: number | null;
  positiveIsGood?: boolean;
  note?: string;
  emptyNote?: string;
}

interface SummaryHeroCardProps {
  kicker: string;
  total: number;
  reference?: { label: string; value: number };
  deltaLabels?: { above: string; below: string };
  aboveIsGood?: boolean;
  comparisons: HeroComparison[];
}

export function SummaryHeroCard({
  kicker,
  total,
  reference,
  deltaLabels,
  aboveIsGood = true,
  comparisons,
}: SummaryHeroCardProps) {
  const { formatCurrency: fmt } = usePrivacy();

  const hasReference = !!reference && reference.value > 0;
  const referenceValue = reference?.value ?? 0;
  const above = hasReference && total > referenceValue;
  const delta = total - referenceValue;
  const deltaPct = hasReference ? Math.round((delta / referenceValue) * 100) : 0;
  const ceiling = Math.max(total, referenceValue);
  const fillPct = hasReference && ceiling > 0 ? Math.min(100, (total / ceiling) * 100) : 0;
  const markPct = hasReference && ceiling > 0 ? (referenceValue / ceiling) * 100 : 0;
  const goodSide = above === aboveIsGood;

  return (
    <section className={styles.card}>
      <div className={styles.top}>
        <span className={styles.kicker}>{kicker}</span>
        {reference && (
          <span className={styles.reference}>
            {reference.label} {fmt(reference.value)}
          </span>
        )}
      </div>

      <div className={styles.totalRow}>
        <span className={styles.total}>{fmt(total)}</span>
        {hasReference && deltaLabels && (
          <span className={goodSide ? styles.deltaGood : styles.deltaBad}>
            {above
              ? `+${fmt(delta)} ${deltaLabels.above}`
              : `${fmt(Math.abs(delta))} ${deltaLabels.below}`}
          </span>
        )}
      </div>

      {hasReference && (
        <div className={styles.barBlock}>
          <div className={styles.barTrack}>
            <div className={styles.barFill} style={{ width: `${fillPct}%` }} />
            <div
              className={`${styles.barMark} ${goodSide ? '' : styles.barMarkBad}`}
              style={{ left: `${markPct}%` }}
            />
          </div>
          <span className={goodSide ? styles.note : styles.noteBad}>
            {Math.abs(deltaPct)}% {above ? deltaLabels?.above : deltaLabels?.below}
          </span>
        </div>
      )}

      <div className={styles.divider} />

      <div className={styles.comparisons}>
        {comparisons.map((item) => {
          const positiveIsGood = item.positiveIsGood ?? true;
          const variationGood = (item.variationPct ?? 0) >= 0 === positiveIsGood;
          return (
            <div key={item.label} className={styles.comparison}>
              <span className={styles.comparisonLabel}>{item.label}</span>
              <div className={styles.comparisonRow}>
                <span className={styles.comparisonValue}>
                  {item.valueText ?? (item.value == null ? '—' : fmt(item.value))}
                </span>
                {item.value == null && !item.valueText ? (
                  <span className={styles.comparisonNote}>{item.emptyNote ?? 'sem histórico'}</span>
                ) : (
                  item.variationPct != null && (
                    <span className={variationGood ? styles.varGood : styles.varBad}>
                      {item.variationPct >= 0 ? '↑' : '↓'} {Math.abs(item.variationPct).toFixed(0)}%
                    </span>
                  )
                )}
              </div>
              {item.note && <span className={styles.comparisonNote}>{item.note}</span>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
