import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { KeyboardEvent } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { createTermFor, filterOptions } from './comboOptions';
import styles from './ComboSelect.module.css';

type PanelCoords = { top: number; left: number; width: number };

interface ComboSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  allowCreate?: boolean;
  maxLength?: number;
  invalid?: boolean;
}

export function ComboSelect({
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  searchPlaceholder = 'Buscar ou criar...',
  emptyLabel = 'Nenhum resultado',
  allowCreate = false,
  maxLength,
  invalid = false,
}: ComboSelectProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const [coords, setCoords] = useState<PanelCoords>({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => filterOptions(options, query), [options, query]);
  const createTerm = createTermFor(options, query, allowCreate);

  const rowCount = matches.length + (createTerm ? 1 : 0);
  const activeIndex = highlight < rowCount ? highlight : 0;
  const createIndex = createTerm ? rowCount - 1 : -1;

  useLayoutEffect(() => {
    if (!open) return;
    const updateCoords = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCoords({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    };
    updateCoords();
    window.addEventListener('scroll', updateCoords, true);
    window.addEventListener('resize', updateCoords);
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery('');
    setHighlight(0);
  };

  const commit = (next: string) => {
    onChange(next);
    close();
  };

  const toggle = () => {
    if (open) {
      close();
      return;
    }
    setQuery('');
    setHighlight(0);
    setOpen(true);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      triggerRef.current?.focus();
      return;
    }
    if (event.key === 'ArrowDown' && rowCount > 0) {
      event.preventDefault();
      setHighlight((activeIndex + 1) % rowCount);
      return;
    }
    if (event.key === 'ArrowUp' && rowCount > 0) {
      event.preventDefault();
      setHighlight((activeIndex - 1 + rowCount) % rowCount);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (rowCount === 0) return;
      if (activeIndex === createIndex && createTerm) commit(createTerm);
      else commit(matches[activeIndex]);
    }
  };

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        ref={triggerRef}
        onClick={toggle}
        className={`${styles.trigger} ${invalid ? styles.triggerError : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={value ? styles.value : styles.placeholder}>{value || placeholder}</span>
        <ChevronDown size={16} className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            className={styles.panel}
            style={{ top: coords.top, left: coords.left, width: coords.width }}
          >
            <input
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setHighlight(0);
              }}
              onKeyDown={onKeyDown}
              className={styles.search}
              placeholder={searchPlaceholder}
              maxLength={maxLength}
              role="combobox"
              aria-expanded
              aria-autocomplete="list"
              aria-controls={listId}
              aria-activedescendant={rowCount > 0 ? `${listId}-${activeIndex}` : undefined}
            />

            <ul id={listId} role="listbox" className={styles.list}>
              {matches.map((option, index) => (
                <li key={option} role="presentation">
                  <button
                    type="button"
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={option === value}
                    className={`${styles.option} ${index === activeIndex ? styles.optionActive : ''} ${
                      option === value ? styles.optionSelected : ''
                    }`}
                    onMouseEnter={() => setHighlight(index)}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      commit(option);
                    }}
                  >
                    {option}
                  </button>
                </li>
              ))}

              {createTerm && (
                <li role="presentation">
                  <button
                    type="button"
                    id={`${listId}-${createIndex}`}
                    role="option"
                    aria-selected={false}
                    className={`${styles.option} ${styles.optionCreate} ${
                      createIndex === activeIndex ? styles.optionActive : ''
                    }`}
                    onMouseEnter={() => setHighlight(createIndex)}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      commit(createTerm);
                    }}
                  >
                    <Plus size={14} />
                    <span>
                      Criar “{createTerm}” <span className={styles.enterTip}>Enter</span>
                    </span>
                  </button>
                </li>
              )}

              {rowCount === 0 && <li className={styles.empty}>{emptyLabel}</li>}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}
