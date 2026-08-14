import { normalizeText } from '../../utils/text';

export function filterOptions(options: string[], query: string): string[] {
  const term = normalizeText(query);
  if (!term) return options;
  const starts: string[] = [];
  const contains: string[] = [];
  for (const option of options) {
    const candidate = normalizeText(option);
    if (candidate.startsWith(term)) starts.push(option);
    else if (candidate.includes(term)) contains.push(option);
  }
  return [...starts, ...contains];
}

export function createTermFor(options: string[], query: string, allowCreate: boolean): string | null {
  const trimmed = query.trim();
  if (!allowCreate || trimmed.length === 0) return null;
  const term = normalizeText(trimmed);
  return options.some((option) => normalizeText(option) === term) ? null : trimmed;
}
