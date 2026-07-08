import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Modal } from '../Modal/Modal';
import { GoalForm } from '../GoalForm/GoalForm';
import { usePrivacy } from '../../context/privacyStore';
import { addToGoal } from '../../services/api';
import type { BackendGoal } from '../../services/api';
import { formatBRL } from '../../utils/formatting';
import { resolveGoalIcon } from '../../utils/goalIcons';
import styles from './GoalCard.module.css';

const MONTHS_ABBREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function deadlineLabel(deadline: string | null): string {
  if (!deadline) return 'sem prazo';
  const [year, month] = deadline.split('-').map(Number);
  if (!year || !month) return 'sem prazo';
  return `${MONTHS_ABBREV[month - 1]} ${year}`;
}

interface GoalCardProps {
  goal: BackendGoal;
  onChanged: () => Promise<void> | void;
}

export function GoalCard({ goal, onChanged }: GoalCardProps) {
  const { formatCurrency: fmt } = usePrivacy();
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addCents, setAddCents] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saved = goal.saved_amount ?? 0;
  const target = goal.target_amount ?? 0;
  const remaining = Math.max(0, target - saved);
  const pct = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
  const complete = target > 0 && saved >= target;

  const Icon = resolveGoalIcon(goal.icon);
  const addNumber = addCents / 100;

  const onAdd = (event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, '');
    setAddCents(digits ? parseInt(digits, 10) : 0);
  };

  const openAdd = () => {
    setAddCents(0);
    setError(null);
    setAdding(true);
  };

  const handleAdd = async () => {
    if (addNumber <= 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await addToGoal(goal.id, addNumber);
      await onChanged();
      setAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível adicionar o valor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className={styles.card}>
        <div className={styles.head}>
          <div className={styles.iconBox}>
            <Icon size={20} />
          </div>
          <div className={styles.titles}>
            <span className={styles.name}>{goal.name}</span>
            <span className={styles.deadline}>{deadlineLabel(goal.deadline)}</span>
          </div>
          <button
            type="button"
            className={styles.editButton}
            onClick={() => setEditing(true)}
            aria-label="Editar caixinha"
            title="Editar caixinha"
          >
            <Pencil size={15} />
          </button>
        </div>

        <div className={styles.barTrack}>
          <div
            className={`${styles.barFill} ${complete ? styles.barComplete : ''}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className={styles.amounts}>
          <span className={styles.amountText}>
            {fmt(saved)} de {fmt(target)}
          </span>
          <span className={styles.percent}>{Math.round(pct)}%</span>
        </div>

        <span className={styles.remaining}>
          {complete ? 'Meta concluída 🎉' : `Restam ${fmt(remaining)}`}
        </span>

        <button type="button" className={styles.addButton} onClick={openAdd}>
          <Plus size={16} />
          <span>Adicionar valor</span>
        </button>
      </div>

      {adding && (
        <Modal
          title="Adicionar valor"
          subtitle={goal.name}
          onClose={() => setAdding(false)}
          onSubmit={handleAdd}
          submitLabel="Adicionar"
          submitDisabled={addNumber <= 0}
          submitting={submitting}
        >
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Quanto guardar</span>
            <input
              type="text"
              inputMode="numeric"
              value={formatBRL(addNumber)}
              onChange={onAdd}
              className={styles.input}
              placeholder="R$ 0,00"
              autoFocus
            />
          </label>
          {error && <div className={styles.error}>{error}</div>}
        </Modal>
      )}

      {editing && (
        <GoalForm
          mode="edit"
          initialData={goal}
          onClose={() => setEditing(false)}
          onSaved={onChanged}
          onDeleted={onChanged}
        />
      )}
    </>
  );
}
