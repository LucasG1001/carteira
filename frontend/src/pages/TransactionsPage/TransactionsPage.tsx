import { useEffect, useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { Modal } from "../../components/Modal/Modal";
import { MonthYearPicker } from "../../components/MonthYearPicker/MonthYearPicker";
import { useDragScroll } from "../../hooks/useDragScroll";
import { usePrivacy } from "../../context/privacyStore";
import { deleteTransaction, getTransactions, updateTransaction } from "../../services/api";
import type { BackendTransaction } from "../../services/api";
import tableStyles from "../../components/AssetsTable/AssetsTable.module.css";
import styles from "./TransactionsPage.module.css";

type Origem = "todos" | "b3" | "manual";

const FILTERS: { value: Origem; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "b3", label: "B3" },
  { value: "manual", label: "Manual" },
];

function formatDate(value: string) {
  return value.split("-").reverse().join("/");
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatQty(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 8 });
}

function centsFromInput(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

interface EditState {
  id: number;
  ticker: string;
  operation_type: "Compra" | "Venda";
  date: string;
  quantity: string;
  unitPriceCents: number;
  otherCostsCents: number;
}

function toEditState(transaction: BackendTransaction): EditState {
  return {
    id: transaction.id,
    ticker: transaction.ticker,
    operation_type: transaction.operation_type === "Venda" ? "Venda" : "Compra",
    date: transaction.date,
    quantity: String(transaction.quantity),
    unitPriceCents: Math.round((transaction.unit_price ?? 0) * 100),
    otherCostsCents: Math.round((transaction.other_costs ?? 0) * 100),
  };
}

export function TransactionsPage() {
  const { formatCurrency: fmt } = usePrivacy();
  const scrollRef = useDragScroll<HTMLDivElement>();
  const [data, setData] = useState<BackendTransaction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [origem, setOrigem] = useState<Origem>("todos");
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState<number | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    return getTransactions()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err : new Error("Erro")));
  };

  useEffect(() => {
    let active = true;
    getTransactions()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err : new Error("Erro"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const rows = useMemo(() => {
    const scopePrefix = pickerMonth ? `${pickerYear}-${String(pickerMonth).padStart(2, "0")}` : String(pickerYear);
    return (data ?? []).filter(
      (entry) => entry.date.startsWith(scopePrefix) && (origem === "todos" || entry.source === origem),
    );
  }, [data, origem, pickerYear, pickerMonth]);

  if (loading) {
    return <div className={styles.state}>Carregando lançamentos...</div>;
  }

  if (error) {
    return <div className={`${styles.state} ${styles.error}`}>Erro ao carregar dados: {error.message}</div>;
  }

  const unitPrice = edit ? edit.unitPriceCents / 100 : 0;
  const otherCosts = edit ? edit.otherCostsCents / 100 : 0;
  const quantityNumber = edit ? Number(edit.quantity) || 0 : 0;
  const editTotal = quantityNumber * unitPrice + otherCosts;

  const handleSave = async () => {
    if (!edit) return;
    setSubmitting(true);
    try {
      await updateTransaction(edit.id, {
        operation_type: edit.operation_type,
        date: edit.date,
        quantity: quantityNumber,
        unit_price: unitPrice,
        other_costs: otherCosts,
      });
      await load();
      setEdit(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!edit) return;
    if (!window.confirm(`Excluir o lançamento de ${edit.ticker}?`)) return;
    setSubmitting(true);
    try {
      await deleteTransaction(edit.id);
      await load();
      setEdit(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <section className={tableStyles.section}>
        <div className={tableStyles.card}>
          <div className={tableStyles.cardHeader}>
            <div className={tableStyles.titleRow}>
              <h3 className={tableStyles.title}>Lançamentos</h3>
              <span className={tableStyles.count}>{rows.length}</span>
            </div>
            <div className={tableStyles.controls}>
              <div className={styles.segmented}>
                {FILTERS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`${styles.segment} ${origem === item.value ? styles.segmentActive : ""}`}
                    onClick={() => setOrigem(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <MonthYearPicker
                year={pickerYear}
                month={pickerMonth}
                align="right"
                onChange={(year, month) => {
                  setPickerYear(year);
                  setPickerMonth(month);
                }}
              />
            </div>
          </div>

          <div className={tableStyles.tableWrapper} ref={scrollRef}>
            <table className={`${tableStyles.table} ${tableStyles.compact}`}>
              <thead>
                <tr>
                  <th><span className={tableStyles.thContent}>Ativo</span></th>
                  <th><span className={tableStyles.thContent}>Tipo de ativo</span></th>
                  <th><span className={tableStyles.thContent}>Tipo de ordem</span></th>
                  <th><span className={tableStyles.thContent}>Data</span></th>
                  <th><span className={tableStyles.thContent}>Qtd</span></th>
                  <th><span className={tableStyles.thContent}>Preço</span></th>
                  <th><span className={tableStyles.thContent}>Total</span></th>
                  <th><span className={tableStyles.thContent}>Origem</span></th>
                  <th><span className={tableStyles.thContent}>Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((transaction, index) => (
                  <tr
                    key={transaction.id}
                    className={`${tableStyles.row} ${transaction.source === "manual" ? tableStyles.clickableRow : ""}`}
                    style={{ animationDelay: `${index * 15}ms` }}
                    onClick={transaction.source === "manual" ? () => setEdit(toEditState(transaction)) : undefined}
                  >
                    <td>
                      <div className={tableStyles.tickerCell}>
                        <span className={tableStyles.tickerBadge}>{transaction.ticker}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`${tableStyles.tipoBadge} ${tableStyles[`tipo_${transaction.asset_type.replace(/ /g, "")}`]}`}>
                        {transaction.asset_type}
                      </span>
                    </td>
                    <td>{transaction.operation_type}</td>
                    <td className={tableStyles.numCell}>{formatDate(transaction.date)}</td>
                    <td className={tableStyles.numCell}>{formatQty(transaction.quantity)}</td>
                    <td className={tableStyles.numCell}>{transaction.unit_price != null ? fmt(transaction.unit_price) : "—"}</td>
                    <td className={tableStyles.numCell}>{transaction.operation_value != null ? fmt(transaction.operation_value) : "—"}</td>
                    <td>
                      <span className={`${styles.badge} ${transaction.source === "manual" ? styles.badgeManual : styles.badgeB3}`}>
                        {transaction.source === "manual" ? "Manual" : "B3"}
                      </span>
                    </td>
                    <td>
                      {transaction.source === "manual" ? (
                        <button
                          type="button"
                          className={styles.editButton}
                          onClick={(event) => {
                            event.stopPropagation();
                            setEdit(toEditState(transaction));
                          }}
                        >
                          <Pencil size={14} />
                        </button>
                      ) : (
                        <span className={styles.readonlyTag}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rows.length === 0 && (
            <div className={tableStyles.empty}>
              <p>Nenhum lançamento encontrado</p>
            </div>
          )}
        </div>
      </section>

      {edit && (
        <Modal
          title="Editar lançamento"
          subtitle={`${edit.ticker} · lançamento manual`}
          onClose={() => setEdit(null)}
          onSubmit={handleSave}
          submitting={submitting}
          submitDisabled={quantityNumber <= 0 || unitPrice <= 0}
          onDelete={handleDelete}
        >
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Operação</span>
              <select
                value={edit.operation_type}
                onChange={(event) => setEdit({ ...edit, operation_type: event.target.value as "Compra" | "Venda" })}
                className={styles.input}
              >
                <option value="Compra">Compra</option>
                <option value="Venda">Venda</option>
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Data</span>
              <input
                type="date"
                value={edit.date}
                onChange={(event) => setEdit({ ...edit, date: event.target.value })}
                className={styles.input}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Quantidade</span>
              <input
                type="number"
                min="0.0001"
                step="0.0001"
                value={edit.quantity}
                onChange={(event) => setEdit({ ...edit, quantity: event.target.value })}
                className={styles.input}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Preço unitário</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatBRL(unitPrice)}
                onChange={(event) => setEdit({ ...edit, unitPriceCents: centsFromInput(event.target.value) })}
                className={styles.input}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Outros custos (taxas)</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatBRL(otherCosts)}
                onChange={(event) => setEdit({ ...edit, otherCostsCents: centsFromInput(event.target.value) })}
                className={styles.input}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Valor total</span>
              <input type="text" value={formatBRL(editTotal)} className={`${styles.input} ${styles.readonlyInput}`} readOnly tabIndex={-1} />
            </label>
          </div>
        </Modal>
      )}
    </div>
  );
}
