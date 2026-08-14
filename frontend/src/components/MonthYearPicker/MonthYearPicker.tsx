import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { MESES } from "../../utils/date";
import styles from "./MonthYearPicker.module.css";

type PopoverCoords = { top: number; left?: number; right?: number };

const MESES_CURTOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

interface MonthYearPickerProps {
  year: number;
  month: number | null;
  onChange: (year: number, month: number | null) => void;
  markedKeys?: Set<string>;
  align?: "left" | "right";
  trigger?: ReactNode;
}

export function MonthYearPicker({
  year,
  month,
  onChange,
  markedKeys,
  align = "left",
  trigger,
}: MonthYearPickerProps) {
  const [open, setOpen] = useState(false);
  const [browseYear, setBrowseYear] = useState(year);
  const [coords, setCoords] = useState<PopoverCoords>({ top: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const updateCoords = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next: PopoverCoords = { top: rect.bottom + 6 };
    if (align === "right") {
      next.right = window.innerWidth - rect.right;
    } else {
      next.left = rect.left;
    }
    setCoords(next);
  };

  useLayoutEffect(() => {
    if (!open) return;
    updateCoords();
    const onReposition = () => updateCoords();
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);
    return () => {
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
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
    <div className={styles.wrapper}>
      <button
        type="button"
        className={trigger ? styles.triggerBare : styles.trigger}
        onClick={toggle}
        ref={triggerRef}
      >
        {trigger ?? (
          <>
            <Calendar size={15} />
            <span>{label}</span>
          </>
        )}
      </button>

      {open &&
        createPortal(
          <div
            className={styles.popover}
            ref={popoverRef}
            style={{ top: coords.top, left: coords.left, right: coords.right }}
          >
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
          </div>,
          document.body,
        )}
    </div>
  );
}
