import { useState, type ReactNode } from 'react';
import { ArrowUpDown, TrendingDown, TrendingUp } from 'lucide-react';
import { usePrivacy } from '../../context/privacyStore';
import { useDragScroll } from '../../hooks/useDragScroll';
import type { BackendDividend } from '../../services/api';
import { formatDate } from '../../utils/date';
import { matchesDividendFilters, paymentLabel } from '../../utils/dividendsView';
import type { DividendFilterState } from '../../utils/dividendsView';
import { assetTypeColor } from '../../utils/portfolioView';
import { DividendsFilters } from '../DividendsFilters/DividendsFilters';
import styles from './DividendsTable.module.css';

type SortKey = 'date' | 'value' | 'ticker';
type SortDir = 'asc' | 'desc';

interface DividendsTableProps {
  entries: BackendDividend[];
  year: number;
  month: number | null;
  filter?: ReactNode;
  filters: DividendFilterState;
  onFiltersChange: (state: DividendFilterState) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onClearAll: () => void;
  classeOptions: string[];
  tipoOptions: string[];
  ativoOptions: string[];
}

export function DividendsTable({
  entries,
  year,
  month,
  filter,
  filters,
  onFiltersChange,
  query,
  onQueryChange,
  onClearAll,
  classeOptions,
  tipoOptions,
  ativoOptions,
}: DividendsTableProps) {
  const { formatCurrency: fmt } = usePrivacy();
  const scrollRef = useDragScroll<HTMLDivElement>();
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortKey(key);
    setSortDir('asc');
  };

  const prefix = month ? `${year}-${String(month).padStart(2, '0')}` : String(year);
  const rows = entries
    .filter(
      (entry) => entry.date.startsWith(prefix) && matchesDividendFilters(entry, filters, query),
    )
    .sort((left, right) => {
      if (sortKey === 'value') {
        return sortDir === 'asc' ? left.value - right.value : right.value - left.value;
      }
      if (sortKey === 'ticker') {
        return sortDir === 'asc'
          ? left.ticker.localeCompare(right.ticker)
          : right.ticker.localeCompare(left.ticker);
      }
      return sortDir === 'asc'
        ? left.date.localeCompare(right.date)
        : right.date.localeCompare(left.date);
    });

  const total = rows.reduce((sum, entry) => sum + entry.value, 0);

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
        <span className={styles.kicker}>Proventos</span>

        <input
          type="text"
          className={styles.search}
          placeholder="Buscar ativo…"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />

        <DividendsFilters
          state={filters}
          onChange={onFiltersChange}
          onClearAll={onClearAll}
          classeOptions={classeOptions}
          tipoOptions={tipoOptions}
          ativoOptions={ativoOptions}
          hasQuery={query.length > 0}
        />

        <div className={styles.spacer} />

        <span className={styles.summary}>
          {rows.length} {rows.length === 1 ? 'provento' : 'proventos'} · {fmt(total)}
        </span>

        {filter}
      </div>

      <div className={styles.tableWrapper} ref={scrollRef}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thTicker}>
                <button type="button" className={styles.thButton} onClick={() => handleSort('ticker')}>
                  Ativo {renderSortIcon('ticker')}
                </button>
              </th>
              <th>
                <button type="button" className={styles.thButton} onClick={() => handleSort('date')}>
                  Data {renderSortIcon('date')}
                </button>
              </th>
              <th>Classe</th>
              <th>Tipo de pagamento</th>
              <th className={styles.thValue}>
                <button type="button" className={styles.thButton} onClick={() => handleSort('value')}>
                  Valor {renderSortIcon('value')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry, index) => (
              <tr key={`${entry.ticker}-${entry.date}-${entry.type}-${index}`} className={styles.row}>
                <td className={styles.cellTicker}>
                  <span className={styles.ticker}>{entry.ticker}</span>
                </td>
                <td>{formatDate(entry.date)}</td>
                <td>
                  <span className={styles.classe}>
                    <span
                      className={styles.swatch}
                      style={{ background: assetTypeColor(entry.asset_type) }}
                    />
                    {entry.asset_type}
                  </span>
                </td>
                <td title={entry.type}>{paymentLabel(entry.type)}</td>
                <td className={styles.cellValue}>{fmt(entry.value)}</td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  Nenhum provento com esse filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
