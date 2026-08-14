import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MonthYearPicker } from '../MonthYearPicker/MonthYearPicker';
import { MESES } from '../../utils/date';
import styles from './MonthStepper.module.css';

interface MonthStepperProps {
  year: number;
  month: number | null;
  onChange: (year: number, month: number | null) => void;
  markedKeys?: Set<string>;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function MonthStepper({ year, month, onChange, markedKeys }: MonthStepperProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const isCurrent = month === currentMonth && year === currentYear;
  const label = month ? `${MESES[month - 1].toLowerCase()} ${year}` : `ano de ${year}`;

  let subtitle: string;
  if (!month) {
    subtitle = 'ano inteiro';
  } else if (isCurrent) {
    subtitle = `dia ${now.getDate()} de ${daysInMonth(year, month)}`;
  } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
    subtitle = `fechado · ${daysInMonth(year, month)} dias`;
  } else {
    subtitle = `projetado · ${daysInMonth(year, month)} dias`;
  }

  const step = (delta: number) => {
    const base = month ?? currentMonth;
    const absolute = year * 12 + (base - 1) + delta;
    onChange(Math.floor(absolute / 12), (absolute % 12) + 1);
  };

  return (
    <div className={styles.stepper}>
      <button type="button" className={styles.arrow} onClick={() => step(-1)} title="Mês anterior">
        <ChevronLeft size={15} />
      </button>

      <MonthYearPicker
        year={year}
        month={month}
        markedKeys={markedKeys}
        align="right"
        onChange={onChange}
        trigger={
          <>
            <span className={styles.label}>{label}</span>
            <span className={styles.subtitle}>{subtitle}</span>
          </>
        }
      />

      <button type="button" className={styles.arrow} onClick={() => step(1)} title="Mês seguinte">
        <ChevronRight size={15} />
      </button>

      {!isCurrent && (
        <button
          type="button"
          className={styles.today}
          onClick={() => onChange(currentYear, currentMonth)}
        >
          hoje
        </button>
      )}
    </div>
  );
}
