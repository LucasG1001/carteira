import { useMemo, useState } from "react";
import { Eye, EyeOff, Plus } from "lucide-react";
import { BigNumbers } from "../../components/BigNumbers/BigNumbers";
import type { BigNumberCardProps } from "../../components/BigNumbers/BigNumbers";
import { GoalCard } from "../../components/GoalCard/GoalCard";
import { GoalActions } from "../../components/GoalActions/GoalActions";
import { GoalForm } from "../../components/GoalForm/GoalForm";
import { GoalsProvider } from "../../context/GoalsContext";
import { useGoals } from "../../context/goalsStore";
import { usePrivacy } from "../../context/privacyStore";
import styles from "./GoalsPage.module.css";

function GoalsContent() {
  const { data, loading, error, refresh } = useGoals();
  const { hidden, toggle, formatCurrency: fmt } = usePrivacy();
  const [creating, setCreating] = useState(false);

  const totals = useMemo(() => {
    const goals = data ?? [];
    let totalSaved = 0;
    let totalRemaining = 0;
    let active = 0;
    for (const goal of goals) {
      const saved = goal.saved_amount ?? 0;
      const target = goal.target_amount ?? 0;
      totalSaved += saved;
      totalRemaining += Math.max(0, target - saved);
      if (saved < target) active += 1;
    }
    return { totalSaved, totalRemaining, active };
  }, [data]);

  const header = (
    <div className={styles.toolbar}>
      <span className={styles.heading}>Caixinhas</span>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.eyeButton}
          onClick={toggle}
          title={hidden ? "Mostrar valores" : "Ocultar valores"}
        >
          {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
          <span className={styles.eyeLabel}>{hidden ? "Mostrar valores" : "Ocultar valores"}</span>
        </button>
        <GoalActions />
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        {header}
        <div className={styles.state}>Carregando caixinhas...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        {header}
        <div className={`${styles.state} ${styles.error}`}>Erro ao carregar dados: {error.message}</div>
      </>
    );
  }

  const goals = data ?? [];

  const cards: BigNumberCardProps[] = [
    { label: "Total guardado", value: fmt(totals.totalSaved), details: [], accentClass: "green", delay: 80 },
    { label: "Metas ativas", value: String(totals.active), details: [], accentClass: "indigo", delay: 160 },
    { label: "Falta juntar", value: fmt(totals.totalRemaining), details: [], accentClass: "amber", delay: 240 },
  ];

  return (
    <>
      {header}
      <div className={styles.container}>
        <BigNumbers cards={cards} />

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
      </div>

      {creating && <GoalForm onClose={() => setCreating(false)} onSaved={refresh} />}
    </>
  );
}

export function GoalsPage() {
  return (
    <GoalsProvider>
      <GoalsContent />
    </GoalsProvider>
  );
}
