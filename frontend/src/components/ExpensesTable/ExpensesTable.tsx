import { Fragment, useState, type ReactNode } from 'react';
import { TrendingDown, TrendingUp, ArrowUpDown } from 'lucide-react';
import { useExpenses } from '../../context/expensesStore';
import { usePrivacy } from '../../context/privacyStore';
import type { BackendExpenseEntry } from '../../services/api';
import { ExpenseForm } from '../ExpenseForm/ExpenseForm';
import { MESES } from '../../utils/date';
import { monthContribution } from '../../utils/expenseView';
import { resolveExpenseIcon } from '../../utils/expenseIcons';
import { matchesFilters } from '../../utils/expenseFilters';
import type { ExpenseFilterState } from '../../utils/expenseFilters';
import styles from './ExpensesTable.module.css';

type SortKey = 'date' | 'amount';
type SortDir = 'asc' | 'desc';

const ALL_MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

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
  query: string;
  onQueryChange: (query: string) => void;
}

interface Row {
  entry: BackendExpenseEntry;
  amount: number;
}

interface DayGroup {
  date: string;
  total: number;
  rows: Row[];
}

function scopeAmount(entry: BackendExpenseEntry, year: number, month: number | null) {
  if (month) return monthContribution(entry, year, month);
  return ALL_MONTHS.reduce((sum, m) => sum + monthContribution(entry, year, m), 0);
}

function dayLabel(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(year, month - 1, day).getDay()];
  return `${weekday}, ${String(day).padStart(2, '0')} ${MESES[month - 1].slice(0, 3)} ${year}`;
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
  query,
  onQueryChange,
}: ExpensesTableProps) {
  const { data, refresh } = useExpenses();
  const { formatCurrency: fmt } = usePrivacy();
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

  const dateDir: SortDir = sortKey === 'date' ? sortDir : 'desc';

  const rows: Row[] = data.entries
    .filter((entry) => entry.type === 'expense')
    .map((entry) => ({ entry, amount: scopeAmount(entry, year, month) }))
    .filter(({ entry, amount }) => amount > 0 && matchesFilters(entry, filters, query))
    .sort((a, b) => {
      const byDate = a.entry.date.localeCompare(b.entry.date);
      if (byDate !== 0) return dateDir === 'asc' ? byDate : -byDate;
      if (sortKey === 'amount') {
        return sortDir === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
      return 0;
    });

  const groups = rows.reduce<DayGroup[]>((acc, row) => {
    const last = acc[acc.length - 1];
    if (last && last.date === row.entry.date) {
      last.rows.push(row);
      last.total += row.amount;
    } else {
      acc.push({ date: row.entry.date, total: row.amount, rows: [row] });
    }
    return acc;
  }, []);

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
      <header className={styles.header}>
        <div className={styles.headTop}>
          <span className={styles.kicker}>Lançamentos</span>
          <span className={styles.summary}>
            {rows.length} {rows.length === 1 ? 'lançamento' : 'lançamentos'} · {fmt(total)}
          </span>
        </div>

        <div className={styles.headMain}>
          {filter}

          <div className={styles.tools}>
            <input
              type="text"
              className={styles.search}
              placeholder="Buscar descrição…"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
            />

            <button type="button" className={styles.sortBtn} onClick={() => handleSort('date')}>
              Data {renderSortIcon('date')}
            </button>

            <button type="button" className={styles.sortBtn} onClick={() => handleSort('amount')}>
              Valor {renderSortIcon('amount')}
            </button>
          </div>
        </div>
      </header>

      <div className={styles.list}>
        {groups.map((group) => (
          <Fragment key={group.date}>
            <div className={styles.dayHeader}>
              <span className={styles.dayLabel}>{dayLabel(group.date)}</span>
              <span className={styles.dayRule} />
              <span className={styles.dayTotal}>{fmt(group.total)}</span>
            </div>

            {group.rows.map(({ entry, amount }) => {
              const Icon = resolveExpenseIcon(entry.category);
              const meta = [
                entry.category,
                entry.destination,
                entry.payment_method,
                installmentLabel(entry, year, month),
              ]
                .filter(Boolean)
                .join(' · ');

              return (
                <button
                  key={entry.id}
                  type="button"
                  className={styles.row}
                  onClick={() => setEditing(entry)}
                >
                  <span className={styles.icon}>
                    <Icon size={16} />
                  </span>
                  <span className={styles.main}>
                    <span className={styles.desc}>{entry.description || entry.category}</span>
                    <span className={styles.meta}>{meta}</span>
                  </span>
                  <span className={styles.value}>{fmt(amount)}</span>
                </button>
              );
            })}
          </Fragment>
        ))}

        {rows.length === 0 && <p className={styles.empty}>Nenhum lançamento com esse filtro.</p>}
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
