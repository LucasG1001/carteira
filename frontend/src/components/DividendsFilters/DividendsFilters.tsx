import { useEffect, useRef, useState } from 'react';
import { Check, Filter, X } from 'lucide-react';
import { dividendFilterCount, toggleDividendFilter } from '../../utils/dividendsView';
import type { DividendFilterGroup, DividendFilterState } from '../../utils/dividendsView';
import styles from './DividendsFilters.module.css';

interface DividendsFiltersProps {
  state: DividendFilterState;
  onChange: (state: DividendFilterState) => void;
  onClearAll: () => void;
  classeOptions: string[];
  tipoOptions: string[];
  ativoOptions: string[];
  hasQuery: boolean;
}

export function DividendsFilters({
  state,
  onChange,
  onClearAll,
  classeOptions,
  tipoOptions,
  ativoOptions,
  hasQuery,
}: DividendsFiltersProps) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const count = dividendFilterCount(state);
  const hasAny = count > 0 || hasQuery;

  const toggle = () => {
    if (!open) {
      const rect = wrapperRef.current?.getBoundingClientRect();
      setDropUp(rect ? window.innerHeight - rect.bottom < 380 : false);
    }
    setOpen((value) => !value);
  };

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (event: MouseEvent) => {
      if (wrapperRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const groups: { key: DividendFilterGroup; label: string; options: string[] }[] = [
    { key: 'classe', label: 'Classe', options: classeOptions },
    { key: 'tipo', label: 'Tipo de pagamento', options: tipoOptions },
    { key: 'ativo', label: 'Ativo', options: ativoOptions },
  ];

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={`${styles.trigger} ${count > 0 ? styles.triggerActive : ''}`}
        onClick={toggle}
        aria-expanded={open}
      >
        <Filter size={14} />
        <span>Filtros</span>
        {count > 0 && <span className={styles.badge}>{count}</span>}
      </button>

      {open && (
        <div className={`${styles.panel} ${dropUp ? styles.panelUp : ''}`}>
          <div className={styles.panelHeader}>
            <button
              type="button"
              className={hasAny ? styles.clearActive : styles.clear}
              onClick={() => onClearAll()}
              disabled={!hasAny}
            >
              Limpar tudo
            </button>
            <button
              type="button"
              className={styles.close}
              onClick={() => setOpen(false)}
              aria-label="Fechar filtros"
            >
              <X size={14} />
            </button>
          </div>

          {groups.map((group) => (
            <div key={group.key} className={styles.group}>
              <span className={styles.groupLabel}>{group.label}</span>
              {group.options.length === 0 ? (
                <span className={styles.groupEmpty}>Nada neste período</span>
              ) : (
                <div className={styles.options}>
                  {group.options.map((option) => {
                    const active = state[group.key].includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        className={`${styles.option} ${active ? styles.optionActive : ''}`}
                        onClick={() => onChange(toggleDividendFilter(state, group.key, option))}
                        aria-pressed={active}
                      >
                        <span className={`${styles.box} ${active ? styles.boxActive : ''}`}>
                          {active && <Check size={9} strokeWidth={3} />}
                        </span>
                        <span className={styles.optionLabel}>{option}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
