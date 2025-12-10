import React from 'react';
import { Modal } from './Modal';
import './ConfirmationModal.scss';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Yes',
  cancelText = 'No',
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      className="modal-small"
      title={title}
      closeOnOverlayClick={true}
    >
      <div className="confirmation-modal-content">
        <div className="modal-message">{message}</div>
        <div className="modal-actions">
          <button className="modal-button modal-button-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="modal-button modal-button-confirm" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;

