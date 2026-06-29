import { ExpensesIcon } from "../../components/Sidebar/Sidebar.icons";
import styles from "./ExpensesPage.module.css";

export function ExpensesPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <ExpensesIcon className={styles.icon} />
        </div>
        <h1 className={styles.title}>Controle de Gastos</h1>
        <span className={styles.badge}>Em breve</span>
        <p className={styles.description}>
          Esta área vai reunir o acompanhamento das suas despesas. Ainda estamos
          construindo — volte em breve.
        </p>
      </div>
    </div>
  );
}
