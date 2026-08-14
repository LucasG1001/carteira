import type { ReactNode } from 'react';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  center?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ center, actions }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.spacer} />
        {center && <div className={styles.center}>{center}</div>}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </header>
  );
}
