import { TrendingUp, Bell, Settings, User } from 'lucide-react';
import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <div className={styles.logoWrapper}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.brandText}>
            <h1 className={styles.title}>Carteira</h1>
            <span className={styles.subtitle}>Investimentos</span>
          </div>
        </div>

        <nav className={styles.nav}>
          <span className={styles.navItemActive}>Dashboard</span>
          <span className={styles.navItem}>Ativos</span>
          <span className={styles.navItem}>Dividendos</span>
          <span className={styles.navItem}>Rentabilidade</span>
        </nav>

        <div className={styles.actions}>
          <button className={styles.iconBtn} aria-label="Notificações">
            <Bell size={18} />
            <span className={styles.badge}>3</span>
          </button>
          <button className={styles.iconBtn} aria-label="Configurações">
            <Settings size={18} />
          </button>
          <div className={styles.avatar}>
            <User size={18} />
          </div>
        </div>
      </div>
    </header>
  );
}
