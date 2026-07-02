import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { ChevronDown } from 'lucide-react';
import { Modal } from '../Modal/Modal';
import { createExpense, deleteExpense, updateExpense } from '../../services/api';
import type { BackendExpenseEntry, RecurrenceType } from '../../services/api';
import { formatBRL } from '../../utils/formatting';
import { formatDate, todayAsInputValue } from '../../utils/date';
import styles from './ExpenseForm.module.css';

const CATEGORIES = ['Essenciais', 'Lazer'];
const SUBCATEGORIES = [
  'Moradia',
  'Alimentação',
  'Transporte',
  'Saúde',
  'Educação',
  'Compras',
  'Serviços',
  'Finanças',
  'Pets',
  'Outros',
];
const PAYMENT_METHODS = ['Dinheiro', 'Pix', 'Débito', 'Crédito', 'Boleto', 'Transferência'];
const RECURRENCES: { value: RecurrenceType; label: string }[] = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'yearly', label: 'Anual' },
];

interface ExpenseFormProps {
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  mode?: 'create' | 'edit';
  initialData?: BackendExpenseEntry;
  onDeleted?: () => Promise<void> | void;
}

export function ExpenseForm({ onClose, onSaved, mode = 'create', initialData, onDeleted }: ExpenseFormProps) {
  const [amountCents, setAmountCents] = useState(initialData ? Math.round(initialData.amount * 100) : 0);
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [category, setCategory] = useState(
    initialData && CATEGORIES.includes(initialData.category) ? initialData.category : CATEGORIES[0],
  );
  const [subcategory, setSubcategory] = useState(initialData?.subcategory ?? 'Outros');
  const [date, setDate] = useState(initialData?.date ?? todayAsInputValue());
  const [paymentMethod, setPaymentMethod] = useState(initialData?.payment_method ?? 'Pix');
  const [installments, setInstallments] = useState(initialData ? String(initialData.installments) : '1');
  const [isRecurring, setIsRecurring] = useState(initialData?.is_recurring ?? false);
  const [recurrence, setRecurrence] = useState<RecurrenceType>(
    (initialData?.recurrence as RecurrenceType) ?? 'monthly',
  );
  const [place, setPlace] = useState(initialData?.place ?? '');
  const [address, setAddress] = useState(initialData?.address ?? '');
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [tags, setTags] = useState(initialData?.tags ?? '');

  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = mode === 'edit' && initialData != null;
  const amountNumber = amountCents / 100;
  const installmentsNumber = Math.max(1, Number(installments) || 1);
  const valid = amountNumber > 0 && date.length > 0 && description.trim().length > 0;

  const handleSubmit = async () => {
    if (!valid) return;
    setSubmitting(true);
    setError(null);
    const payload = {
      type: 'expense' as const,
      amount: amountNumber,
      category,
      subcategory,
      date,
      description: description.trim() || null,
      payment_method: paymentMethod || null,
      installments: installmentsNumber,
      is_recurring: isRecurring,
      recurrence: isRecurring ? recurrence : null,
      place: place.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
      tags: tags.trim() || null,
    };
    try {
      if (isEdit) {
        await updateExpense(initialData.id, payload);
      } else {
        await createExpense(payload);
      }
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o lançamento.');
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    const deleteLabel = initialData.description || initialData.category;
    if (!window.confirm(`Excluir "${deleteLabel}" de ${formatBRL(initialData.amount)} em ${formatDate(initialData.date)}?`)) return;
    setSubmitting(true);
    try {
      await deleteExpense(initialData.id);
      await onDeleted?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível excluir o lançamento.');
      setSubmitting(false);
    }
  };

  const onAmount = (event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, '');
    setAmountCents(digits ? parseInt(digits, 10) : 0);
  };

  return (
    <Modal
      title={isEdit ? 'Editar lançamento' : 'Novo lançamento'}
      subtitle={isEdit ? undefined : "Cadastro rápido — abra 'Mais opções' para detalhar."}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitDisabled={!valid}
      submitting={submitting}
      onDelete={isEdit ? handleDelete : undefined}
    >
      <div className={styles.row}>
        <label className={`${styles.field} ${styles.grow}`}>
          <span className={styles.label}>Valor</span>
          <input
            type="text"
            inputMode="numeric"
            value={formatBRL(amountNumber)}
            onChange={onAmount}
            className={styles.input}
            placeholder="R$ 0,00"
            required
          />
        </label>
        <label className={`${styles.field} ${styles.grow}`}>
          <span className={styles.label}>Data</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={styles.input}
            required
          />
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Descrição *</span>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={styles.input}
          placeholder="Ex: Mercado, Aluguel, Salário..."
          maxLength={255}
          required
        />
      </label>

      <div className={styles.row}>
        <label className={`${styles.field} ${styles.grow}`}>
          <span className={styles.label}>Categoria</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={styles.input}>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className={`${styles.field} ${styles.grow}`}>
          <span className={styles.label}>Subcategoria</span>
          <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className={styles.input}>
            {SUBCATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Forma de pagamento</span>
        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={styles.input}>
          {PAYMENT_METHODS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className={styles.expander}
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <ChevronDown size={16} className={expanded ? styles.expanderOpen : styles.expanderIcon} />
        {expanded ? 'Menos opções' : 'Mais opções'}
      </button>

      {expanded && (
        <div className={styles.advanced}>
          <div className={styles.row}>
            <label className={`${styles.field} ${styles.grow}`}>
              <span className={styles.label}>Parcelas</span>
              <input
                type="number"
                min="1"
                max="120"
                step="1"
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                className={styles.input}
              />
            </label>
            <div className={`${styles.field} ${styles.grow}`}>
              <span className={styles.label}>Recorrência</span>
              <div className={styles.recurRow}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                  />
                  <span>Recorrente</span>
                </label>
                {isRecurring && (
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                    className={styles.input}
                  >
                    {RECURRENCES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {installmentsNumber > 1 && amountNumber > 0 && (
            <p className={styles.hint}>
              {installmentsNumber}x de {formatBRL(amountNumber / installmentsNumber)}
            </p>
          )}

          <div className={styles.row}>
            <label className={`${styles.field} ${styles.grow}`}>
              <span className={styles.label}>Local / estabelecimento</span>
              <input
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                className={styles.input}
                placeholder="Ex: Supermercado X"
                maxLength={150}
              />
            </label>
            <label className={`${styles.field} ${styles.grow}`}>
              <span className={styles.label}>Endereço</span>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={styles.input}
                maxLength={255}
              />
            </label>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Observações</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${styles.input} ${styles.textarea}`}
              rows={2}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Tags (separadas por vírgula)</span>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className={styles.input}
              placeholder="trabalho, urgente"
              maxLength={255}
            />
          </label>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}
    </Modal>
  );
}
