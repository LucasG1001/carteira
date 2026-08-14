import type { BackendExpenseEntry } from '../services/api';
import { isLocked } from './expenseView';
import { normalizeText } from './text';

export const TIPO_LOCKED = 'Travado / parcelado';
export const TIPO_FREE = 'Escolha sua';
export const TIPO_OPTIONS = [TIPO_LOCKED, TIPO_FREE];

export type ExpenseFilterState = {
  tipo: string[];
  origem: string[];
  sub: string[];
};

export type FilterGroup = keyof ExpenseFilterState;

export const EMPTY_FILTERS: ExpenseFilterState = { tipo: [], origem: [], sub: [] };

export function filterCount(state: ExpenseFilterState): number {
  return state.tipo.length + state.origem.length + state.sub.length;
}

export function toggleFilter(
  state: ExpenseFilterState,
  group: FilterGroup,
  value: string,
): ExpenseFilterState {
  const current = state[group];
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
  return { ...state, [group]: next };
}

export function matchesFilters(
  entry: BackendExpenseEntry,
  state: ExpenseFilterState,
  query: string,
): boolean {
  const term = normalizeText(query);
  if (term) {
    const haystack = [entry.description, entry.subcategory, entry.category, entry.place]
      .filter(Boolean)
      .map((value) => normalizeText(String(value)));
    if (!haystack.some((value) => value.includes(term))) return false;
  }

  if (state.tipo.length > 0) {
    const tipo = isLocked(entry) ? TIPO_LOCKED : TIPO_FREE;
    if (!state.tipo.includes(tipo)) return false;
  }

  if (state.origem.length > 0 && !state.origem.includes(entry.payment_method ?? 'Não informada')) {
    return false;
  }

  if (state.sub.length > 0 && !state.sub.includes(entry.subcategory ?? 'Outros')) {
    return false;
  }

  return true;
}
