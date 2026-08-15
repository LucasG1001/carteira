import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Modal } from '../Modal/Modal';
import { Autocomplete } from '../Autocomplete/Autocomplete';
import { ComboSelect } from '../ComboSelect/ComboSelect';
import { useExpenses } from '../../context/expensesStore';
import { createExpense, deleteExpense, updateExpense } from '../../services/api';
import type { BackendExpenseEntry, RecurrenceType } from '../../services/api';
import { centsFromInput, formatBRL } from '../../utils/formatting';
import { formatDate, todayAsInputValue } from '../../utils/date';
import { normalizeText } from '../../utils/text';
import {
  buildDescriptionSuggestions,
  buildPlaceSuggestions,
  distinctFieldValues,
} from '../../utils/expenseSuggestions';
import type { ExpenseSuggestion } from '../../utils/expenseSuggestions';
import styles from './ExpenseForm.module.css';

const CLASSIFICATIONS = ['Essencial', 'Lazer'];
const GROUPS = [
  'Condomínio',
  'Água',
  'Luz',
  'Gás',
  'Internet',
  'Manutenção',
  'Móveis',
  'Padaria',
  'Café',
  'Mercado',
  'Transporte Público',
  'Uber',
  'Manutenção Veículo',
  'Estacionamento',
  'Pedágio',
  'Financiamento',
  'Seguro Veículo',
  'Farmácia',
  'Consulta',
  'Academia',
  'Cinema',
  'Viagens',
  'Hobbies',
  'Barbearia/Salão',
  'Netflix',
  'Spotify',
  'IFood',
  'Show',
  'Cursos',
  'Livros',
  'Roupa',
  'Cuidados Pessoais',
  'Presente',
  'Pets',
];
const PAYMENT_METHODS = ['Dinheiro', 'Pix', 'Débito', 'Crédito', 'Boleto', 'Transferência'];
const RECURRENCES: { value: RecurrenceType; label: string }[] = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'yearly', label: 'Anual' },
];

function findSuggestion(suggestions: ExpenseSuggestion[], value: string) {
  const key = normalizeText(value);
  return suggestions.find((suggestion) => normalizeText(suggestion.label) === key);
}

interface ExpenseFormProps {
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  mode?: 'create' | 'edit';
  initialData?: BackendExpenseEntry;
  onDeleted?: () => Promise<void> | void;
}

export function ExpenseForm({ onClose, onSaved, mode = 'create', initialData, onDeleted }: ExpenseFormProps) {
  const { data } = useExpenses();

  const [amountCents, setAmountCents] = useState(initialData ? Math.round(initialData.amount * 100) : 0);
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [category, setCategory] = useState(initialData?.category ?? '');
  const [destination, setDestination] = useState(initialData?.destination ?? '');
  const [classification, setClassification] = useState(initialData?.classification ?? '');
  const [date, setDate] = useState(initialData?.date ?? todayAsInputValue());
  const [paymentMethod, setPaymentMethod] = useState(initialData?.payment_method ?? '');
  const [installments, setInstallments] = useState(initialData ? String(initialData.installments) : '1');
  const [isRecurring, setIsRecurring] = useState(initialData?.is_recurring ?? false);
  const [recurrence, setRecurrence] = useState<RecurrenceType>(
    (initialData?.recurrence as RecurrenceType) ?? 'monthly',
  );
  const [place, setPlace] = useState(initialData?.place ?? '');
  const [address, setAddress] = useState(initialData?.address ?? '');
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [tags, setTags] = useState(initialData?.tags ?? '');

  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entries = useMemo(() => data?.entries ?? [], [data]);

  const descriptionSuggestions = useMemo(() => buildDescriptionSuggestions(entries), [entries]);
  const placeSuggestions = useMemo(() => buildPlaceSuggestions(entries), [entries]);
  const categoryOptions = useMemo(
    () => distinctFieldValues(entries, 'category', GROUPS),
    [entries],
  );
  const destinationOptions = useMemo(
    () => distinctFieldValues(entries, 'destination', []),
    [entries],
  );
  const classificationOptions = useMemo(
    () => distinctFieldValues(entries, 'classification', CLASSIFICATIONS),
    [entries],
  );
  const paymentOptions = useMemo(
    () => distinctFieldValues(entries, 'payment_method', PAYMENT_METHODS),
    [entries],
  );

  const isEdit = mode === 'edit' && initialData != null;
  const amountNumber = amountCents / 100;
  const installmentsNumber = Math.max(1, Number(installments) || 1);

  const missing = {
    amount: amountNumber <= 0,
    date: date.length === 0,
    description: description.trim().length === 0,
    category: category.length === 0,
    destination: destination.length === 0,
    classification: classification.length === 0,
    paymentMethod: paymentMethod.length === 0,
    place: place.trim().length === 0,
    address: address.trim().length === 0,
  };
  const hasMissing = Object.values(missing).some(Boolean);
  const invalid = (field: keyof typeof missing) => attempted && missing[field];

  const applyDescriptionFill = (value: string) => {
    setDescription(value);
    const fill = findSuggestion(descriptionSuggestions, value)?.fill;
    if (!fill) return;
    if (fill.category) setCategory(fill.category);
    if (fill.destination) setDestination(fill.destination);
    if (fill.classification) setClassification(fill.classification);
    if (fill.paymentMethod) setPaymentMethod(fill.paymentMethod);
    if (fill.place) setPlace(fill.place);
    if (fill.address) setAddress(fill.address);
    if (fill.tags) setTags(fill.tags);
  };

  const applyPlaceFill = (value: string) => {
    setPlace(value);
    const fill = findSuggestion(placeSuggestions, value)?.fill;
    if (!fill) return;
    if (fill.address) setAddress(fill.address);
    if (fill.category && !category) setCategory(fill.category);
    if (fill.destination && !destination) setDestination(fill.destination);
    if (fill.classification && !classification) setClassification(fill.classification);
    if (fill.paymentMethod && !paymentMethod) setPaymentMethod(fill.paymentMethod);
  };

  const handleSubmit = async () => {
    if (hasMissing) {
      setAttempted(true);
      setError(null);
      return;
    }
    setSubmitting(true);
    setError(null);
    const payload = {
      type: 'expense' as const,
      amount: amountNumber,
      category,
      destination,
      classification,
      date,
      description: description.trim(),
      payment_method: paymentMethod,
      installments: installmentsNumber,
      is_recurring: isRecurring,
      recurrence: isRecurring ? recurrence : null,
      place: place.trim(),
      address: address.trim(),
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
    setAmountCents(centsFromInput(event.target.value));
  };

  const controlClass = (field: keyof typeof missing) =>
    `${styles.input} ${invalid(field) ? styles.inputError : ''}`;

  return (
    <Modal
      title={isEdit ? 'Editar lançamento' : 'Novo lançamento'}
      subtitle={isEdit ? undefined : 'Comece pela descrição — o resto vem do histórico.'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
      onDelete={isEdit ? handleDelete : undefined}
    >
      {attempted && hasMissing && (
        <div className={styles.error}>Preencha os campos obrigatórios destacados.</div>
      )}
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.row}>
        <label className={`${styles.field} ${styles.grow}`}>
          <span className={styles.label}>Valor *</span>
          <input
            type="text"
            inputMode="numeric"
            value={formatBRL(amountNumber)}
            onChange={onAmount}
            className={controlClass('amount')}
            placeholder="R$ 0,00"
          />
          {invalid('amount') && <span className={styles.fieldError}>Obrigatório</span>}
        </label>
        <label className={`${styles.field} ${styles.grow}`}>
          <span className={styles.label}>Data *</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={controlClass('date')}
          />
          {invalid('date') && <span className={styles.fieldError}>Obrigatório</span>}
        </label>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Descrição *</span>
        <Autocomplete
          value={description}
          onChange={setDescription}
          onSelect={applyDescriptionFill}
          options={descriptionSuggestions.map((item) => ({ value: item.label, hint: item.hint }))}
          placeholder="Ex: Mercado, Aluguel, Barbearia..."
          maxLength={255}
          invalid={invalid('description')}
        />
        {invalid('description') && <span className={styles.fieldError}>Obrigatório</span>}
      </div>

      <div className={styles.row}>
        <div className={`${styles.field} ${styles.grow}`}>
          <span className={styles.label}>Grupo *</span>
          <ComboSelect
            value={category}
            onChange={setCategory}
            options={categoryOptions}
            searchPlaceholder="Buscar ou criar..."
            emptyLabel="Digite para criar um novo"
            allowCreate
            maxLength={100}
            invalid={invalid('category')}
          />
          {invalid('category') && <span className={styles.fieldError}>Obrigatório</span>}
        </div>
        <div className={`${styles.field} ${styles.grow}`}>
          <span className={styles.label}>Destino *</span>
          <ComboSelect
            value={destination}
            onChange={setDestination}
            options={destinationOptions}
            searchPlaceholder="Buscar ou criar..."
            emptyLabel="Digite para criar um novo"
            allowCreate
            maxLength={50}
            invalid={invalid('destination')}
          />
          {invalid('destination') && <span className={styles.fieldError}>Obrigatório</span>}
        </div>
        <div className={`${styles.field} ${styles.grow}`}>
          <span className={styles.label}>Classificação *</span>
          <ComboSelect
            value={classification}
            onChange={setClassification}
            options={classificationOptions}
            searchPlaceholder="Buscar ou criar..."
            emptyLabel="Digite para criar uma nova"
            allowCreate
            maxLength={20}
            invalid={invalid('classification')}
          />
          {invalid('classification') && <span className={styles.fieldError}>Obrigatório</span>}
        </div>
      </div>

      <div className={styles.row}>
        <label className={`${styles.field} ${styles.grow}`}>
          <span className={styles.label}>Forma de pagamento *</span>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className={controlClass('paymentMethod')}
          >
            <option value="" disabled>
              Selecione...
            </option>
            {paymentOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          {invalid('paymentMethod') && <span className={styles.fieldError}>Obrigatório</span>}
        </label>
        <label className={`${styles.field} ${styles.grow}`}>
          <span className={styles.label}>
            Parcelas <span className={styles.optional}>(opcional)</span>
          </span>
          <input
            type="number"
            min="1"
            max="120"
            step="1"
            value={installments}
            onChange={(e) => setInstallments(e.target.value)}
            className={styles.input}
          />
          {installmentsNumber > 1 && amountNumber > 0 && (
            <span className={styles.hint}>
              {installmentsNumber}x de {formatBRL(amountNumber / installmentsNumber)}
            </span>
          )}
        </label>
      </div>

      <div className={styles.row}>
        <div className={`${styles.field} ${styles.grow}`}>
          <span className={styles.label}>Local / estabelecimento *</span>
          <Autocomplete
            value={place}
            onChange={setPlace}
            onSelect={applyPlaceFill}
            options={placeSuggestions.map((item) => ({ value: item.label, hint: item.hint }))}
            placeholder="Ex: Supermercado X"
            maxLength={150}
            invalid={invalid('place')}
          />
          {invalid('place') && <span className={styles.fieldError}>Obrigatório</span>}
        </div>
        <label className={`${styles.field} ${styles.grow}`}>
          <span className={styles.label}>Endereço *</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={controlClass('address')}
            placeholder="Ex: Av. Brasil, 900"
            maxLength={255}
          />
          {invalid('address') && <span className={styles.fieldError}>Obrigatório</span>}
        </label>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>
          Recorrência <span className={styles.optional}>(opcional)</span>
        </span>
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

      <label className={styles.field}>
        <span className={styles.label}>
          Tags <span className={styles.optional}>(separadas por vírgula, opcional)</span>
        </span>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className={styles.input}
          placeholder="trabalho, urgente"
          maxLength={255}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>
          Observações <span className={styles.optional}>(opcional)</span>
        </span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={`${styles.input} ${styles.textarea}`}
          rows={2}
        />
      </label>
    </Modal>
  );
}
