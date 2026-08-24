const MESES_ABREV = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

export const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function monthLabel(ym: string): string {
  const [year, month] = ym.split('-').map(Number);
  return `${MESES_ABREV[month - 1]}/${String(year).slice(2)}`;
}

export function formatDate(value: string): string {
  return value.split('-').reverse().join('/');
}

export function todayAsInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export function monthKey(absolute: number): string {
  const year = Math.floor(absolute / 12);
  const month = (absolute % 12) + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function currentAbsolute(): number {
  const now = new Date();
  return now.getFullYear() * 12 + now.getMonth();
}
