import { Fragment, type ComponentType } from "react";
import { NavLink } from "react-router-dom";
import { Plus } from "lucide-react";
import { useQuickAdd } from "../../context/quickAddStore";
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
  const { addHandler, triggerAdd } = useQuickAdd();
  const fabIndex = Math.floor(NAV_ITEMS.length / 2);

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
        {NAV_ITEMS.map((item, index) => {
          const ItemIcon = item.icon;
          return (
            <Fragment key={item.path}>
              {index === fabIndex && addHandler && (
                <button
                  type="button"
                  className={styles.fab}
                  onClick={triggerAdd}
                  aria-label="Adicionar"
                  title="Adicionar"
                >
                  <Plus className={styles.fabIcon} />
                </button>
              )}
              <NavLink
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
            </Fragment>
          );
        })}
      </nav>
    </aside>
  );
}
