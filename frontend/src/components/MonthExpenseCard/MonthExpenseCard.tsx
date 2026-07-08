import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Modal } from '../Modal/Modal';
import { usePrivacy } from '../../context/privacyStore';
import { setBudget } from '../../services/api';
import bn from '../BigNumbers/BigNumbers.module.css';
import styles from './MonthExpenseCard.module.css';

const META_CATEGORY = 'Geral';

interface MonthExpenseCardProps {
  spent: number;
  variationPct: number | null;
  meta: number;
  onSaved: () => Promise<void> | void;
}

export function MonthExpenseCard({ spent, variationPct, meta, onSaved }: MonthExpenseCardProps) {
  const { formatCurrency: fmt } = usePrivacy();
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [metaInput, setMetaInput] = useState(meta ? String(meta) : '');

  const hasMeta = meta > 0;
  const over = hasMeta && spent > meta;
  const pct = hasMeta ? Math.min(100, (spent / meta) * 100) : 0;
  const remaining = meta - spent;

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
      <div className={`${bn.card} ${bn.red} ${styles.card}`} onClick={openEdit}>
        <div className={styles.header}>
          <span className={bn.label}>Despesa do Mês</span>
          <Pencil size={14} className={styles.editIcon} />
        </div>

        <div className={bn.valueRow}>
          <span className={bn.value}>{fmt(spent)}</span>
          {variationPct != null && (
            <span className={`${bn.side} ${variationPct > 0 ? bn.down : bn.up}`}>
              {`${variationPct >= 0 ? '+' : ''}${variationPct.toFixed(0)}%`}
            </span>
          )}
        </div>

        <div className={styles.barTrack}>
          <div
            className={`${styles.barFill} ${over ? styles.barOver : styles.barOk}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {hasMeta ? (
          <span className={styles.status}>
            Meta {fmt(meta)} ·{' '}
            {over ? (
              <span className={styles.over}>Excedeu {fmt(spent - meta)}</span>
            ) : (
              <span className={styles.ok}>Restam {fmt(remaining)}</span>
            )}
          </span>
        ) : (
          <span className={styles.status}>Defina sua meta mensal</span>
        )}
      </div>

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
