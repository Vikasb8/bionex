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
  background: 'var(--bg-card)',
  backdropFilter: 'blur(20px) saturate(150%)',
  WebkitBackdropFilter: 'blur(20px) saturate(150%)',
  border: '1px solid var(--border-light)',
  borderRadius: '20px',
  boxShadow: 'var(--shadow-glass)',
  padding: '28px',
  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
};

export const Card = ({ children, style, hoverable = false, onClick }: CardProps) => {
  return (
    <motion.div
      style={{ ...cardStyle, ...style, cursor: onClick ? 'pointer' : 'default' }}
      whileHover={hoverable ? {
        scale: 1.02,
        borderColor: 'var(--border-focus)',
        boxShadow: '0 12px 40px -10px color-mix(in srgb, var(--primary) 10%, transparent), inset 0 1px 0 var(--border-light)',
      } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};
