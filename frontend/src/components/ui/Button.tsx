/**
 * Styled button with loading states, variants, and premium styling.
 */
import { motion } from 'framer-motion';
import type { ReactNode, CSSProperties } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: CSSProperties;
}

const baseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  border: 'none',
  borderRadius: '12px',
  fontFamily: 'var(--font-sans)',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  letterSpacing: '0.01em',
};

const variants: Record<string, CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
    color: 'var(--bg-main)',
    boxShadow: '0 4px 20px -4px color-mix(in srgb, var(--primary) 35%, transparent)',
  },
  secondary: {
    background: 'color-mix(in srgb, var(--border-light) 50%, transparent)',
    color: 'var(--text-main)',
    border: '1px solid var(--border-light)',
  },
  danger: {
    background: 'linear-gradient(135deg, var(--danger) 0%, color-mix(in srgb, var(--danger) 80%, black) 100%)',
    color: '#fff',
    boxShadow: '0 4px 20px -4px color-mix(in srgb, var(--danger) 35%, transparent)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--primary)',
    border: '1px solid transparent',
  },
};

const sizes: Record<string, CSSProperties> = {
  sm: { padding: '8px 16px', fontSize: '13px' },
  md: { padding: '12px 24px', fontSize: '14px' },
  lg: { padding: '14px 32px', fontSize: '15px' },
};

export const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) => {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled ? 1 : 1.04 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      style={{
        ...baseStyle,
        ...variants[variant],
        ...sizes[size],
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {loading ? (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
          style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid', borderTopColor: 'transparent', borderRadius: '50%' }}
        />
      ) : null}
      {children}
    </motion.button>
  );
};
