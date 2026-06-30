import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { ChevronDown } from 'lucide-react';
import { Modal } from '../Modal/Modal';
import { createExpense } from '../../services/api';
import type { ExpenseEntryType, RecurrenceType } from '../../services/api';
import styles from './ExpenseForm.module.css';

const EXPENSE_CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Contas',
  'Saúde',
  'Lazer',
  'Educação',
  'Compras',
  'Outros',
];
const INCOME_CATEGORIES = ['Salário', 'Freelance', 'Investimentos', 'Presente', 'Outros'];
const PAYMENT_METHODS = ['Dinheiro', 'Pix', 'Débito', 'Crédito', 'Boleto', 'Transferência'];
const RECURRENCES: { value: RecurrenceType; label: string }[] = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'yearly', label: 'Anual' },
];

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function ExpenseForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => Promise<void> | void }) {
  const [type, setType] = useState<ExpenseEntryType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState(todayValue());
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [installments, setInstallments] = useState('1');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('monthly');
  const [place, setPlace] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');

  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const amountNumber = Number(amount);
  const installmentsNumber = Math.max(1, Number(installments) || 1);
  const valid = amountNumber > 0 && category.length > 0 && date.length > 0;

  const changeType = (next: ExpenseEntryType) => {
    setType(next);
    setCategory(next === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
  };

  const handleSubmit = async () => {
    if (!valid) return;
    setSubmitting(true);
    setError(null);
    try {
      await createExpense({
        type,
        amount: amountNumber,
        category,
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
      });
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o lançamento.');
      setSubmitting(false);
    }
  };

  const onAmount = (event: ChangeEvent<HTMLInputElement>) => setAmount(event.target.value);

  return (
    <Modal
      title="Novo lançamento"
      subtitle="Cadastro rápido — abra 'Mais opções' para detalhar."
      onClose={onClose}
      onSubmit={handleSubmit}
      submitDisabled={!valid}
      submitting={submitting}
    >
      <div className={styles.typeToggle}>
        <button
          type="button"
          className={`${styles.typeButton} ${type === 'expense' ? styles.typeExpense : ''}`}
          onClick={() => changeType('expense')}
        >
          Despesa
        </button>
        <button
          type="button"
          className={`${styles.typeButton} ${type === 'income' ? styles.typeIncome : ''}`}
          onClick={() => changeType('income')}
        >
          Receita
        </button>
      </div>

      <div className={styles.row}>
        <label className={`${styles.field} ${styles.grow}`}>
          <span className={styles.label}>Valor</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={onAmount}
            className={styles.input}
            placeholder="0,00"
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
        <span className={styles.label}>Descrição</span>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={styles.input}
          placeholder="Ex: Mercado, Aluguel, Salário..."
          maxLength={255}
        />
      </label>

      <div className={styles.row}>
        <label className={`${styles.field} ${styles.grow}`}>
          <span className={styles.label}>Categoria</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={styles.input}>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className={`${styles.field} ${styles.grow}`}>
          <span className={styles.label}>Forma de pagamento</span>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className={styles.input}
          >
            {PAYMENT_METHODS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

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
