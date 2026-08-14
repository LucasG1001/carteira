import { useState } from 'react';
import { Modal } from '../Modal/Modal';
import { usePrivacy } from '../../context/privacyStore';
import { setBudget } from '../../services/api';
import styles from './MonthSummaryCard.module.css';

const META_CATEGORY = 'Geral';

export interface Comparison {
  label: string;
  value: number | null;
  variationPct: number | null;
  emptyNote?: string;
}

interface MonthSummaryCardProps {
  kicker: string;
  total: number;
  meta: number;
  comparisons: Comparison[];
  onSaved: () => Promise<void> | void;
}

export function MonthSummaryCard({
  kicker,
  total,
  meta,
  comparisons,
  onSaved,
}: MonthSummaryCardProps) {
  const { formatCurrency: fmt } = usePrivacy();
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [metaInput, setMetaInput] = useState(meta ? String(meta) : '');

  const hasMeta = meta > 0;
  const over = hasMeta && total > meta;
  const delta = total - meta;
  const deltaPct = hasMeta ? Math.round((delta / meta) * 100) : 0;
  const fillPct = hasMeta ? Math.min(100, (total / Math.max(total, meta)) * 100) : 0;
  const markPct = hasMeta ? (meta / Math.max(total, meta)) * 100 : 0;

  const openEdit = () => {
    setMetaInput(meta ? String(meta) : '');
    setEditing(true);
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await setBudget(META_CATEGORY, Number(metaInput) || 0);
      await onSaved();
      setEditing(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className={styles.card}>
        <div className={styles.top}>
          <span className={styles.kicker}>{kicker}</span>
          <button type="button" className={styles.metaButton} onClick={openEdit}>
            {hasMeta ? `meta ${fmt(meta)}` : 'definir meta'}
          </button>
        </div>

        <div className={styles.totalRow}>
          <span className={styles.total}>{fmt(total)}</span>
          {hasMeta && (
            <span className={over ? styles.deltaOver : styles.deltaUnder}>
              {over
                ? `+${fmt(delta)} acima da meta`
                : `${fmt(Math.abs(delta))} abaixo da meta`}
            </span>
          )}
        </div>

        {hasMeta && (
          <div className={styles.barBlock}>
            <div className={styles.barTrack}>
              <div className={styles.barFill} style={{ width: `${fillPct}%` }} />
              <div
                className={`${styles.barMark} ${over ? styles.barMarkOver : ''}`}
                style={{ left: `${markPct}%` }}
              />
            </div>
            <span className={over ? styles.noteOver : styles.note}>
              {over
                ? `${deltaPct}% acima do planejado`
                : `${Math.abs(deltaPct)}% abaixo do planejado`}
            </span>
          </div>
        )}

        <div className={styles.divider} />

        <div className={styles.comparisons}>
          {comparisons.map((item) => (
            <div key={item.label} className={styles.comparison}>
              <span className={styles.comparisonLabel}>{item.label}</span>
              <div className={styles.comparisonRow}>
                <span className={styles.comparisonValue}>
                  {item.value == null ? '—' : fmt(item.value)}
                </span>
                {item.value == null ? (
                  <span className={styles.note}>{item.emptyNote ?? 'sem histórico'}</span>
                ) : (
                  item.variationPct != null && (
                    <span
                      className={item.variationPct > 0 ? styles.varUp : styles.varDown}
                    >
                      {item.variationPct > 0 ? '↑' : '↓'} {Math.abs(item.variationPct).toFixed(0)}%
                    </span>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {editing && (
        <Modal
          title="Meta de gastos mensal"
          subtitle="Defina o limite total de gastos por mês."
          onClose={() => setEditing(false)}
          onSubmit={handleSave}
          submitting={submitting}
        >
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Meta mensal</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={metaInput}
              onChange={(event) => setMetaInput(event.target.value)}
              className={styles.input}
              placeholder="0,00"
              autoFocus
            />
          </label>
        </Modal>
      )}
    </>
  );
}
