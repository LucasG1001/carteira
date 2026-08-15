import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ProjectSwitcher } from '../AppNav/ProjectSwitcher';
import { LogoIcon } from '../AppNav/nav.icons';
import { findNavItem } from '../AppNav/navItems';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  center?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ center, actions }: PageHeaderProps) {
  const { pathname } = useLocation();
  const project = findNavItem(pathname);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.nav}>
          <span className={styles.brand}>
            <LogoIcon className={styles.brandMark} />
          </span>

          <ProjectSwitcher />

          <span className={styles.divider} />

          <nav className={styles.tabs}>
            {project.children.map((child) => (
              <NavLink
                key={child.path}
                to={child.path}
                end={child.end}
                className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabActive : ''}`}
              >
                {child.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className={styles.right}>
          {center && <div className={styles.center}>{center}</div>}
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      </div>
    </header>
  );
}
