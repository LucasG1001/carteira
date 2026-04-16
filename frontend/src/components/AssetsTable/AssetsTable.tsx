import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Search,
  Filter,
} from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import type { BackendAssetSummary } from '../../services/api';
import styles from './AssetsTable.module.css';

type SortKey = keyof BackendAssetSummary;
type SortDir = 'asc' | 'desc';
type FilterTipo = 'Todos' | string;

const TIPOS: FilterTipo[] = ['Todos', 'Ação', 'FII', 'ETF', 'Cripto', 'Renda Fixa', 'Outros'];

export function AssetsTable() {
  const { data } = usePortfolio();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('ticker');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filtroTipo, setFiltroTipo] = useState<FilterTipo>('Todos');

  if (!data) return null;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const filteredAtivos = data.assets
    .filter((a) => {
      if (filtroTipo !== 'Todos' && a.asset_type !== filtroTipo) return false;
      if (search) {
        const s = search.toLowerCase();
        return a.ticker.toLowerCase().includes(s);
      }
      return true;
    })
    .sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

  const SortIcon = ({ col }: { col: SortKey }) => {
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
            <h3 className={styles.title}>Detalhamento de Ativos</h3>
            <span className={styles.count}>{filteredAtivos.length} ativos</span>
          </div>

          <div className={styles.controls}>
            <div className={styles.searchWrapper}>
              <Search size={14} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Buscar ticker..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
                id="search-ativos"
              />
            </div>
            <div className={styles.filterWrapper}>
              <Filter size={14} className={styles.filterIcon} />
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className={styles.filterSelect}
                id="filter-tipo"
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
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
                <th onClick={() => handleSort('ticker')}>
                  <span className={styles.thContent}>Ticker <SortIcon col="ticker" /></span>
                </th>
                <th onClick={() => handleSort('asset_type')}>
                  <span className={styles.thContent}>Tipo <SortIcon col="asset_type" /></span>
                </th>
                <th onClick={() => handleSort('total_quantity')}>
                  <span className={styles.thContent}>Qtd <SortIcon col="total_quantity" /></span>
                </th>
                <th onClick={() => handleSort('average_price')}>
                  <span className={styles.thContent}>PM <SortIcon col="average_price" /></span>
                </th>
                <th onClick={() => handleSort('current_price')}>
                  <span className={styles.thContent}>Cotação <SortIcon col="current_price" /></span>
                </th>
                <th onClick={() => handleSort('total_invested')}>
                  <span className={styles.thContent}>Total Investido <SortIcon col="total_invested" /></span>
                </th>
                <th onClick={() => handleSort('current_value')}>
                  <span className={styles.thContent}>Valor Atual <SortIcon col="current_value" /></span>
                </th>
                <th onClick={() => handleSort('variation_percent')}>
                  <span className={styles.thContent}>Var. Total <SortIcon col="variation_percent" /></span>
                </th>
                <th onClick={() => handleSort('dividend_yield_percent')}>
                  <span className={styles.thContent}>DY <SortIcon col="dividend_yield_percent" /></span>
                </th>
                <th onClick={() => handleSort('profitability_value')}>
                  <span className={styles.thContent}>L/P <SortIcon col="profitability_value" /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAtivos.map((ativo, i) => {
                const lucro = ativo.profitability_value;
                const lucroPerc = ativo.profitability_percent;

                return (
                  <tr
                    key={ativo.ticker}
                    className={styles.row}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <td>
                      <div className={styles.tickerCell}>
                        <span className={styles.tickerBadge}>{ativo.ticker}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.tipoBadge} ${styles[`tipo_${ativo.asset_type.replace(/ /g, '')}`]}`}>
                        {ativo.asset_type}
                      </span>
                    </td>
                    <td className={styles.numCell}>
                      {ativo.total_quantity.toLocaleString('pt-BR', {
                        minimumFractionDigits: ativo.total_quantity < 1 ? 4 : 0,
                      })}
                    </td>
                    <td className={styles.numCell}>{fmt(ativo.average_price)}</td>
                    <td className={styles.numCell}>{fmt(ativo.current_price)}</td>
                    <td className={styles.numCell}>{fmt(ativo.total_invested)}</td>
                    <td className={`${styles.numCell} ${styles.bold}`}>{fmt(ativo.current_value)}</td>
                    <td>
                      <span
                        className={`${styles.varBadge} ${
                          ativo.variation_percent >= 0 ? styles.positive : styles.negative
                        }`}
                      >
                        {ativo.variation_percent >= 0 ? '+' : ''}
                        {ativo.variation_percent.toFixed(2)}%
                      </span>
                    </td>
                    <td className={styles.numCell}>
                      {ativo.dividend_yield_percent > 0
                        ? `${ativo.dividend_yield_percent.toFixed(2)}%`
                        : '—'}
                    </td>
                    <td>
                      <div className={styles.lpCell}>
                        <span
                          className={lucro >= 0 ? styles.lpPositive : styles.lpNegative}
                        >
                          {fmt(lucro)}
                        </span>
                        <span
                          className={`${styles.lpPerc} ${
                            lucroPerc >= 0 ? styles.positive : styles.negative
                          }`}
                        >
                          {lucroPerc >= 0 ? '+' : ''}
                          {lucroPerc.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredAtivos.length === 0 && (
          <div className={styles.empty}>
            <p>Nenhum ativo encontrado</p>
          </div>
        )}
      </div>
    </section>
  );
}
