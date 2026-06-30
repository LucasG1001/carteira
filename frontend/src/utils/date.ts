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

export function monthLabel(ym: string): string {
  const [year, month] = ym.split('-').map(Number);
  return `${MESES_ABREV[month - 1]}/${String(year).slice(2)}`;
}
