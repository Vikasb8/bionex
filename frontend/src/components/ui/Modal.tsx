/**
 * Animated modal overlay with premium styling.
 */
import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode, CSSProperties } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.65)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px',
};

const modalStyle: CSSProperties = {
  background: 'rgba(12, 19, 34, 0.95)',
  backdropFilter: 'blur(24px) saturate(150%)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '24px',
  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
  padding: '32px',
  maxWidth: '500px',
  width: '100%',
  maxHeight: '90vh',
  overflowY: 'auto',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
};

const titleStyle: CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  color: 'var(--text-heading)',
  letterSpacing: '-0.02em',
};

const closeBtnStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.06)',
  color: 'var(--text-muted)',
  width: '34px',
  height: '34px',
  borderRadius: '10px',
  cursor: 'pointer',
  fontSize: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
};

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          style={overlayStyle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            style={modalStyle}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div style={headerStyle}>
                <h3 style={titleStyle}>{title}</h3>
                <button style={closeBtnStyle} onClick={onClose}>✕</button>
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
