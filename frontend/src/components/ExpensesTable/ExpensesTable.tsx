import { useState } from 'react';
import { TrendingUp, TrendingDown, ArrowUpDown, Search, X } from 'lucide-react';
import { useExpenses } from '../../context/expensesStore';
import { usePrivacy } from '../../context/privacyStore';
import { useDragScroll } from '../../hooks/useDragScroll';
import type { BackendExpenseEntry } from '../../services/api';
import { ExpenseForm } from '../ExpenseForm/ExpenseForm';
import styles from '../AssetsTable/AssetsTable.module.css';

type SortKey = 'date' | 'amount' | 'category';
type SortDir = 'asc' | 'desc';

export type TableFilter = { field: 'category' | 'subcategory'; value: string } | null;

function formatDate(value: string) {
  return value.split('-').reverse().join('/');
}

interface ExpensesTableProps {
  filter: TableFilter;
  onClearFilter: () => void;
  year: number;
  month: number | null;
}

export function ExpensesTable({ filter, onClearFilter, year, month }: ExpensesTableProps) {
  const { data, refresh } = useExpenses();
  const { formatCurrency: fmt } = usePrivacy();
  const scrollRef = useDragScroll<HTMLDivElement>();
  const [search, setSearch] = useState('');
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

  const scopePrefix = month ? `${year}-${String(month).padStart(2, '0')}` : String(year);

  const entries = data.entries
    .filter((entry) => {
      if (entry.type !== 'expense') return false;
      if (!entry.date.startsWith(scopePrefix)) return false;
      if (filter) {
        if (filter.field === 'category' && entry.category !== filter.value) return false;
        if (filter.field === 'subcategory' && (entry.subcategory || 'Outros') !== filter.value) return false;
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

  const total = entries.reduce((acc, entry) => acc + entry.amount, 0);

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
            <span className={styles.saldoNeutral}>{fmt(total)}</span>
            {filter && (
              <button type="button" className={styles.filterChip} onClick={onClearFilter}>
                {filter.field === 'category'
                  ? `Categoria: ${filter.value}`
                  : `Subcategoria: ${filter.value}`}
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
          </div>
        </div>

        <div className={styles.tableWrapper} ref={scrollRef}>
          <table className={`${styles.table} ${styles.compact}`}>
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
                    <span className={styles.negative}>-{fmt(entry.amount)}</span>
                  </td>
                  <td>{entry.category}</td>
                  <td>{entry.subcategory || 'Outros'}</td>
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
