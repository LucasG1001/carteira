import { usePrivacy } from '../../context/privacyStore';
import { monthLabel } from '../../utils/date';
import type { Commitment } from '../../utils/expenseView';
import styles from './CommitmentsCard.module.css';

const RECURRENCE_LABEL: Record<string, string> = {
  monthly: 'mensal',
  weekly: 'semanal',
  yearly: 'anual',
};

interface CommitmentsCardProps {
  items: Commitment[];
}

function recurringNote(item: Commitment): string {
  const recurrence = RECURRENCE_LABEL[item.recurrence ?? 'monthly'] ?? 'mensal';
  const when = item.monthly > 0 ? 'desde' : 'cobra em';
  return `assinatura ${recurrence} · ${when} ${monthLabel(item.startKey)}`;
}

export function CommitmentsCard({ items }: CommitmentsCardProps) {
  const { formatCurrency: fmt } = usePrivacy();
  const total = items.reduce((sum, item) => sum + item.monthly, 0);

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <span className={styles.kicker}>Compromissos travados</span>
        {items.length > 0 && (
          <span className={styles.note}>
            {fmt(total)}/mês · {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>Nenhuma assinatura ou parcelamento ativo.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.item}>
              <div className={styles.row}>
                <span className={styles.name}>{item.name}</span>
                <span className={styles.value}>
                  {item.monthly > 0 ? fmt(item.monthly) : '—'}
                </span>
              </div>

              {item.kind === 'installment' && item.paid && item.installments && item.endKey ? (
                <>
                  <div className={styles.track}>
                    <div
                      className={styles.fill}
                      style={{ width: `${(item.paid / item.installments) * 100}%` }}
                    />
                  </div>
                  <span className={styles.note}>
                    parcela {item.paid}/{item.installments} · termina em {monthLabel(item.endKey)}
                  </span>
                </>
              ) : (
                <span className={styles.note}>{recurringNote(item)}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
