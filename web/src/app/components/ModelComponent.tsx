import React, { useState } from "react";
import "../styles/model.css";
import { XIcon } from "lucide-react"; // Importa os ícones do Lucide

interface Props {
  setModal?: (modalState: boolean) => void;
  modal?: boolean;
  children: React.ReactNode;
  closeModal: boolean;
}

const ModelComponent: React.FC<Props> = ({
  setModal,
  modal = true,
  children,
  closeModal,
}) => {
  return modal ? (
    <div className="model-container">
      <div className="modal-content">{children}</div>

      {closeModal && setModal && (
        <XIcon
          strokeWidth={3}
          className="close"
          onClick={() => setModal(false)}
        />
      )}
    </div>
  ) : null;
};

export default ModelComponent;
