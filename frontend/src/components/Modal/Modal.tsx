import { useEffect } from 'react';
import type { FormEvent, MouseEvent, ReactNode } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  submitting?: boolean;
  onDelete?: () => void;
  deleteLabel?: string;
  children: ReactNode;
}

export function Modal({
  title,
  subtitle,
  onClose,
  onSubmit,
  submitLabel = 'Salvar',
  submitDisabled = false,
  submitting = false,
  onDelete,
  deleteLabel = 'Excluir',
  children,
}: ModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdrop}>
      <form className={styles.modal} onSubmit={handleSubmit}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{title}</h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>{children}</div>

        <div className={styles.footer}>
          {onDelete ? (
            <button type="button" className={styles.deleteButton} onClick={onDelete}>
              {deleteLabel}
            </button>
          ) : (
            <span />
          )}
          <div className={styles.footerRight}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.saveButton} disabled={submitDisabled || submitting}>
              {submitting ? 'Salvando...' : submitLabel}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
