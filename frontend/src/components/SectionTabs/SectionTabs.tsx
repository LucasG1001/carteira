import { NavLink } from "react-router-dom";
import styles from "./SectionTabs.module.css";

export interface SectionTab {
  to: string;
  label: string;
  end?: boolean;
}

export function SectionTabs({ tabs }: { tabs: SectionTab[] }) {
  return (
    <nav className={styles.tabs}>
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabActive : ""}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
