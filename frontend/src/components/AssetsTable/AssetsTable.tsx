import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Search,
  Filter,
} from 'lucide-react';
import { usePortfolio } from '../../context/portfolioStore';
import { usePrivacy } from '../../context/privacyStore';
import type { BackendAssetSummary } from '../../services/api';
import styles from './AssetsTable.module.css';

type SortKey = keyof BackendAssetSummary;
type SortDir = 'asc' | 'desc';
type FilterTipo = 'Todos' | string;

const TIPOS: FilterTipo[] = ['Todos', 'Acao', 'FII', 'ETF', 'Cripto', 'Renda Fixa', 'Outros'];

export function AssetsTable() {
  const { data } = usePortfolio();
  const { formatCurrency: fmt } = usePrivacy();
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
                  <span className={styles.thContent}>Ticker {renderSortIcon('ticker')}</span>
                </th>
                <th onClick={() => handleSort('asset_type')}>
                  <span className={styles.thContent}>Tipo {renderSortIcon('asset_type')}</span>
                </th>
                <th onClick={() => handleSort('total_quantity')}>
                  <span className={styles.thContent}>Qtd {renderSortIcon('total_quantity')}</span>
                </th>
                <th onClick={() => handleSort('average_price')}>
                  <span className={styles.thContent}>PM {renderSortIcon('average_price')}</span>
                </th>
                <th onClick={() => handleSort('current_price')}>
                  <span className={styles.thContent}>Cotação {renderSortIcon('current_price')}</span>
                </th>
                <th onClick={() => handleSort('total_invested')}>
                  <span className={styles.thContent}>Total Investido {renderSortIcon('total_invested')}</span>
                </th>
                <th onClick={() => handleSort('current_value')}>
                  <span className={styles.thContent}>Valor Atual {renderSortIcon('current_value')}</span>
                </th>
                <th onClick={() => handleSort('total_dividends')}>
                  <span className={styles.thContent}>Proventos {renderSortIcon('total_dividends')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAtivos.map((asset, index) => {
                return (
                  <tr
                    key={asset.ticker}
                    className={styles.row}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td>
                      <div className={styles.tickerCell}>
                        <span className={styles.tickerBadge}>{asset.ticker}</span>
                        {asset.name && <span className={styles.tickerName}>{asset.name}</span>}
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
                    <td>
                      <div className={styles.lpCell}>
                        <span className={styles.bold}>{fmt(asset.current_value)}</span>
                        <span
                          className={`${styles.lpSub} ${
                            asset.variation_percent >= 0 ? styles.positive : styles.negative
                          }`}
                        >
                          <span>
                            {asset.variation_percent >= 0 ? '+' : ''}
                            {asset.variation_percent.toFixed(2)}%
                          </span>
                          <span className={styles.lpSubValue}>{fmt(asset.variation_value)}</span>
                        </span>
                      </div>
                    </td>
                    <td className={styles.numCell}>
                      <span className={asset.total_dividends > 0 ? styles.lpPositive : ''}>
                        {fmt(asset.total_dividends)}
                      </span>
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
