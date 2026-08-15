import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronDown } from 'lucide-react';
import styles from './PeriodFilter.module.css';

export interface PeriodOption {
  value: string;
  label: string;
  badge?: string;
}

export interface PeriodGroup {
  title: string;
  options: PeriodOption[];
}

interface PeriodFilterProps {
  title?: string;
  groups: PeriodGroup[];
  value: string;
  onChange: (value: string) => void;
}

export function PeriodFilter({ title = 'Período', groups, value, onChange }: PeriodFilterProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCoords({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
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

  const selected = groups.flatMap((group) => group.options).find((option) => option.value === value);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Calendar size={14} className={styles.triggerIcon} />
        <span className={styles.triggerLabel}>{selected?.label ?? title}</span>
        <ChevronDown size={14} className={styles.chevron} />
      </button>

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            className={styles.popover}
            style={{ top: coords.top, right: coords.right }}
            role="listbox"
          >
            <span className={styles.title}>{title}</span>

            {groups.map((group) => (
              <div key={group.title} className={styles.group}>
                <span className={styles.groupTitle}>{group.title}</span>
                {group.options.map((option) => {
                  const active = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={`${styles.option} ${active ? styles.optionActive : ''}`}
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                    >
                      <span className={`${styles.radio} ${active ? styles.radioActive : ''}`} />
                      <span className={styles.optionLabel}>{option.label}</span>
                      {option.badge && <span className={styles.badge}>{option.badge}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
