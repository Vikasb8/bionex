/**
 * Styled form input with label and error.
 */
import type { CSSProperties, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerStyle?: CSSProperties;
}

const containerBaseStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  width: '100%',
};

const labelStyle: CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--text-muted)',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
};

const inputStyle: CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-light)',
  color: 'var(--text-main)',
  borderRadius: '10px',
  padding: '12px 16px',
  fontSize: '15px',
  fontFamily: 'var(--font-sans)',
  transition: 'all 0.2s ease',
  width: '100%',
};

const errorStyle: CSSProperties = {
  fontSize: '12px',
  color: 'var(--danger)',
  marginTop: '2px',
};

export const Input = ({ label, error, containerStyle, style, ...props }: InputProps) => {
  return (
    <div style={{ ...containerBaseStyle, ...containerStyle }}>
      {label && <label style={labelStyle}>{label}</label>}
      <input
        style={{
          ...inputStyle,
          borderColor: error ? 'var(--danger)' : 'var(--border-light)',
          ...style,
        }}
        {...props}
      />
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  );
};
