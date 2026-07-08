import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { Modal } from '../Modal/Modal';
import { createGoal, deleteGoal, updateGoal } from '../../services/api';
import type { BackendGoal } from '../../services/api';
import { formatBRL } from '../../utils/formatting';
import { GOAL_ICONS } from '../../utils/goalIcons';
import styles from './GoalForm.module.css';

interface GoalFormProps {
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  mode?: 'create' | 'edit';
  initialData?: BackendGoal;
  onDeleted?: () => Promise<void> | void;
}

export function GoalForm({ onClose, onSaved, mode = 'create', initialData, onDeleted }: GoalFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [targetCents, setTargetCents] = useState(initialData ? Math.round(initialData.target_amount * 100) : 0);
  const [savedCents, setSavedCents] = useState(initialData ? Math.round(initialData.saved_amount * 100) : 0);
  const [deadlineMonth, setDeadlineMonth] = useState(initialData?.deadline ? initialData.deadline.slice(0, 7) : '');
  const [icon, setIcon] = useState(initialData?.icon ?? GOAL_ICONS[0].key);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = mode === 'edit' && initialData != null;
  const targetNumber = targetCents / 100;
  const savedNumber = savedCents / 100;
  const valid = name.trim().length > 0 && targetNumber > 0;

  const onTarget = (event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, '');
    setTargetCents(digits ? parseInt(digits, 10) : 0);
  };

  const onSavedAmount = (event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, '');
    setSavedCents(digits ? parseInt(digits, 10) : 0);
  };

  const handleSubmit = async () => {
    if (!valid) return;
    setSubmitting(true);
    setError(null);
    const payload = {
      name: name.trim(),
      target_amount: targetNumber,
      deadline: deadlineMonth ? `${deadlineMonth}-01` : null,
      icon,
    };
    try {
      if (isEdit) {
        await updateGoal(initialData.id, { ...payload, saved_amount: savedNumber });
      } else {
        await createGoal(payload);
      }
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a caixinha.');
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    if (!window.confirm(`Excluir a caixinha "${initialData.name}"?`)) return;
    setSubmitting(true);
    try {
      await deleteGoal(initialData.id);
      await onDeleted?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível excluir a caixinha.');
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Editar caixinha' : 'Nova caixinha'}
      subtitle={isEdit ? undefined : 'Defina um objetivo e comece a guardar.'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitDisabled={!valid}
      submitting={submitting}
      onDelete={isEdit ? handleDelete : undefined}
    >
      <label className={styles.field}>
        <span className={styles.label}>Nome</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.input}
          placeholder="Ex: Viagem pra Bahia"
          maxLength={100}
          required
        />
      </label>

      <div className={styles.row}>
        <label className={`${styles.field} ${styles.grow}`}>
          <span className={styles.label}>Valor da meta</span>
          <input
            type="text"
            inputMode="numeric"
            value={formatBRL(targetNumber)}
            onChange={onTarget}
            className={styles.input}
            placeholder="R$ 0,00"
            required
          />
        </label>
        <label className={`${styles.field} ${styles.grow}`}>
          <span className={styles.label}>Prazo (opcional)</span>
          <input
            type="month"
            value={deadlineMonth}
            onChange={(e) => setDeadlineMonth(e.target.value)}
            className={styles.input}
          />
        </label>
      </div>

      {isEdit && (
        <label className={styles.field}>
          <span className={styles.label}>Valor guardado</span>
          <input
            type="text"
            inputMode="numeric"
            value={formatBRL(savedNumber)}
            onChange={onSavedAmount}
            className={styles.input}
            placeholder="R$ 0,00"
          />
          <span className={styles.hint}>Ajuste caso tenha adicionado um valor errado.</span>
        </label>
      )}

      <div className={styles.field}>
        <span className={styles.label}>Ícone</span>
        <div className={styles.iconGrid}>
          {GOAL_ICONS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              className={`${styles.iconButton} ${icon === key ? styles.iconButtonActive : ''}`}
              onClick={() => setIcon(key)}
              title={label}
              aria-label={label}
              aria-pressed={icon === key}
            >
              <Icon size={20} />
            </button>
          ))}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
    </Modal>
  );
}
