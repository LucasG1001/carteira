import { usePrivacy } from '../../context/privacyStore';
import styles from './SplitBarCard.module.css';

export type SplitTone = 'accent' | 'accentDeep' | 'neutral' | 'neutralDeep' | 'warn';

export interface SplitSegment {
  name: string;
  value: number;
  note?: string;
  tone: SplitTone;
}

interface SplitBarCardProps {
  kicker: string;
  segments: SplitSegment[];
  footerLines?: { label: string; value: string }[];
  emptyLabel?: string;
}

const TONE_SEGMENT: Record<SplitTone, string> = {
  accent: styles.segmentAccent,
  accentDeep: styles.segmentAccentDeep,
  neutral: styles.segmentNeutral,
  neutralDeep: styles.segmentNeutralDeep,
  warn: styles.segmentWarn,
};

const TONE_SWATCH: Record<SplitTone, string> = {
  accent: styles.swatchAccent,
  accentDeep: styles.swatchAccentDeep,
  neutral: styles.swatchNeutral,
  neutralDeep: styles.swatchNeutralDeep,
  warn: styles.swatchWarn,
};

export function SplitBarCard({ kicker, segments, footerLines, emptyLabel }: SplitBarCardProps) {
  const { formatCurrency: fmt } = usePrivacy();
  const scale = segments.reduce((sum, segment) => sum + Math.abs(segment.value), 0);

  return (
    <section className={styles.card}>
      <span className={styles.kicker}>{kicker}</span>

      {scale > 0 ? (
        <div className={styles.proportion}>
          {segments.map((segment) => (
            <div
              key={segment.name}
              className={TONE_SEGMENT[segment.tone]}
              style={{ width: `${(Math.abs(segment.value) / scale) * 100}%` }}
            />
          ))}
        </div>
      ) : (
        <div className={styles.proportionEmpty} />
      )}

      {scale > 0 || !emptyLabel ? (
        <div className={styles.entries}>
          {segments.map((segment) => (
            <div key={segment.name} className={styles.entry}>
              <div className={styles.entryRow}>
                <span className={styles.entryName}>
                  <span className={TONE_SWATCH[segment.tone]} />
                  {segment.name}
                </span>
                <span className={styles.entryValue}>{fmt(segment.value)}</span>
              </div>
              {segment.note && <span className={styles.entryNote}>{segment.note}</span>}
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>{emptyLabel}</p>
      )}

      {footerLines && footerLines.length > 0 && (
        <>
          <div className={styles.divider} />
          <div className={styles.footer}>
            {footerLines.map((line) => (
              <div key={line.label} className={styles.footerRow}>
                <span className={styles.footerLabel}>{line.label}</span>
                <span className={styles.footerValue}>{line.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
