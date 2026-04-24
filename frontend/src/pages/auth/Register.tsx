/**
 * Register page with role selection.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageWrapper } from '../../components/ui/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';
import type { CSSProperties } from 'react';
import type { RegisterResponse } from '../../types';

const containerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 'calc(100vh - 70px)',
  padding: '40px 20px',
};

const formStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '18px',
  width: '100%',
  maxWidth: '460px',
};

const rolePickerStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
};

const roleBtnBase: CSSProperties = {
  padding: '16px',
  borderRadius: '12px',
  border: '2px solid var(--border-light)',
  background: 'rgba(0,0,0,0.2)',
  cursor: 'pointer',
  textAlign: 'center',
  transition: 'all 0.2s ease',
  fontFamily: 'var(--font-sans)',
};

const roleBtnActive: CSSProperties = {
  ...roleBtnBase,
  borderColor: 'var(--primary)',
  background: 'rgba(0, 229, 255, 0.08)',
};

const errorBoxStyle: CSSProperties = {
  background: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  borderRadius: '8px',
  padding: '10px 14px',
  color: '#ef4444',
  fontSize: '13px',
};

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post<RegisterResponse>('/auth/register/', {
        name,
        email,
        password,
        password_confirm: passwordConfirm,
        role,
      });
      setAuth(data.user, data.tokens.access, data.tokens.refresh);

      if (role === 'patient') navigate('/dashboard');
      else navigate('/doctor');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: Record<string, string[]> } };
      const data = axiosError.response?.data;
      if (data) {
        const firstError = Object.values(data).flat()[0];
        setError(typeof firstError === 'string' ? firstError : 'Registration failed');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div style={containerStyle}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card style={{ padding: '40px 32px' }}>
            <form onSubmit={handleSubmit} style={formStyle}>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>Create Account</h1>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Join MediID — secure your health identity</p>
              </div>

              {error && <div style={errorBoxStyle}>{error}</div>}

              {/* Role Selection */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>
                  I am a
                </label>
                <div style={rolePickerStyle}>
                  <motion.div
                    style={role === 'patient' ? roleBtnActive : roleBtnBase}
                    onClick={() => setRole('patient')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>🏥</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: role === 'patient' ? 'var(--primary)' : 'var(--text-main)' }}>Patient</div>
                  </motion.div>
                  <motion.div
                    style={role === 'doctor' ? roleBtnActive : roleBtnBase}
                    onClick={() => setRole('doctor')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>👨‍⚕️</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: role === 'doctor' ? 'var(--primary)' : 'var(--text-main)' }}>Doctor</div>
                  </motion.div>
                </div>
              </div>

              <Input label="Full Name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input label="Password" type="password" placeholder="Minimum 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              <Input label="Confirm Password" type="password" placeholder="Re-enter password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required />

              <Button type="submit" fullWidth loading={loading}>
                Create Account
              </Button>

              <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign In</Link>
              </p>
            </form>
          </Card>
        </motion.div>
      </div>
    </PageWrapper>
  );
};
