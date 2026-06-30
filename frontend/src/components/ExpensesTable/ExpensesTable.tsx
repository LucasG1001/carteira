import { useState } from 'react';
import { TrendingUp, TrendingDown, ArrowUpDown, ArrowUpCircle, ArrowDownCircle, Search, Filter, X } from 'lucide-react';
import { useExpenses } from '../../context/expensesStore';
import { usePrivacy } from '../../context/privacyStore';
import type { BackendExpenseEntry } from '../../services/api';
import { ExpenseForm } from '../ExpenseForm/ExpenseForm';
import { monthLabel } from '../../utils/date';
import styles from '../AssetsTable/AssetsTable.module.css';

type SortKey = 'date' | 'amount' | 'category';
type SortDir = 'asc' | 'desc';
type FilterType = 'Todos' | 'expense' | 'income';

export type TableFilter = { field: 'category' | 'subcategory' | 'month'; value: string } | null;

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'Todos', label: 'Todos' },
  { value: 'expense', label: 'Despesas' },
  { value: 'income', label: 'Receitas' },
];

function formatDate(value: string) {
  return value.split('-').reverse().join('/');
}

interface ExpensesTableProps {
  filter: TableFilter;
  onClearFilter: () => void;
}

export function ExpensesTable({ filter, onClearFilter }: ExpensesTableProps) {
  const { data, refresh } = useExpenses();
  const { formatCurrency: fmt } = usePrivacy();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterType, setFilterType] = useState<FilterType>('Todos');
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

  const entries = data.entries
    .filter((entry) => {
      if (filterType !== 'Todos' && entry.type !== filterType) return false;
      if (filter) {
        if (filter.field === 'category' && entry.category !== filter.value) return false;
        if (filter.field === 'subcategory' && (entry.subcategory || 'Outros') !== filter.value) return false;
        if (filter.field === 'month' && !entry.date.startsWith(filter.value)) return false;
      }
      if (search) {
        const term = search.toLowerCase();
        return (
          (entry.description || '').toLowerCase().includes(term) ||
          entry.category.toLowerCase().includes(term) ||
          (entry.subcategory || '').toLowerCase().includes(term)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortKey === 'category') {
        return sortDir === 'asc' ? a.category.localeCompare(b.category) : b.category.localeCompare(a.category);
      }
      if (sortKey === 'amount') {
        return sortDir === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
      return sortDir === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
    });

  const saldo = entries.reduce((acc, entry) => acc + (entry.type === 'income' ? entry.amount : -entry.amount), 0);

  const renderSortIcon = (col: SortKey) => {
    if (sortKey !== col) return <ArrowUpDown size={12} className={styles.sortIconInactive} />;
    return sortDir === 'asc' ? (
      <TrendingUp size={12} className={styles.sortIconActive} />
    ) : (
      <TrendingDown size={12} className={styles.sortIconActive} />
    );
  };

  return (
    <section className={styles.section}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>Detalhe das compras</h3>
            <span className={styles.count}>{entries.length}</span>
            <span className={styles.saldoNeutral}>{fmt(saldo)}</span>
            {filter && (
              <button type="button" className={styles.filterChip} onClick={onClearFilter}>
                {filter.field === 'category'
                  ? `Categoria: ${filter.value}`
                  : filter.field === 'subcategory'
                    ? `Subcategoria: ${filter.value}`
                    : `Mês: ${monthLabel(filter.value)}`}
                <X size={12} />
              </button>
            )}
          </div>

          <div className={styles.controls}>
            <div className={styles.searchWrapper}>
              <Search size={14} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className={styles.searchInput}
                id="search-gastos"
              />
            </div>
            <div className={styles.filterWrapper}>
              <Filter size={14} className={styles.filterIcon} />
              <select
                value={filterType}
                onChange={(event) => setFilterType(event.target.value as FilterType)}
                className={styles.filterSelect}
                id="filter-tipo-gasto"
              >
                {FILTERS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>
                  <span className={styles.thContent}>Descrição</span>
                </th>
                <th onClick={() => handleSort('date')}>
                  <span className={styles.thContent}>Data {renderSortIcon('date')}</span>
                </th>
                <th onClick={() => handleSort('amount')}>
                  <span className={styles.thContent}>Valor {renderSortIcon('amount')}</span>
                </th>
                <th>
                  <span className={styles.thContent}>Tipo</span>
                </th>
                <th onClick={() => handleSort('category')}>
                  <span className={styles.thContent}>Categoria {renderSortIcon('category')}</span>
                </th>
                <th>
                  <span className={styles.thContent}>Subcategoria</span>
                </th>
                <th>
                  <span className={styles.thContent}>Forma</span>
                </th>
                <th>
                  <span className={styles.thContent}>Parcelas</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr
                  key={entry.id}
                  className={`${styles.row} ${styles.clickableRow}`}
                  style={{ animationDelay: `${index * 30}ms` }}
                  onClick={() => setEditing(entry)}
                >
                  <td className={styles.descCell}>
                    <span className={styles.bold}>{entry.description || '—'}</span>
                  </td>
                  <td className={styles.numCell}>{formatDate(entry.date)}</td>
                  <td className={styles.numCell}>
                    <span className={entry.type === 'income' ? styles.positive : styles.negative}>
                      {entry.type === 'income' ? '+' : '-'}
                      {fmt(entry.amount)}
                    </span>
                  </td>
                  <td>
                    <span className={styles.typeIcon} title={entry.type === 'income' ? 'Receita' : 'Despesa'}>
                      {entry.type === 'income' ? (
                        <ArrowUpCircle size={18} className={styles.positive} aria-label="Receita" />
                      ) : (
                        <ArrowDownCircle size={18} className={styles.negative} aria-label="Despesa" />
                      )}
                    </span>
                  </td>
                  <td>{entry.type === 'income' ? '—' : entry.category}</td>
                  <td>{entry.type === 'income' ? '—' : entry.subcategory || 'Outros'}</td>
                  <td>{entry.payment_method || '—'}</td>
                  <td className={styles.numCell}>
                    {entry.is_recurring
                      ? 'Recorrente'
                      : entry.installments > 1
                        ? `${entry.installments}x`
                        : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {entries.length === 0 && (
          <div className={styles.empty}>
            <p>Nenhum lançamento encontrado</p>
          </div>
        )}
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
