/**
 * Glassmorphic Card component with refined styling.
 */
import { motion } from 'framer-motion';
import type { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  hoverable?: boolean;
  onClick?: () => void;
}

const cardStyle: CSSProperties = {
  background: 'rgba(12, 19, 34, 0.55)',
  backdropFilter: 'blur(20px) saturate(150%)',
  WebkitBackdropFilter: 'blur(20px) saturate(150%)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: '20px',
  boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.03)',
  padding: '28px',
  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
};

export const Card = ({ children, style, hoverable = false, onClick }: CardProps) => {
  return (
    <motion.div
      style={{ ...cardStyle, ...style, cursor: onClick ? 'pointer' : 'default' }}
      whileHover={hoverable ? {
        scale: 1.02,
        borderColor: 'rgba(0, 229, 255, 0.15)',
        boxShadow: '0 12px 40px -10px rgba(0, 229, 255, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
      } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};
