import type { ComponentType } from 'react';
import { ExpensesIcon, InvestmentsIcon } from './nav.icons';

export interface NavChild {
  path: string;
  label: string;
  end?: boolean;
}

export interface NavItem {
  path: string;
  label: string;
  shortLabel?: string;
  icon: ComponentType<{ className?: string }>;
  children: NavChild[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    path: '/investimentos',
    label: 'Investimentos',
    icon: InvestmentsIcon,
    children: [
      { path: '/investimentos', label: 'Carteira', end: true },
      { path: '/investimentos/proventos', label: 'Proventos' },
      { path: '/investimentos/lancamentos', label: 'Lançamentos' },
      { path: '/investimentos/imposto-de-renda', label: 'Imposto de Renda' },
    ],
  },
  {
    path: '/gastos',
    label: 'Controle de Gastos',
    shortLabel: 'Gastos',
    icon: ExpensesIcon,
    children: [
      { path: '/gastos', label: 'Gastos', end: true },
      { path: '/gastos/caixinhas', label: 'Caixinhas' },
    ],
  },
];

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}

export function findNavItem(pathname: string): NavItem {
  return NAV_ITEMS.find((item) => isNavItemActive(item, pathname)) ?? NAV_ITEMS[0];
}
