import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent, MouseEvent } from 'react';
import { AlertTriangle, CheckCircle2, LoaderCircle, PlusCircle, Upload, X } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { createManualAsset, uploadPortfolioFile } from '../../services/api';
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
  unit_price: string;
};

function todayAsInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function PortfolioActions() {
  const { refresh } = usePortfolio();
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
    unit_price: '',
  });

  const selectedFileLabel = useMemo(() => {
    if (!selectedFile) return 'Nenhum arquivo selecionado';
    return `${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)`;
  }, [selectedFile]);

  const openModal = (tab: ActionTab) => {
    setActiveTab(tab);
    setIsOpen(true);
  };

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
      await refresh();
      setSelectedFile(null);
      setUploadStatus({ tone: 'success', text: 'Arquivo importado com sucesso.' });
    } catch (error) {
      setUploadStatus({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Nao foi possivel importar o arquivo.',
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
        unit_price: Number(manualForm.unit_price),
      });

      await refresh();
      setManualForm({
        ticker: '',
        operation_type: 'Compra',
        date: todayAsInputValue(),
        quantity: '',
        unit_price: '',
      });
      setManualStatus({ tone: 'success', text: 'Lancamento manual criado com sucesso.' });
    } catch (error) {
      setManualStatus({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Nao foi possivel criar o lancamento manual.',
      });
    } finally {
      setSubmittingManual(false);
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.launcher}>
        <div>
          <h2 className={styles.launcherTitle}>Movimentacoes da carteira</h2>
          <p className={styles.launcherSubtitle}>
            Importe a planilha da B3 ou adicione um lancamento manual quando precisar.
          </p>
        </div>

        <button type="button" className={styles.openButton} onClick={() => openModal('upload')}>
          <PlusCircle size={18} />
          <span>Adicionar investimentos</span>
        </button>
      </div>

      {isOpen && (
        <div className={styles.overlay} onClick={handleBackdropClick}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Adicionar investimentos</h3>
                <p className={styles.modalSubtitle}>
                  Escolha entre importar sua planilha ou registrar um lancamento manual.
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
                      <p className={styles.subtitle}>Crie uma transacao manual de compra ou venda.</p>
                    </div>
                  </div>

                  <form className={styles.form} onSubmit={handleManualSubmit}>
                    <div className={styles.formGrid}>
                      <label className={styles.field}>
                        <span className={styles.label}>Ticker</span>
                        <input
                          value={manualForm.ticker}
                          onChange={handleManualChange('ticker')}
                          className={styles.input}
                          placeholder="Ex: MXRF11"
                          maxLength={20}
                          required
                        />
                      </label>

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

                      <label className={`${styles.field} ${styles.fullWidth}`}>
                        <span className={styles.label}>Preco unitario</span>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={manualForm.unit_price}
                          onChange={handleManualChange('unit_price')}
                          className={styles.input}
                          placeholder="0,00"
                          required
                        />
                      </label>
                    </div>

                    <button type="submit" className={styles.primaryButton} disabled={submittingManual}>
                      {submittingManual ? <LoaderCircle size={16} className={styles.spin} /> : <PlusCircle size={16} />}
                      <span>{submittingManual ? 'Salvando...' : 'Adicionar lancamento'}</span>
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
    </section>
  );
}
