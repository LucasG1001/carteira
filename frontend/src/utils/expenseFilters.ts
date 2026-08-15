import type { BackendExpenseEntry } from '../services/api';
import { isLocked, SEM_CLASSIFICACAO, SEM_DESTINO } from './expenseView';
import { normalizeText } from './text';

export const TIPO_LOCKED = 'Travado / parcelado';
export const TIPO_FREE = 'Escolha sua';
export const TIPO_OPTIONS = [TIPO_LOCKED, TIPO_FREE];

export type ExpenseFilterState = {
  tipo: string[];
  origem: string[];
  grupo: string[];
  destino: string[];
  classificacao: string[];
};

export type FilterGroup = keyof ExpenseFilterState;

export const EMPTY_FILTERS: ExpenseFilterState = {
  tipo: [],
  origem: [],
  grupo: [],
  destino: [],
  classificacao: [],
};

export function filterCount(state: ExpenseFilterState): number {
  return (
    state.tipo.length +
    state.origem.length +
    state.grupo.length +
    state.destino.length +
    state.classificacao.length
  );
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
    const haystack = [
      entry.description,
      entry.category,
      entry.destination,
      entry.classification,
      entry.place,
    ]
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

  if (state.grupo.length > 0 && !state.grupo.includes(entry.category)) {
    return false;
  }

  if (state.destino.length > 0 && !state.destino.includes(entry.destination ?? SEM_DESTINO)) {
    return false;
  }

  if (
    state.classificacao.length > 0 &&
    !state.classificacao.includes(entry.classification ?? SEM_CLASSIFICACAO)
  ) {
    return false;
  }

  return true;
}
