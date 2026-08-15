import { useState, type ReactNode } from 'react';
import { ArrowUpDown, TrendingDown, TrendingUp } from 'lucide-react';
import { useExpenses } from '../../context/expensesStore';
import { usePrivacy } from '../../context/privacyStore';
import { useDragScroll } from '../../hooks/useDragScroll';
import type { BackendExpenseEntry } from '../../services/api';
import { ExpenseForm } from '../ExpenseForm/ExpenseForm';
import { ExpenseFilters } from '../ExpenseFilters/ExpenseFilters';
import { formatDate } from '../../utils/date';
import { isLocked, monthContribution } from '../../utils/expenseView';
import { matchesFilters } from '../../utils/expenseFilters';
import type { ExpenseFilterState } from '../../utils/expenseFilters';
import styles from './ExpensesTable.module.css';

type SortKey = 'date' | 'amount' | 'grupo' | 'destino';
type SortDir = 'asc' | 'desc';

const ALL_MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

const RECURRENCE_LABEL: Record<string, string> = {
  monthly: 'mensal',
  weekly: 'semanal',
  yearly: 'anual',
};

interface ExpensesTableProps {
  year: number;
  month: number | null;
  filter?: ReactNode;
  filters: ExpenseFilterState;
  onFiltersChange: (state: ExpenseFilterState) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onClearAll: () => void;
  origemOptions: string[];
  grupoOptions: string[];
  destinoOptions: string[];
  classificacaoOptions: string[];
}

function scopeAmount(entry: BackendExpenseEntry, year: number, month: number | null) {
  if (month) return monthContribution(entry, year, month);
  return ALL_MONTHS.reduce((sum, m) => sum + monthContribution(entry, year, m), 0);
}

function installmentLabel(entry: BackendExpenseEntry, year: number, month: number | null) {
  if (entry.is_recurring) {
    return `recorrente · ${RECURRENCE_LABEL[entry.recurrence ?? 'monthly'] ?? 'mensal'}`;
  }
  const total = entry.installments || 1;
  if (total <= 1) return 'à vista';
  if (!month) return `${total}x`;
  const [startYear, startMonth] = entry.date.split('-').map(Number);
  const current = (year - startYear) * 12 + (month - startMonth) + 1;
  return `${Math.min(Math.max(current, 1), total)} de ${total}`;
}

export function ExpensesTable({
  year,
  month,
  filter,
  filters,
  onFiltersChange,
  query,
  onQueryChange,
  onClearAll,
  origemOptions,
  grupoOptions,
  destinoOptions,
  classificacaoOptions,
}: ExpensesTableProps) {
  const { data, refresh } = useExpenses();
  const { formatCurrency: fmt } = usePrivacy();
  const scrollRef = useDragScroll<HTMLDivElement>();
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [editing, setEditing] = useState<BackendExpenseEntry | null>(null);

  if (!data) return null;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const rows = data.entries
    .filter((entry) => entry.type === 'expense')
    .map((entry) => ({ entry, amount: scopeAmount(entry, year, month) }))
    .filter(({ entry, amount }) => amount > 0 && matchesFilters(entry, filters, query))
    .sort((a, b) => {
      if (sortKey === 'grupo' || sortKey === 'destino') {
        const pick = (entry: BackendExpenseEntry) =>
          (sortKey === 'grupo' ? entry.category : entry.destination) ?? '';
        const left = pick(a.entry);
        const right = pick(b.entry);
        return sortDir === 'asc' ? left.localeCompare(right) : right.localeCompare(left);
      }
      if (sortKey === 'amount') {
        return sortDir === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
      return sortDir === 'asc'
        ? a.entry.date.localeCompare(b.entry.date)
        : b.entry.date.localeCompare(a.entry.date);
    });

  const total = rows.reduce((sum, row) => sum + row.amount, 0);

  const renderSortIcon = (column: SortKey) => {
    if (sortKey !== column) return <ArrowUpDown size={11} className={styles.sortIdle} />;
    return sortDir === 'asc' ? (
      <TrendingUp size={11} className={styles.sortActive} />
    ) : (
      <TrendingDown size={11} className={styles.sortActive} />
    );
  };

  return (
    <section className={styles.card}>
      <div className={styles.toolbar}>
        <span className={styles.kicker}>Lançamentos</span>

        <input
          type="text"
          className={styles.search}
          placeholder="Buscar descrição…"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />

        <ExpenseFilters
          state={filters}
          onChange={onFiltersChange}
          onClearAll={onClearAll}
          origemOptions={origemOptions}
          grupoOptions={grupoOptions}
          destinoOptions={destinoOptions}
          classificacaoOptions={classificacaoOptions}
          hasQuery={query.length > 0}
        />

        <div className={styles.spacer} />

        <span className={styles.summary}>
          {rows.length} {rows.length === 1 ? 'lançamento' : 'lançamentos'} · {fmt(total)}
        </span>

        {filter}
      </div>

      <div className={styles.tableWrapper} ref={scrollRef}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thDesc}>Descrição</th>
              <th>
                <button type="button" className={styles.thButton} onClick={() => handleSort('date')}>
                  Data {renderSortIcon('date')}
                </button>
              </th>
              <th>
                <button type="button" className={styles.thButton} onClick={() => handleSort('grupo')}>
                  Grupo {renderSortIcon('grupo')}
                </button>
              </th>
              <th>
                <button type="button" className={styles.thButton} onClick={() => handleSort('destino')}>
                  Destino {renderSortIcon('destino')}
                </button>
              </th>
              <th>Forma</th>
              <th>Parcela</th>
              <th className={styles.thValue}>
                <button
                  type="button"
                  className={styles.thButton}
                  onClick={() => handleSort('amount')}
                >
                  Valor {renderSortIcon('amount')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ entry, amount }) => (
              <tr key={entry.id} className={styles.row} onClick={() => setEditing(entry)}>
                <td className={styles.cellDesc}>
                  <span className={styles.desc}>{entry.description || '—'}</span>
                  <span className={isLocked(entry) ? styles.tagLocked : styles.tagFree}>
                    {isLocked(entry) ? 'travado' : 'escolha sua'}
                  </span>
                </td>
                <td>{formatDate(entry.date).slice(0, 5)}</td>
                <td>{entry.category}</td>
                <td>{entry.destination || '—'}</td>
                <td>{entry.payment_method || '—'}</td>
                <td>{installmentLabel(entry, year, month)}</td>
                <td className={styles.cellValue}>{fmt(amount)}</td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.empty}>
                  Nenhum lançamento com esse filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <ExpenseForm
          mode="edit"
          initialData={editing}
          onClose={() => setEditing(null)}
          onSaved={refresh}
          onDeleted={refresh}
        />
      )}
    </section>
  );
}
