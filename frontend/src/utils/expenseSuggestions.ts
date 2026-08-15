import type { BackendExpenseEntry } from '../services/api';
import { normalizeText } from './text';

export type SuggestionFill = {
  category?: string;
  destination?: string;
  classification?: string;
  paymentMethod?: string;
  place?: string;
  address?: string;
  tags?: string;
};

export type ExpenseSuggestion = {
  label: string;
  hint: string;
  fill: SuggestionFill;
};

type Group = {
  label: string;
  count: number;
  entries: BackendExpenseEntry[];
};

type FieldName = 'category' | 'destination' | 'classification' | 'payment_method';

function expenseEntries(entries: BackendExpenseEntry[]): BackendExpenseEntry[] {
  return entries.filter((entry) => entry.type === 'expense');
}

function groupBy(
  entries: BackendExpenseEntry[],
  pick: (entry: BackendExpenseEntry) => string | null,
): Group[] {
  const groups = new Map<string, Group>();

  for (const entry of entries) {
    const raw = pick(entry)?.trim();
    if (!raw) continue;
    const key = normalizeText(raw);
    const group = groups.get(key);
    if (group) {
      group.count += 1;
      group.entries.push(entry);
    } else {
      groups.set(key, { label: raw, count: 1, entries: [entry] });
    }
  }

  for (const group of groups.values()) {
    group.entries.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
    group.label = (pick(group.entries[0]) ?? group.label).trim();
  }

  return [...groups.values()].sort(
    (a, b) => b.count - a.count || b.entries[0].date.localeCompare(a.entries[0].date),
  );
}

function latestValue(group: Group, pick: (entry: BackendExpenseEntry) => string | null) {
  for (const entry of group.entries) {
    const value = pick(entry)?.trim();
    if (value) return value;
  }
  return undefined;
}

function groupFill(group: Group): SuggestionFill {
  return {
    category: latestValue(group, (entry) => entry.category),
    destination: latestValue(group, (entry) => entry.destination),
    classification: latestValue(group, (entry) => entry.classification),
    paymentMethod: latestValue(group, (entry) => entry.payment_method),
    place: latestValue(group, (entry) => entry.place),
    address: latestValue(group, (entry) => entry.address),
    tags: latestValue(group, (entry) => entry.tags),
  };
}

function joinHint(parts: (string | undefined)[]) {
  return parts.filter(Boolean).join(' · ');
}

export function buildDescriptionSuggestions(entries: BackendExpenseEntry[]): ExpenseSuggestion[] {
  return groupBy(expenseEntries(entries), (entry) => entry.description).map((group) => {
    const fill = groupFill(group);
    return {
      label: group.label,
      hint: joinHint([fill.category, fill.destination, fill.paymentMethod]),
      fill,
    };
  });
}

export function buildPlaceSuggestions(entries: BackendExpenseEntry[]): ExpenseSuggestion[] {
  return groupBy(expenseEntries(entries), (entry) => entry.place).map((group) => {
    const fill = groupFill(group);
    return {
      label: group.label,
      hint: fill.address ?? '',
      fill,
    };
  });
}

export function distinctFieldValues(
  entries: BackendExpenseEntry[],
  field: FieldName,
  base: string[],
): string[] {
  const values = new Map<string, string>();

  for (const value of base) {
    values.set(normalizeText(value), value);
  }

  for (const entry of expenseEntries(entries)) {
    const raw = entry[field]?.trim();
    if (!raw) continue;
    const key = normalizeText(raw);
    if (!values.has(key)) values.set(key, raw);
  }

  return [...values.values()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}
