import { useEffect, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { useExpenses } from '../../context/expensesStore';
import { useQuickAdd } from '../../context/quickAddStore';
import { ExpenseForm } from '../ExpenseForm/ExpenseForm';
import styles from './ExpenseActions.module.css';

export function ExpenseActions() {
  const { refresh } = useExpenses();
  const { registerAdd } = useQuickAdd();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    registerAdd(() => setOpen(true));
    return () => registerAdd(null);
  }, [registerAdd]);

  return (
    <>
      <button type="button" className={styles.openButton} onClick={() => setOpen(true)}>
        <PlusCircle size={16} />
        <span>Adicionar lançamento</span>
      </button>

      {open && <ExpenseForm onClose={() => setOpen(false)} onSaved={refresh} />}
    </>
  );
}
