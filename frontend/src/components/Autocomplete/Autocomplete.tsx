import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { KeyboardEvent } from 'react';
import { normalizeText } from '../../utils/text';
import styles from './Autocomplete.module.css';

const MAX_OPTIONS = 8;

export type AutocompleteOption = {
  value: string;
  hint?: string;
};

type ListCoords = { top: number; left: number; width: number };

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (value: string) => void;
  options: AutocompleteOption[];
  placeholder?: string;
  maxLength?: number;
  invalid?: boolean;
}

function filterOptions(options: AutocompleteOption[], term: string) {
  const normalized = normalizeText(term);
  if (!normalized) return options.slice(0, MAX_OPTIONS);

  const starts: AutocompleteOption[] = [];
  const contains: AutocompleteOption[] = [];

  for (const option of options) {
    const candidate = normalizeText(option.value);
    if (candidate === normalized) continue;
    if (candidate.startsWith(normalized)) {
      starts.push(option);
    } else if (candidate.includes(normalized)) {
      contains.push(option);
    }
  }

  return [...starts, ...contains].slice(0, MAX_OPTIONS);
}

export function Autocomplete({
  value,
  onChange,
  onSelect,
  options,
  placeholder,
  maxLength,
  invalid = false,
}: AutocompleteProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [coords, setCoords] = useState<ListCoords>({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const matches = useMemo(() => filterOptions(options, value), [options, value]);
  const visible = open && matches.length > 0;

  useLayoutEffect(() => {
    if (!visible) return;
    const updateCoords = () => {
      const rect = inputRef.current?.getBoundingClientRect();
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
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (inputRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [visible]);

  const activeIndex = highlight < matches.length ? highlight : 0;

  const pick = (option: AutocompleteOption) => {
    setOpen(false);
    onSelect(option.value);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!visible) {
      if (event.key === 'ArrowDown') setOpen(true);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlight((activeIndex + 1) % matches.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((activeIndex - 1 + matches.length) % matches.length);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      pick(matches[activeIndex]);
    }
  };

  return (
    <div className={styles.wrapper}>
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setHighlight(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
        className={`${styles.input} ${invalid ? styles.inputError : ''}`}
        placeholder={placeholder}
        maxLength={maxLength}
        role="combobox"
        aria-expanded={visible}
        aria-autocomplete="list"
        aria-controls={listId}
        aria-activedescendant={visible ? `${listId}-${activeIndex}` : undefined}
        autoComplete="off"
      />

      {visible &&
        createPortal(
          <ul
            id={listId}
            role="listbox"
            ref={listRef}
            className={styles.list}
            style={{ top: coords.top, left: coords.left, width: coords.width }}
          >
            {matches.map((option, index) => (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`${styles.option} ${index === activeIndex ? styles.optionActive : ''}`}
                  onMouseEnter={() => setHighlight(index)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    pick(option);
                  }}
                >
                  <span className={styles.optionLabel}>{option.value}</span>
                  {option.hint && <span className={styles.optionHint}>{option.hint}</span>}
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}
