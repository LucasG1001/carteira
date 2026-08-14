import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation } from "react-router-dom";
import { Plus } from "lucide-react";
import { useQuickAdd } from "../../context/quickAddStore";
import { useIsMobile } from "../../hooks/useIsMobile";
import styles from "./Sidebar.module.css";
import {
  ChevronIcon,
  ExpensesIcon,
  InvestmentsIcon,
  LogoIcon,
} from "./Sidebar.icons";

interface NavChild {
  path: string;
  label: string;
  end?: boolean;
}

interface NavItem {
  path: string;
  label: string;
  shortLabel?: string;
  icon: ComponentType<{ className?: string }>;
  children: NavChild[];
}

const NAV_ITEMS: NavItem[] = [
  {
    path: "/investimentos",
    label: "Investimentos",
    icon: InvestmentsIcon,
    children: [
      { path: "/investimentos", label: "Carteira", end: true },
      { path: "/investimentos/proventos", label: "Proventos" },
      { path: "/investimentos/lancamentos", label: "Lançamentos" },
      { path: "/investimentos/imposto-de-renda", label: "Imposto de Renda" },
    ],
  },
  {
    path: "/gastos",
    label: "Controle de Gastos",
    shortLabel: "Gastos",
    icon: ExpensesIcon,
    children: [
      { path: "/gastos", label: "Gastos", end: true },
      { path: "/gastos/caixinhas", label: "Caixinhas" },
    ],
  },
];

type FlyoutCoords = { top?: number; bottom?: number; left: number };

function NavFlyout({
  anchor,
  item,
  placement,
  onClose,
}: {
  anchor: HTMLElement;
  item: NavItem;
  placement: "top" | "right";
  onClose: () => void;
}) {
  const [coords, setCoords] = useState<FlyoutCoords>({ left: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const update = () => {
      const rect = anchor.getBoundingClientRect();
      if (placement === "top") {
        setCoords({
          bottom: window.innerHeight - rect.top + 10,
          left: Math.min(
            Math.max(rect.left + rect.width / 2 - 110, 12),
            window.innerWidth - 232,
          ),
        });
      } else {
        setCoords({ top: rect.top, left: rect.right + 10 });
      }
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchor, placement]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (anchor.contains(target) || panelRef.current?.contains(target)) return;
      onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [anchor, onClose]);

  return createPortal(
    <div
      ref={panelRef}
      className={styles.flyout}
      style={{ top: coords.top, bottom: coords.bottom, left: coords.left }}
      role="menu"
    >
      <span className={styles.flyoutTitle}>{item.label}</span>
      {item.children.map((child) => (
        <NavLink
          key={child.path}
          to={child.path}
          end={child.end}
          role="menuitem"
          onClick={onClose}
          className={({ isActive }) =>
            `${styles.flyoutItem} ${isActive ? styles.flyoutItemActive : ""}`
          }
        >
          {child.label}
        </NavLink>
      ))}
    </div>,
    document.body,
  );
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { addHandler, triggerAdd } = useQuickAdd();
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState<{ path: string; anchor: HTMLElement; at: string } | null>(
    null,
  );

  const usesFlyout = collapsed || isMobile;
  const fabIndex = Math.floor(NAV_ITEMS.length / 2);

  const isSectionActive = (item: NavItem) =>
    pathname === item.path || pathname.startsWith(`${item.path}/`);

  const activeFlyout = open && open.at === pathname && usesFlyout ? open : null;
  const openItem = activeFlyout
    ? NAV_ITEMS.find((item) => item.path === activeFlyout.path)
    : null;

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
        {NAV_ITEMS.map((item, index) => {
          const ItemIcon = item.icon;
          const active = isSectionActive(item);
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

              {usesFlyout ? (
                <button
                  type="button"
                  title={item.label}
                  aria-haspopup="menu"
                  aria-expanded={activeFlyout?.path === item.path}
                  onClick={(event) => {
                    const anchor = event.currentTarget;
                    setOpen((current) =>
                      current?.path === item.path && current.at === pathname
                        ? null
                        : { path: item.path, anchor, at: pathname },
                    );
                  }}
                  className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                >
                  <ItemIcon className={styles.navIcon} />
                  <span className={styles.navLabel}>
                    {isMobile ? (item.shortLabel ?? item.label) : item.label}
                  </span>
                </button>
              ) : (
                <NavLink
                  to={item.path}
                  title={item.label}
                  className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                >
                  <ItemIcon className={styles.navIcon} />
                  <span className={styles.navLabel}>{item.label}</span>
                </NavLink>
              )}

              {!isMobile && active && (
                <div className={styles.subNav}>
                  {item.children.map((child) => (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      end={child.end}
                      tabIndex={collapsed ? -1 : undefined}
                      className={({ isActive }) =>
                        `${styles.subItem} ${isActive ? styles.subItemActive : ""}`
                      }
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </Fragment>
          );
        })}
      </nav>

      {activeFlyout && openItem && (
        <NavFlyout
          anchor={activeFlyout.anchor}
          item={openItem}
          placement={isMobile ? "top" : "right"}
          onClose={() => setOpen(null)}
        />
      )}
    </aside>
  );
}
