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

const TIPOS: FilterTipo[] = ['Todos', 'Acao', 'FII', 'ETF', 'Cripto', 'Renda Fixa', 'Outros'];

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
    .filter((asset) => {
      if (filtroTipo !== 'Todos' && asset.asset_type !== filtroTipo) return false;
      if (search) {
        const normalizedSearch = search.toLowerCase();
        return asset.ticker.toLowerCase().includes(normalizedSearch);
      }
      return true;
    })
    .sort((assetA, assetB) => {
      const valueA = assetA[sortKey];
      const valueB = assetB[sortKey];

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDir === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortDir === 'asc' ? valueA - valueB : valueB - valueA;
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
                onChange={(event) => setSearch(event.target.value)}
                className={styles.searchInput}
                id="search-ativos"
              />
            </div>
            <div className={styles.filterWrapper}>
              <Filter size={14} className={styles.filterIcon} />
              <select
                value={filtroTipo}
                onChange={(event) => setFiltroTipo(event.target.value)}
                className={styles.filterSelect}
                id="filter-tipo"
              >
                {TIPOS.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
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
                <th onClick={() => handleSort('profitability_value')}>
                  <span className={styles.thContent}>L/P <SortIcon col="profitability_value" /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAtivos.map((asset, index) => {
                const profitValue = asset.profitability_value;
                const profitPercent = asset.profitability_percent;

                return (
                  <tr
                    key={asset.ticker}
                    className={styles.row}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td>
                      <div className={styles.tickerCell}>
                        <span className={styles.tickerBadge}>{asset.ticker}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.tipoBadge} ${styles[`tipo_${asset.asset_type.replace(/ /g, '')}`]}`}>
                        {asset.asset_type}
                      </span>
                    </td>
                    <td className={styles.numCell}>
                      {asset.total_quantity.toLocaleString('pt-BR', {
                        minimumFractionDigits: asset.total_quantity < 1 ? 4 : 0,
                      })}
                    </td>
                    <td className={styles.numCell}>{fmt(asset.average_price)}</td>
                    <td className={styles.numCell}>{fmt(asset.current_price)}</td>
                    <td className={styles.numCell}>{fmt(asset.total_invested)}</td>
                    <td className={`${styles.numCell} ${styles.bold}`}>{fmt(asset.current_value)}</td>
                    <td>
                      <span
                        className={`${styles.varBadge} ${
                          asset.variation_percent >= 0 ? styles.positive : styles.negative
                        }`}
                      >
                        {asset.variation_percent >= 0 ? '+' : ''}
                        {asset.variation_percent.toFixed(2)}%
                      </span>
                    </td>
                    <td>
                      <div className={styles.lpCell}>
                        <span className={profitValue >= 0 ? styles.lpPositive : styles.lpNegative}>
                          {fmt(profitValue)}
                        </span>
                        <span
                          className={`${styles.lpPerc} ${
                            profitPercent >= 0 ? styles.positive : styles.negative
                          }`}
                        >
                          {profitPercent >= 0 ? '+' : ''}
                          {profitPercent.toFixed(2)}%
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
