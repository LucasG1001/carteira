import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Search,
  Filter,
} from 'lucide-react';
import { ativos, type Ativo } from '../../data/mockData';
import styles from './AssetsTable.module.css';

type SortKey = keyof Ativo;
type SortDir = 'asc' | 'desc';
type FilterTipo = 'Todos' | Ativo['tipo'];

const TIPOS: FilterTipo[] = ['Todos', 'Ação', 'FII', 'ETF', 'Cripto', 'Renda Fixa'];

export function AssetsTable() {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('ticker');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filtroTipo, setFiltroTipo] = useState<FilterTipo>('Todos');

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

  const filteredAtivos = ativos
    .filter((a) => {
      if (filtroTipo !== 'Todos' && a.tipo !== filtroTipo) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          a.ticker.toLowerCase().includes(s) ||
          a.nome.toLowerCase().includes(s) ||
          a.setor.toLowerCase().includes(s)
        );
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
                placeholder="Buscar ativo..."
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
                onChange={(e) => setFiltroTipo(e.target.value as FilterTipo)}
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
                <th onClick={() => handleSort('nome')}>
                  <span className={styles.thContent}>Nome <SortIcon col="nome" /></span>
                </th>
                <th onClick={() => handleSort('tipo')}>
                  <span className={styles.thContent}>Tipo <SortIcon col="tipo" /></span>
                </th>
                <th onClick={() => handleSort('setor')}>
                  <span className={styles.thContent}>Setor <SortIcon col="setor" /></span>
                </th>
                <th onClick={() => handleSort('quantidade')}>
                  <span className={styles.thContent}>Qtd <SortIcon col="quantidade" /></span>
                </th>
                <th onClick={() => handleSort('precoMedio')}>
                  <span className={styles.thContent}>PM <SortIcon col="precoMedio" /></span>
                </th>
                <th onClick={() => handleSort('precoAtual')}>
                  <span className={styles.thContent}>Cotação <SortIcon col="precoAtual" /></span>
                </th>
                <th>Total Investido</th>
                <th>Valor Atual</th>
                <th onClick={() => handleSort('variacao24h')}>
                  <span className={styles.thContent}>Var. 24h <SortIcon col="variacao24h" /></span>
                </th>
                <th onClick={() => handleSort('variacao30d')}>
                  <span className={styles.thContent}>Var. 30d <SortIcon col="variacao30d" /></span>
                </th>
                <th onClick={() => handleSort('dividendoYield')}>
                  <span className={styles.thContent}>DY <SortIcon col="dividendoYield" /></span>
                </th>
                <th>L/P</th>
              </tr>
            </thead>
            <tbody>
              {filteredAtivos.map((ativo, i) => {
                const totalInvestido = ativo.precoMedio * ativo.quantidade;
                const valorAtual = ativo.precoAtual * ativo.quantidade;
                const lucro = valorAtual - totalInvestido;
                const lucroPerc =
                  totalInvestido > 0 ? ((lucro / totalInvestido) * 100) : 0;

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
                    <td className={styles.nomeCell}>{ativo.nome}</td>
                    <td>
                      <span className={`${styles.tipoBadge} ${styles[`tipo_${ativo.tipo.replace(/ /g, '')}`]}`}>
                        {ativo.tipo}
                      </span>
                    </td>
                    <td className={styles.setorCell}>{ativo.setor}</td>
                    <td className={styles.numCell}>
                      {ativo.quantidade.toLocaleString('pt-BR', {
                        minimumFractionDigits: ativo.quantidade < 1 ? 4 : 0,
                      })}
                    </td>
                    <td className={styles.numCell}>{fmt(ativo.precoMedio)}</td>
                    <td className={styles.numCell}>{fmt(ativo.precoAtual)}</td>
                    <td className={styles.numCell}>{fmt(totalInvestido)}</td>
                    <td className={`${styles.numCell} ${styles.bold}`}>{fmt(valorAtual)}</td>
                    <td>
                      <span
                        className={`${styles.varBadge} ${
                          ativo.variacao24h >= 0 ? styles.positive : styles.negative
                        }`}
                      >
                        {ativo.variacao24h >= 0 ? '+' : ''}
                        {ativo.variacao24h.toFixed(2)}%
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${styles.varBadge} ${
                          ativo.variacao30d >= 0 ? styles.positive : styles.negative
                        }`}
                      >
                        {ativo.variacao30d >= 0 ? '+' : ''}
                        {ativo.variacao30d.toFixed(2)}%
                      </span>
                    </td>
                    <td className={styles.numCell}>
                      {ativo.dividendoYield > 0
                        ? `${ativo.dividendoYield.toFixed(1)}%`
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
                          {lucroPerc.toFixed(1)}%
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
