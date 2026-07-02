import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent, MouseEvent } from 'react';
import { AlertTriangle, CheckCircle2, LoaderCircle, PlusCircle, Upload, X } from 'lucide-react';
import { usePortfolio } from '../../context/portfolioStore';
import { useQuickAdd } from '../../context/quickAddStore';
import { createManualAsset, uploadPortfolioFile } from '../../services/api';
import { formatBRL, centsFromInput } from '../../utils/formatting';
import { todayAsInputValue } from '../../utils/date';
import styles from './PortfolioActions.module.css';

type StatusTone = 'success' | 'error';
type ActionTab = 'upload' | 'manual';

type StatusMessage = {
  tone: StatusTone;
  text: string;
} | null;

type ManualFormState = {
  ticker: string;
  operation_type: 'Compra' | 'Venda';
  date: string;
  quantity: string;
};

export function PortfolioActions() {
  const { data, refresh } = usePortfolio();
  const { registerAdd } = useQuickAdd();
  const [activeTab, setActiveTab] = useState<ActionTab>('upload');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submittingManual, setSubmittingManual] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<StatusMessage>(null);
  const [manualStatus, setManualStatus] = useState<StatusMessage>(null);
  const [manualForm, setManualForm] = useState<ManualFormState>({
    ticker: '',
    operation_type: 'Compra',
    date: todayAsInputValue(),
    quantity: '',
  });
  const [unitPriceCents, setUnitPriceCents] = useState(0);
  const [otherCostsCents, setOtherCostsCents] = useState(0);
  const [tickerOpen, setTickerOpen] = useState(false);

  const existingTickers = useMemo(() => (data?.assets ?? []).map((asset) => asset.ticker), [data]);
  const tickerSuggestions = useMemo(() => {
    const term = manualForm.ticker.trim().toUpperCase();
    return existingTickers.filter((ticker) => ticker !== term && (!term || ticker.includes(term))).slice(0, 8);
  }, [existingTickers, manualForm.ticker]);

  const unitPrice = unitPriceCents / 100;
  const otherCosts = otherCostsCents / 100;
  const quantityNumber = Number(manualForm.quantity) || 0;
  const totalCompra = quantityNumber * unitPrice + otherCosts;

  const selectedFileLabel = useMemo(() => {
    if (!selectedFile) return 'Nenhum arquivo selecionado';
    return `${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)`;
  }, [selectedFile]);

  const openModal = (tab: ActionTab) => {
    setActiveTab(tab);
    setIsOpen(true);
  };

  useEffect(() => {
    registerAdd(() => {
      setActiveTab('upload');
      setIsOpen(true);
    });
    return () => registerAdd(null);
  }, [registerAdd]);

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadStatus(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus({ tone: 'error', text: 'Escolha um arquivo .xlsx antes de enviar.' });
      return;
    }

    setUploading(true);
    setUploadStatus(null);

    try {
      await uploadPortfolioFile(selectedFile);
      setSelectedFile(null);
      setUploadStatus({ tone: 'success', text: 'Arquivo importado com sucesso.' });
      refresh().catch(() => undefined);
    } catch (error) {
      setUploadStatus({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível importar o arquivo.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleManualChange =
    (field: keyof ManualFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setManualStatus(null);
      setManualForm((current) => ({
        ...current,
        [field]: field === 'ticker' ? event.target.value.toUpperCase() : event.target.value,
      }));
    };

  const handleManualSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittingManual(true);
    setManualStatus(null);

    try {
      await createManualAsset({
        ticker: manualForm.ticker.trim(),
        operation_type: manualForm.operation_type,
        date: manualForm.date,
        quantity: Number(manualForm.quantity),
        unit_price: unitPrice,
        other_costs: otherCosts,
      });

      setManualForm({
        ticker: '',
        operation_type: 'Compra',
        date: todayAsInputValue(),
        quantity: '',
      });
      setUnitPriceCents(0);
      setOtherCostsCents(0);
      setManualStatus({ tone: 'success', text: 'Lançamento manual criado com sucesso.' });
      refresh().catch(() => undefined);
    } catch (error) {
      setManualStatus({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível criar o lançamento manual.',
      });
    } finally {
      setSubmittingManual(false);
    }
  };

  return (
    <>
      <button type="button" className={styles.openButton} onClick={() => openModal('upload')}>
        <PlusCircle size={16} />
        <span>Adicionar investimentos</span>
      </button>

      {isOpen && (
        <div className={styles.overlay} onClick={handleBackdropClick}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Adicionar investimentos</h3>
                <p className={styles.modalSubtitle}>
                  Escolha entre importar sua planilha ou registrar um lançamento manual.
                </p>
              </div>

              <button type="button" className={styles.closeButton} onClick={closeModal} aria-label="Fechar modal">
                <X size={18} />
              </button>
            </div>

            <div className={styles.tabRow}>
              <button
                type="button"
                className={`${styles.tabButton} ${activeTab === 'upload' ? styles.tabButtonActive : ''}`}
                onClick={() => setActiveTab('upload')}
              >
                <Upload size={16} />
                <span>Importar Excel</span>
              </button>
              <button
                type="button"
                className={`${styles.tabButton} ${activeTab === 'manual' ? styles.tabButtonActive : ''}`}
                onClick={() => setActiveTab('manual')}
              >
                <PlusCircle size={16} />
                <span>Adicionar ativo</span>
              </button>
            </div>

            <div className={styles.modalBody}>
              {activeTab === 'upload' ? (
                <article className={styles.panel}>
                  <div className={styles.cardHeader}>
                    <div className={`${styles.iconWrap} ${styles.uploadAccent}`}>
                      <Upload size={18} />
                    </div>
                    <div>
                      <h3 className={styles.title}>Importar Excel</h3>
                      <p className={styles.subtitle}>Envie sua planilha da B3 em formato .xlsx.</p>
                    </div>
                  </div>

                  <div className={styles.filePicker}>
                    <label className={styles.fileButton} htmlFor="portfolio-upload-input">
                      Selecionar arquivo
                    </label>
                    <input
                      id="portfolio-upload-input"
                      type="file"
                      accept=".xlsx"
                      className={styles.hiddenInput}
                      onChange={handleFileChange}
                    />
                    <p className={styles.fileLabel}>{selectedFileLabel}</p>
                  </div>

                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading ? <LoaderCircle size={16} className={styles.spin} /> : <Upload size={16} />}
                    <span>{uploading ? 'Importando...' : 'Subir planilha'}</span>
                  </button>

                  {uploadStatus && (
                    <div className={`${styles.status} ${uploadStatus.tone === 'success' ? styles.success : styles.error}`}>
                      {uploadStatus.tone === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                      <span>{uploadStatus.text}</span>
                    </div>
                  )}
                </article>
              ) : (
                <article className={styles.panel}>
                  <div className={styles.cardHeader}>
                    <div className={`${styles.iconWrap} ${styles.manualAccent}`}>
                      <PlusCircle size={18} />
                    </div>
                    <div>
                      <h3 className={styles.title}>Adicionar ativo manualmente</h3>
                      <p className={styles.subtitle}>Crie uma transação manual de compra ou venda.</p>
                    </div>
                  </div>

                  <form className={styles.form} onSubmit={handleManualSubmit}>
                    <div className={styles.formGrid}>
                      <div className={`${styles.field} ${styles.tickerWrap}`}>
                        <span className={styles.label}>Ticker</span>
                        <input
                          value={manualForm.ticker}
                          onChange={handleManualChange('ticker')}
                          onFocus={() => setTickerOpen(true)}
                          onBlur={() => window.setTimeout(() => setTickerOpen(false), 120)}
                          className={styles.input}
                          placeholder="Buscar ou digitar (ex: MXRF11)"
                          maxLength={20}
                          required
                        />
                        {tickerOpen && tickerSuggestions.length > 0 && (
                          <ul className={styles.tickerList}>
                            {tickerSuggestions.map((ticker) => (
                              <li key={ticker}>
                                <button
                                  type="button"
                                  className={styles.tickerOption}
                                  onMouseDown={(event) => {
                                    event.preventDefault();
                                    setManualForm((current) => ({ ...current, ticker }));
                                    setTickerOpen(false);
                                  }}
                                >
                                  {ticker}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <label className={styles.field}>
                        <span className={styles.label}>Tipo</span>
                        <select
                          value={manualForm.operation_type}
                          onChange={handleManualChange('operation_type')}
                          className={styles.input}
                        >
                          <option value="Compra">Compra</option>
                          <option value="Venda">Venda</option>
                        </select>
                      </label>

                      <label className={styles.field}>
                        <span className={styles.label}>Data</span>
                        <input
                          type="date"
                          value={manualForm.date}
                          onChange={handleManualChange('date')}
                          className={styles.input}
                          required
                        />
                      </label>

                      <label className={styles.field}>
                        <span className={styles.label}>Quantidade</span>
                        <input
                          type="number"
                          min="0.0001"
                          step="0.0001"
                          value={manualForm.quantity}
                          onChange={handleManualChange('quantity')}
                          className={styles.input}
                          placeholder="0"
                          required
                        />
                      </label>

                      <label className={styles.field}>
                        <span className={styles.label}>Preço unitário</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatBRL(unitPrice)}
                          onChange={(event) => setUnitPriceCents(centsFromInput(event.target.value))}
                          className={styles.input}
                          placeholder="R$ 0,00"
                        />
                      </label>

                      <label className={styles.field}>
                        <span className={styles.label}>Outros custos (taxas)</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatBRL(otherCosts)}
                          onChange={(event) => setOtherCostsCents(centsFromInput(event.target.value))}
                          className={styles.input}
                          placeholder="R$ 0,00"
                        />
                      </label>

                      <label className={`${styles.field} ${styles.fullWidth}`}>
                        <span className={styles.label}>Valor total da compra</span>
                        <input
                          type="text"
                          value={formatBRL(totalCompra)}
                          className={`${styles.input} ${styles.readonlyInput}`}
                          readOnly
                          tabIndex={-1}
                        />
                      </label>
                    </div>

                    <button
                      type="submit"
                      className={styles.primaryButton}
                      disabled={submittingManual || !manualForm.ticker.trim() || quantityNumber <= 0 || unitPrice <= 0}
                    >
                      {submittingManual ? <LoaderCircle size={16} className={styles.spin} /> : <PlusCircle size={16} />}
                      <span>{submittingManual ? 'Salvando...' : 'Adicionar lançamento'}</span>
                    </button>
                  </form>

                  {manualStatus && (
                    <div className={`${styles.status} ${manualStatus.tone === 'success' ? styles.success : styles.error}`}>
                      {manualStatus.tone === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                      <span>{manualStatus.text}</span>
                    </div>
                  )}
                </article>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
