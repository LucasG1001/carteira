import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Copy, Check, CheckSquare, Square } from "lucide-react";
import { PortfolioProvider } from "../../context/PortfolioContext";
import { usePortfolio } from "../../context/portfolioStore";
import { buildTaxReport, downloadCsv, formatBRL, formatQty, toCsv } from "../../utils/taxReport";
import styles from "./TaxReportPage.module.css";

const DECLARED_YEAR = new Date().getFullYear();
const DECLARED_KEY = `carteira-ir-declarados-${DECLARED_YEAR}`;

function loadDeclarados(): Set<string> {
  try {
    const raw = localStorage.getItem(DECLARED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function TaxReportContent() {
  const { data, loading, error } = usePortfolio();
  const [copied, setCopied] = useState<string | null>(null);
  const [declarados, setDeclarados] = useState<Set<string>>(loadDeclarados);

  const toggleDeclarado = (ticker: string) => {
    setDeclarados((prev) => {
      const next = new Set(prev);
      if (next.has(ticker)) next.delete(ticker);
      else next.add(ticker);
      localStorage.setItem(DECLARED_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  if (loading) {
    return <div className={styles.state}>Carregando carteira...</div>;
  }

  if (error) {
    return <div className={`${styles.state} ${styles.error}`}>Erro ao carregar dados: {error.message}</div>;
  }

  if (!data) {
    return null;
  }

  const report = buildTaxReport(data.assets);
  const hasAssets = report.sections.length > 0;

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };

  const handleExport = () => {
    downloadCsv(`declaracao-ir-${new Date().getFullYear()}.csv`, toCsv(report));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/investimentos" className={styles.back}>
          <ArrowLeft size={16} />
          <span>Voltar</span>
        </Link>
        <h1 className={styles.title}>Declaração de Imposto de Renda</h1>
        <button type="button" className={styles.exportButton} onClick={handleExport} disabled={!hasAssets}>
          <Download size={16} />
          <span>Exportar para Excel</span>
        </button>
      </div>

      <p className={styles.disclaimer}>
        Guia orientativo — não substitui consultoria fiscal. Os códigos seguem o layout do IRPF 2025 (ano-base 2024).
        Os valores refletem a posição atual da carteira; ajuste para a posição em 31/12 se necessário. Ativos são
        declarados pelo <strong>custo de aquisição</strong>, nunca pelo valor de mercado.
      </p>

      {!hasAssets && (
        <div className={styles.state}>Nenhum ativo na carteira para declarar.</div>
      )}

      {report.sections.map((section) => {
        const declaredCount = section.itens.filter((item) => declarados.has(item.ticker)).length;
        const allDeclared = declaredCount === section.itens.length;
        return (
        <section key={section.tipo} className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <h2 className={styles.sectionTitle}>{section.titulo}</h2>
              <span className={styles.sectionTotal}>{formatBRL(section.total)}</span>
            </div>
            <div className={styles.badges}>
              <span className={styles.badge}>Ficha: {section.ficha}</span>
              <span className={styles.badge}>Grupo {section.grupo}</span>
              <span className={`${styles.badge} ${allDeclared ? styles.badgeDone : ""}`}>
                {declaredCount}/{section.itens.length} declarados
              </span>
            </div>
            {section.nota && <p className={styles.sectionNota}>{section.nota}</p>}
          </div>

          <div className={styles.items}>
            {section.itens.map((item) => {
              const id = `${section.tipo}-${item.ticker}`;
              const declarado = declarados.has(item.ticker);
              return (
                <div key={id} className={`${styles.item} ${declarado ? styles.declared : ""}`}>
                  <div className={styles.itemTop}>
                    <div className={styles.itemLeft}>
                      <button
                        type="button"
                        className={styles.checkbox}
                        onClick={() => toggleDeclarado(item.ticker)}
                        aria-pressed={declarado}
                        title={declarado ? "Desmarcar" : "Marcar como declarado"}
                      >
                        {declarado ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>
                      <div className={styles.itemAtivo}>
                        <span className={styles.ticker}>{item.ticker}</span>
                        {item.name && <span className={styles.name}>{item.name}</span>}
                        {declarado && <span className={styles.declaredBadge}>Declarado</span>}
                      </div>
                    </div>
                    <div className={styles.itemValues}>
                      <span className={styles.itemValueLabel}>Situação em 31/12</span>
                      <span className={styles.itemValue}>{formatBRL(item.custoTotal)}</span>
                    </div>
                  </div>

                  <div className={styles.itemMeta}>
                    <span className={styles.codigo}>Código {item.codigo}</span>
                    <span className={styles.metaSep}>·</span>
                    <span>
                      {formatQty(item.quantidade)} un. · custo médio {formatBRL(item.custoMedio)}
                    </span>
                  </div>

                  <div className={styles.discriminacao}>
                    <p className={styles.discriminacaoText}>{item.discriminacao}</p>
                    <button
                      type="button"
                      className={styles.copyButton}
                      onClick={() => handleCopy(id, item.discriminacao)}
                      title="Copiar discriminação"
                    >
                      {copied === id ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copied === id ? "Copiado" : "Copiar"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        );
      })}

      {report.incomes.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <h2 className={styles.sectionTitle}>Rendimentos recebidos</h2>
            </div>
            <div className={styles.badges}>
              <span className={styles.badge}>Ficha: Rendimentos Isentos e Não Tributáveis</span>
            </div>
          </div>

          <div className={styles.items}>
            {report.incomes.map((income) => (
              <div key={income.label} className={styles.item}>
                <div className={styles.itemTop}>
                  <div className={styles.itemAtivo}>
                    <span className={styles.ticker}>{income.label}</span>
                    <span className={styles.name}>Código {income.codigo}</span>
                  </div>
                  <div className={styles.itemValues}>
                    <span className={styles.itemValueLabel}>Total recebido</span>
                    <span className={styles.itemValue}>{formatBRL(income.total)}</span>
                  </div>
                </div>
                {income.nota && <p className={styles.sectionNota}>{income.nota}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export function TaxReportPage() {
  return (
    <PortfolioProvider>
      <TaxReportContent />
    </PortfolioProvider>
  );
}
