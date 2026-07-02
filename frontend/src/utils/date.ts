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
