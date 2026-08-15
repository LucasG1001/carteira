import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation } from "react-router-dom";
import { Plus } from "lucide-react";
import { useQuickAdd } from "../../context/quickAddStore";
import { NAV_ITEMS, isNavItemActive, type NavItem } from "../AppNav/navItems";
import styles from "./MobileNav.module.css";

function NavFlyout({
  anchor,
  item,
  onClose,
}: {
  anchor: HTMLElement;
  item: NavItem;
  onClose: () => void;
}) {
  const [coords, setCoords] = useState({ bottom: 0, left: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const update = () => {
      const rect = anchor.getBoundingClientRect();
      setCoords({
        bottom: window.innerHeight - rect.top + 10,
        left: Math.min(
          Math.max(rect.left + rect.width / 2 - 110, 12),
          window.innerWidth - 232,
        ),
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchor]);

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
      style={{ bottom: coords.bottom, left: coords.left }}
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

export function MobileNav() {
  const { addHandler, triggerAdd } = useQuickAdd();
  const { pathname } = useLocation();
  const [open, setOpen] = useState<{ path: string; anchor: HTMLElement; at: string } | null>(
    null,
  );

  const fabIndex = Math.floor(NAV_ITEMS.length / 2);

  const activeFlyout = open && open.at === pathname ? open : null;
  const openItem = activeFlyout
    ? NAV_ITEMS.find((item) => item.path === activeFlyout.path)
    : null;

  return (
    <nav className={styles.nav}>
      {NAV_ITEMS.map((item, index) => {
        const ItemIcon = item.icon;
        const active = isNavItemActive(item, pathname);
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
              <span className={styles.navLabel}>{item.shortLabel ?? item.label}</span>
            </button>
          </Fragment>
        );
      })}

      {activeFlyout && openItem && (
        <NavFlyout
          anchor={activeFlyout.anchor}
          item={openItem}
          onClose={() => setOpen(null)}
        />
      )}
    </nav>
  );
}
