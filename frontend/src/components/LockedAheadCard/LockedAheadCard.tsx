import { usePrivacy } from '../../context/privacyStore';
import type { LockedMonth } from '../../utils/expenseView';
import styles from './LockedAheadCard.module.css';

interface LockedAheadCardProps {
  months: LockedMonth[];
  meta: number;
}

export function LockedAheadCard({ months, meta }: LockedAheadCardProps) {
  const { formatCurrency: fmt } = usePrivacy();
  const hasAny = months.some((month) => month.total > 0);
  const ceiling = Math.max(meta, ...months.map((month) => month.total)) || 1;

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <span className={styles.kicker}>O que já está travado nos próximos meses</span>
        {meta > 0 && <span className={styles.note}>meta {fmt(meta)}/mês</span>}
      </div>

      {hasAny ? (
        <div className={styles.grid}>
          {months.map((month) => {
            const over = meta > 0 && month.total > meta;
            const pct = Math.min(100, (month.total / ceiling) * 100);
            return (
              <div key={month.key} className={styles.cell}>
                <span className={styles.value}>{fmt(month.total)}</span>
                <div className={styles.track}>
                  <div
                    className={`${styles.fill} ${over ? styles.fillOver : ''}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className={styles.footer}>
                  <span className={styles.month}>{month.label}</span>
                  {meta > 0 && (
                    <span className={over ? styles.pctOver : styles.pct}>
                      {Math.round((month.total / meta) * 100)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className={styles.empty}>
          Nenhuma parcela ou recorrência travada para os próximos meses.
        </p>
      )}
    </section>
  );
}
