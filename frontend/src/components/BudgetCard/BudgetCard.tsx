import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Modal } from '../Modal/Modal';
import { usePrivacy } from '../../context/privacyStore';
import { setBudget } from '../../services/api';
import type { BudgetItem } from '../../services/api';
import type { CategoryTotal } from '../../utils/expenseView';
import bn from '../BigNumbers/BigNumbers.module.css';
import styles from './BudgetCard.module.css';

const CATEGORIES = ['Essenciais', 'Lazer'];

interface BudgetCardProps {
  spentByCategory: CategoryTotal[];
  budgets: BudgetItem[];
  onSaved: () => Promise<void> | void;
}

export function BudgetCard({ spentByCategory, budgets, onSaved }: BudgetCardProps) {
  const { formatCurrency: fmt } = usePrivacy();
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const spentOf = (category: string) =>
    spentByCategory.find((item) => item.category === category)?.total ?? 0;
  const budgetOf = (category: string) =>
    budgets.find((item) => item.category === category)?.amount ?? 0;

  const [metaEssenciais, setMetaEssenciais] = useState(() => {
    const value = budgets.find((b) => b.category === 'Essenciais')?.amount ?? 0;
    return value ? String(value) : '';
  });
  const [metaLazer, setMetaLazer] = useState(() => {
    const value = budgets.find((b) => b.category === 'Lazer')?.amount ?? 0;
    return value ? String(value) : '';
  });

  const openEdit = () => {
    setMetaEssenciais(budgetOf('Essenciais') ? String(budgetOf('Essenciais')) : '');
    setMetaLazer(budgetOf('Lazer') ? String(budgetOf('Lazer')) : '');
    setEditing(true);
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await setBudget('Essenciais', Number(metaEssenciais) || 0);
      await setBudget('Lazer', Number(metaLazer) || 0);
      await onSaved();
      setEditing(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className={`${bn.card} ${bn.indigo} ${styles.card}`} onClick={openEdit}>
        <div className={styles.header}>
          <span className={bn.label}>Meta de Gastos</span>
          <Pencil size={14} className={styles.editIcon} />
        </div>

        <div className={styles.rows}>
          {CATEGORIES.map((category) => {
            const spent = spentOf(category);
            const goal = budgetOf(category);
            const hasGoal = goal > 0;
            const over = hasGoal && spent > goal;
            const pct = hasGoal ? Math.min(100, (spent / goal) * 100) : 0;
            return (
              <div key={category} className={styles.row}>
                <div className={styles.rowTop}>
                  <span className={styles.catName}>{category}</span>
                  <span className={`${styles.catValue} ${over ? styles.over : ''}`}>
                    {hasGoal ? `${fmt(spent)} / ${fmt(goal)}` : 'definir meta'}
                  </span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={`${styles.barFill} ${over ? styles.barOver : styles.barOk}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editing && (
        <Modal
          title="Metas de gasto"
          subtitle="Defina o limite mensal por categoria."
          onClose={() => setEditing(false)}
          onSubmit={handleSave}
          submitting={submitting}
        >
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Meta Essenciais</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={metaEssenciais}
              onChange={(e) => setMetaEssenciais(e.target.value)}
              className={styles.input}
              placeholder="0,00"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Meta Lazer</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={metaLazer}
              onChange={(e) => setMetaLazer(e.target.value)}
              className={styles.input}
              placeholder="0,00"
            />
          </label>
        </Modal>
      )}
    </>
  );
}
