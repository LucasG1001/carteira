import { useState } from 'react';
import { TrendingUp, TrendingDown, ArrowUpDown, Search, Filter, Trash2 } from 'lucide-react';
import { useExpenses } from '../../context/expensesStore';
import { usePrivacy } from '../../context/privacyStore';
import { deleteExpense } from '../../services/api';
import type { BackendExpenseEntry } from '../../services/api';
import styles from '../AssetsTable/AssetsTable.module.css';

type SortKey = 'date' | 'amount' | 'category';
type SortDir = 'asc' | 'desc';
type FilterType = 'Todos' | 'expense' | 'income';

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'Todos', label: 'Todos' },
  { value: 'expense', label: 'Despesas' },
  { value: 'income', label: 'Receitas' },
];

function formatDate(value: string) {
  return value.split('-').reverse().join('/');
}

export function ExpensesTable() {
  const { data, refresh } = useExpenses();
  const { formatCurrency: fmt } = usePrivacy();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterType, setFilterType] = useState<FilterType>('Todos');

  if (!data) return null;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleDelete = async (entry: BackendExpenseEntry) => {
    if (!window.confirm(`Excluir "${entry.description || entry.category}"?`)) return;
    await deleteExpense(entry.id);
    await refresh();
  };

  const entries = data.entries
    .filter((entry) => {
      if (filterType !== 'Todos' && entry.type !== filterType) return false;
      if (search) {
        const term = search.toLowerCase();
        return (
          (entry.description || '').toLowerCase().includes(term) ||
          entry.category.toLowerCase().includes(term)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortKey === 'category') {
        return sortDir === 'asc'
          ? a.category.localeCompare(b.category)
          : b.category.localeCompare(a.category);
      }
      if (sortKey === 'amount') {
        return sortDir === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
      return sortDir === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
    });

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
            <span className={styles.count}>{entries.length} lançamentos</span>
          </div>

          <div className={styles.controls}>
            <div className={styles.searchWrapper}>
              <Search size={14} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Buscar descrição..."
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
                <th onClick={() => handleSort('date')}>
                  <span className={styles.thContent}>Data {renderSortIcon('date')}</span>
                </th>
                <th>
                  <span className={styles.thContent}>Descrição</span>
                </th>
                <th onClick={() => handleSort('category')}>
                  <span className={styles.thContent}>Categoria {renderSortIcon('category')}</span>
                </th>
                <th>
                  <span className={styles.thContent}>Forma</span>
                </th>
                <th>
                  <span className={styles.thContent}>Parcelas</span>
                </th>
                <th>
                  <span className={styles.thContent}>Tipo</span>
                </th>
                <th onClick={() => handleSort('amount')}>
                  <span className={styles.thContent}>Valor {renderSortIcon('amount')}</span>
                </th>
                <th>
                  <span className={styles.thContent}>Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr key={entry.id} className={styles.row} style={{ animationDelay: `${index * 30}ms` }}>
                  <td className={styles.numCell}>{formatDate(entry.date)}</td>
                  <td>
                    <span className={styles.bold}>{entry.description || '—'}</span>
                  </td>
                  <td>{entry.category}</td>
                  <td>{entry.payment_method || '—'}</td>
                  <td className={styles.numCell}>
                    {entry.is_recurring
                      ? 'Recorrente'
                      : entry.installments > 1
                        ? `${entry.installments}x`
                        : '—'}
                  </td>
                  <td>
                    <span className={entry.type === 'income' ? styles.positive : styles.negative}>
                      {entry.type === 'income' ? 'Receita' : 'Despesa'}
                    </span>
                  </td>
                  <td className={styles.numCell}>
                    <span className={entry.type === 'income' ? styles.positive : styles.negative}>
                      {entry.type === 'income' ? '+' : '-'}
                      {fmt(entry.amount)}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => handleDelete(entry)}
                      aria-label="Excluir lançamento"
                    >
                      <Trash2 size={15} />
                    </button>
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
    </section>
  );
}
