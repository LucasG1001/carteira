import { useState } from "react";
import { Plus } from "lucide-react";
import { GoalCard } from "../../components/GoalCard/GoalCard";
import { GoalForm } from "../../components/GoalForm/GoalForm";
import { useGoals } from "../../context/goalsStore";
import styles from "./GoalsPage.module.css";

export function GoalsPage() {
  const { data, loading, error, refresh } = useGoals();
  const [creating, setCreating] = useState(false);

  if (loading) {
    return <div className={styles.state}>Carregando caixinhas...</div>;
  }

  if (error) {
    return <div className={`${styles.state} ${styles.error}`}>Erro ao carregar dados: {error.message}</div>;
  }

  const goals = data ?? [];

  return (
    <div className={styles.container}>
      {goals.length === 0 ? (
        <div className={styles.empty}>
          <p>Nenhuma caixinha ainda.</p>
          <button type="button" className={styles.newGoalButton} onClick={() => setCreating(true)}>
            <Plus size={18} />
            <span>Nova meta</span>
          </button>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onChanged={refresh} />
            ))}
          </div>
          <button type="button" className={styles.newGoalButton} onClick={() => setCreating(true)}>
            <Plus size={18} />
            <span>Nova meta</span>
          </button>
        </>
      )}

      {creating && <GoalForm onClose={() => setCreating(false)} onSaved={refresh} />}
    </div>
  );
}
