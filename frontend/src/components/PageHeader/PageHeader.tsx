import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import styles from './PageHeader.module.css';

export type HeaderTab = {
  to: string;
  label: string;
  end?: boolean;
};

interface PageHeaderProps {
  tabs: HeaderTab[];
  center?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ tabs, center, actions }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={`${styles.inner} ${center ? '' : styles.innerSingleRow}`}>
        <nav className={styles.tabs}>
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabActive : ''}`}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.spacer} />

        {center && <div className={styles.center}>{center}</div>}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </header>
  );
}
