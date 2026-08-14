import { usePrivacy } from '../../context/privacyStore';
import type { BreakdownGroup, GroupBy } from '../../utils/expenseView';
import styles from './SpendBreakdownCard.module.css';

const GROUP_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: 'sub', label: 'por subcategoria' },
  { value: 'category', label: 'por categoria' },
  { value: 'desc', label: 'por descrição' },
  { value: 'origem', label: 'por forma de pagamento' },
];

interface SpendBreakdownCardProps {
  groups: BreakdownGroup[];
  groupBy: GroupBy;
  onGroupByChange: (value: GroupBy) => void;
  subtitle: string;
  onPick: (group: BreakdownGroup) => void;
  activeName?: string | null;
}

function lockedNote(group: BreakdownGroup) {
  const base = `${group.count} ${group.count === 1 ? 'lançamento' : 'lançamentos'}`;
  if (group.lockedCount === 0) return `${base} · escolha sua`;
  if (group.lockedCount === group.count) return `${base} · tudo travado`;
  return `${base} · ${group.lockedCount} travado`;
}

export function SpendBreakdownCard({
  groups,
  groupBy,
  onGroupByChange,
  subtitle,
  onPick,
  activeName,
}: SpendBreakdownCardProps) {
  const { formatCurrency: fmt } = usePrivacy();
  const max = groups.reduce((top, group) => Math.max(top, group.total), 0) || 1;

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <span className={styles.kicker}>Para onde o dinheiro vai</span>
        <select
          className={styles.select}
          value={groupBy}
          onChange={(event) => onGroupByChange(event.target.value as GroupBy)}
        >
          {GROUP_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <p className={styles.subtitle}>{subtitle}</p>

      {groups.length === 0 ? (
        <p className={styles.empty}>Nenhum gasto neste período.</p>
      ) : (
        <div className={styles.list}>
          {groups.map((group, index) => {
            const active = activeName === group.name;
            return (
              <button
                key={group.name}
                type="button"
                className={`${styles.group} ${active ? styles.groupActive : ''}`}
                onClick={() => onPick(group)}
              >
                <div className={styles.groupRow}>
                  <span className={styles.groupName}>{group.name}</span>
                  <span className={styles.groupValues}>
                    <span className={styles.groupPct}>{group.pct.toFixed(0)}%</span>
                    <span className={styles.groupTotal}>{fmt(group.total)}</span>
                  </span>
                </div>
                <div className={styles.track}>
                  <div
                    className={`${styles.fill} ${index === 0 ? styles.fillTop : ''}`}
                    style={{ width: `${(group.total / max) * 100}%` }}
                  />
                </div>
                <span className={styles.note}>{lockedNote(group)}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
