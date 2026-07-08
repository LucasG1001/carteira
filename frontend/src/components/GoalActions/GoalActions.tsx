import { useEffect, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { useGoals } from '../../context/goalsStore';
import { useQuickAdd } from '../../context/quickAddStore';
import { GoalForm } from '../GoalForm/GoalForm';
import styles from './GoalActions.module.css';

export function GoalActions() {
  const { refresh } = useGoals();
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
        <span>Nova meta</span>
      </button>

      {open && <GoalForm onClose={() => setOpen(false)} onSaved={refresh} />}
    </>
  );
}
