import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { MESES } from "../../utils/date";
import styles from "./MonthYearPicker.module.css";

const MESES_CURTOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

interface MonthYearPickerProps {
  year: number;
  month: number | null;
  onChange: (year: number, month: number | null) => void;
  markedKeys?: Set<string>;
}

export function MonthYearPicker({ year, month, onChange, markedKeys }: MonthYearPickerProps) {
  const [open, setOpen] = useState(false);
  const [browseYear, setBrowseYear] = useState(year);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const toggle = () => {
    setBrowseYear(year);
    setOpen((value) => !value);
  };

  const select = (nextMonth: number | null) => {
    onChange(browseYear, nextMonth);
    setOpen(false);
  };

  const label = month ? `${MESES[month - 1]} ${year}` : String(year);

  return (
    <div className={styles.wrapper} ref={ref}>
      <button type="button" className={styles.trigger} onClick={toggle}>
        <Calendar size={15} />
        <span>{label}</span>
      </button>

      {open && (
        <div className={styles.popover}>
          <div className={styles.yearNav}>
            <button type="button" className={styles.yearArrow} onClick={() => setBrowseYear((y) => y - 1)}>
              <ChevronLeft size={16} />
            </button>
            <span className={styles.yearLabel}>{browseYear}</span>
            <button type="button" className={styles.yearArrow} onClick={() => setBrowseYear((y) => y + 1)}>
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            type="button"
            className={`${styles.allYear} ${month === null && year === browseYear ? styles.active : ""}`}
            onClick={() => select(null)}
          >
            Ano inteiro
          </button>

          <div className={styles.monthGrid}>
            {MESES_CURTOS.map((label, index) => {
              const value = index + 1;
              const isActive = month === value && year === browseYear;
              const marked = markedKeys?.has(`${browseYear}-${String(value).padStart(2, "0")}`);
              return (
                <button
                  key={label}
                  type="button"
                  className={`${styles.month} ${isActive ? styles.active : ""}`}
                  onClick={() => select(value)}
                >
                  {label}
                  {marked && <span className={styles.marker} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
