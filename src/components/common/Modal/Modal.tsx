import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import './Modal.scss';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  title?: string;
}

/**
 * Base Modal Component with backdrop blur and body scroll lock
 * Uses React Portal to render at document.body level for proper z-index stacking
 * All modals should use this component for consistent behavior
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className = '',
  closeOnOverlayClick = true,
  showCloseButton = false,
  title,
}) => {
  // Create portal container element
  const portalContainer = useMemo(() => {
    if (typeof document !== 'undefined') {
      let container = document.getElementById('modal-root');
      if (!container) {
        container = document.createElement('div');
        container.id = 'modal-root';
        document.body.appendChild(container);
      }
      return container;
    }
    return null;
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // Restore scroll position
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen || !portalContainer) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div className={`modal-overlay ${className}`} onClick={handleOverlayClick}>
      <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()}>
        {(showCloseButton || title) && (
          <div className="modal-header">
            {title && <h3 className="modal-title">{title}</h3>}
            {showCloseButton && (
              <button
                className="modal-close-button"
                onClick={onClose}
                aria-label="Close modal"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );

  // Render modal using portal at document.body level
  return createPortal(modalContent, portalContainer);
};

export default Modal;

