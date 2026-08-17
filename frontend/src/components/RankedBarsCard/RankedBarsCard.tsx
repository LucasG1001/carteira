import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { usePrivacy } from '../../context/privacyStore';
import styles from './RankedBarsCard.module.css';

export interface RankedGroup {
  name: string;
  value: number;
  pct: number;
  note?: string;
  tone?: 'accent' | 'warn';
  barColor?: string;
}

export interface RankedSelect {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

interface RankedBarsCardProps {
  kicker: string;
  subtitle?: string;
  select?: RankedSelect;
  filter?: ReactNode;
  groups: RankedGroup[];
  onPick?: (group: RankedGroup) => void;
  activeName?: string | null;
  emptyLabel?: string;
  breadcrumb?: { label: string; onBack: () => void };
}

export function RankedBarsCard({
  kicker,
  subtitle,
  select,
  filter,
  groups,
  onPick,
  activeName,
  emptyLabel = 'Nada neste período.',
  breadcrumb,
}: RankedBarsCardProps) {
  const { formatCurrency: fmt } = usePrivacy();
  const max = groups.reduce((top, group) => Math.max(top, Math.abs(group.value)), 0) || 1;

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <span className={styles.kicker}>{kicker}</span>
        <div className={styles.controls}>
          {select && (
            <select
              className={styles.select}
              value={select.value}
              onChange={(event) => select.onChange(event.target.value)}
            >
              {select.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          {filter}
        </div>
      </div>

      {breadcrumb && (
        <button type="button" className={styles.breadcrumb} onClick={breadcrumb.onBack}>
          <ChevronLeft size={13} />
          {breadcrumb.label}
        </button>
      )}

      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}

      {groups.length === 0 ? (
        <p className={styles.empty}>{emptyLabel}</p>
      ) : (
        <div className={styles.list}>
          {groups.map((group, index) => {
            const active = activeName === group.name;
            const warn = group.tone === 'warn';
            const fillClass = warn
              ? styles.fillWarn
              : `${styles.fill} ${index === 0 ? styles.fillTop : ''}`;
            return (
              <button
                key={group.name}
                type="button"
                className={`${styles.group} ${active ? styles.groupActive : ''}`}
                onClick={() => onPick?.(group)}
                disabled={!onPick}
              >
                <div className={styles.groupRow}>
                  <span className={styles.groupName}>{group.name}</span>
                  <span className={styles.groupValues}>
                    <span className={styles.groupPct}>{group.pct.toFixed(0)}%</span>
                    <span className={styles.groupTotal}>{fmt(group.value)}</span>
                  </span>
                </div>
                <div className={styles.track}>
                  <div
                    className={fillClass}
                    style={{
                      width: `${(Math.abs(group.value) / max) * 100}%`,
                      background: group.barColor,
                    }}
                  />
                </div>
                {group.note && <span className={styles.note}>{group.note}</span>}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
