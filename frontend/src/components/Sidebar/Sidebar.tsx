import type { ComponentType } from "react";
import { NavLink } from "react-router-dom";
import styles from "./Sidebar.module.css";
import {
  ChevronIcon,
  ExpensesIcon,
  InvestmentsIcon,
  LogoIcon,
} from "./Sidebar.icons";

interface NavItem {
  path: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: "/investimentos", label: "Investimentos", icon: InvestmentsIcon },
  { path: "/gastos", label: "Controle de Gastos", icon: ExpensesIcon, badge: "Em breve" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <LogoIcon className={styles.logoMark} />
        </div>
        <span className={styles.logoText}>Carteira</span>
        <button
          type="button"
          className={styles.toggle}
          onClick={onToggle}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          <ChevronIcon className={styles.toggleIcon} />
        </button>
      </div>

      <nav className={styles.nav}>
        <span className={styles.navSection}>Carteira</span>
        {NAV_ITEMS.map((item) => {
          const ItemIcon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.label}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
              }
            >
              <ItemIcon className={styles.navIcon} />
              <span className={styles.navLabel}>{item.label}</span>
              {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
