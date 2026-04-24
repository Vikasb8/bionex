/**
 * Login page with glassmorphic form and QR scanner verification animation.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper } from '../../components/ui/PageWrapper';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';
import type { CSSProperties } from 'react';
import type { LoginResponse } from '../../types';

const containerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 'calc(100vh - 70px)',
  padding: '40px 20px',
  gap: '60px',
  maxWidth: '1100px',
  margin: '0 auto',
  flexWrap: 'wrap',
};

const formStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  width: '100%',
  maxWidth: '420px',
};

const titleStyle: CSSProperties = {
  fontSize: '28px',
  fontWeight: 700,
  textAlign: 'center',
  marginBottom: '4px',
};

const subtitleStyle: CSSProperties = {
  fontSize: '14px',
  color: 'var(--text-muted)',
  textAlign: 'center',
  marginBottom: '8px',
};

const errorBoxStyle: CSSProperties = {
  background: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  borderRadius: '8px',
  padding: '10px 14px',
  color: '#ef4444',
  fontSize: '13px',
};

/* ── Login Scanner Visual ── */
const LoginScanner = ({ status, verifiedRole }: { status: 'idle' | 'scanning' | 'verified'; verifiedRole?: string }) => {
  const isVerified = status === 'verified';
  const isScanning = status === 'scanning';
  const accentColor = isVerified ? '#10b981' : '#00e5ff';
  const glowColor = isVerified ? 'rgba(16,185,129,' : 'rgba(0,229,255,';

  return (
    <div style={{ position: 'relative', width: '280px', aspectRatio: '1', perspective: '800px' }}>
      {/* Pulsing concentric rings */}
      {[0, 0.8, 1.6].map((delay, i) => (
        <motion.div key={i}
          animate={{ scale: [0.88, 1.08, 0.88], opacity: [0.06, 0.18, 0.06] }}
          transition={{ duration: 3, delay, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: `${-8 - i * 12}px`, borderRadius: '24px',
            border: `1px solid ${glowColor}0.15)`, pointerEvents: 'none'
          }} />
      ))}

      {/* Main card */}
      <motion.div
        animate={isVerified
          ? { rotateY: 0, rotateX: 0, scale: [1, 1.03, 1] }
          : { rotateY: [-2, 2, -2], rotateX: [1, -1, 1] }
        }
        transition={isVerified
          ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 8, repeat: Infinity, ease: 'easeInOut' }
        }
        style={{
          position: 'relative', width: '100%', height: '100%', borderRadius: '20px',
          background: 'linear-gradient(145deg, rgba(10,16,30,0.9), rgba(5,10,20,0.95))',
          backdropFilter: 'blur(24px)',
          border: `1px solid ${glowColor}0.15)`,
          padding: '28px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          boxShadow: isVerified
            ? `0 25px 80px -20px rgba(0,0,0,0.7), 0 0 80px -10px ${glowColor}0.2)`
            : `0 25px 80px -20px rgba(0,0,0,0.7), 0 0 60px -10px ${glowColor}0.1)`,
          overflow: 'hidden', transformStyle: 'preserve-3d',
          transition: 'border-color 0.5s ease, box-shadow 0.5s ease',
        }}
      >
        {/* Holographic shimmer */}
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
          style={{
            position: 'absolute', inset: 0,
            background: isVerified
              ? 'linear-gradient(105deg, transparent 30%, rgba(16,185,129,0.05) 45%, rgba(16,185,129,0.03) 55%, transparent 70%)'
              : 'linear-gradient(105deg, transparent 30%, rgba(0,229,255,0.04) 45%, rgba(124,58,237,0.03) 50%, rgba(0,229,255,0.04) 55%, transparent 70%)',
            zIndex: 1, pointerEvents: 'none'
          }} />

        {/* Scanner frame */}
        <div style={{ position: 'relative', width: '70%', aspectRatio: '1', zIndex: 2 }}>
          {/* Animated corner brackets */}
          {[
            { t: 0, l: 0, bT: `3px solid ${accentColor}`, bL: `3px solid ${accentColor}` },
            { t: 0, r: 0, bT: `3px solid ${accentColor}`, bR: `3px solid ${accentColor}` },
            { b: 0, l: 0, bB: `3px solid ${accentColor}`, bL: `3px solid ${accentColor}` },
            { b: 0, r: 0, bB: `3px solid ${accentColor}`, bR: `3px solid ${accentColor}` }
          ].map((c, i) => (
            <motion.div key={i}
              animate={isVerified
                ? { scale: 1, opacity: 1 }
                : { scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }
              }
              transition={{ duration: 2, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', width: '26px', height: '26px', borderRadius: '4px',
                top: c.t, left: c.l, right: c.r, bottom: c.b,
                borderTop: c.bT, borderLeft: c.bL, borderRight: c.bR, borderBottom: c.bB,
                filter: `drop-shadow(0 0 6px ${glowColor}0.4))`,
                transition: 'border-color 0.5s ease, filter 0.5s ease',
              } as CSSProperties} />
          ))}

          {/* Scan line — only when idle or scanning */}
          <AnimatePresence>
            {!isVerified && (
              <motion.div
                key="scanline"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                animate={{ top: ['5%', '90%', '5%'] }}
                transition={{ duration: isScanning ? 1.2 : 2.8, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute', left: '6%', right: '6%', height: '2px',
                  background: `linear-gradient(90deg, transparent 0%, ${accentColor} 20%, ${accentColor} 80%, transparent 100%)`,
                  boxShadow: `0 0 20px 6px ${glowColor}0.4), 0 0 60px 10px ${glowColor}0.15)`,
                  zIndex: 3
                }}
              >
                <div style={{
                  position: 'absolute', top: '2px', left: 0, right: 0, height: '25px',
                  background: `linear-gradient(180deg, ${glowColor}0.12), transparent)`,
                  pointerEvents: 'none'
                }} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Verified checkmark overlay */}
          <AnimatePresence>
            {isVerified && (
              <motion.div
                key="checkmark"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 5
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    width: '60px', height: '60px', borderRadius: '50%',
                    background: 'rgba(16,185,129,0.15)',
                    border: '2px solid #10b981',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 30px rgba(16,185,129,0.3)',
                    fontSize: '28px'
                  }}
                >
                  ✓
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* QR dot matrix */}
          <div style={{
            position: 'absolute', inset: '20px', display: 'grid',
            gridTemplateColumns: 'repeat(7,1fr)', gridTemplateRows: 'repeat(7,1fr)', gap: '3px'
          }}>
            {Array.from({ length: 49 }, (_, i) => {
              const row = Math.floor(i / 7), col = i % 7;
              const isCorner = (row < 3 && col < 3) || (row < 3 && col > 3) || (row > 3 && col < 3);
              const isCyan = isCorner || Math.random() > 0.5;
              return (
                <motion.div key={i}
                  animate={{
                    opacity: isVerified
                      ? (isCyan ? [0.5, 1, 0.5] : [0.1, 0.25, 0.1])
                      : (isCyan ? [0.2, 0.7, 0.2] : [0.03, 0.12, 0.03]),
                  }}
                  transition={{ duration: isCyan ? 2 : 3, delay: i * 0.03, repeat: Infinity, repeatType: 'reverse' }}
                  style={{
                    borderRadius: isCorner ? '3px' : '2px',
                    background: isVerified
                      ? (isCyan ? '#10b981' : 'rgba(16,185,129,0.15)')
                      : (isCyan ? '#00e5ff' : 'rgba(255,255,255,0.08)'),
                    boxShadow: isCorner
                      ? (isVerified ? '0 0 6px rgba(16,185,129,0.4)' : '0 0 6px rgba(0,229,255,0.3)')
                      : 'none',
                    transition: 'background 0.6s ease, box-shadow 0.6s ease',
                  }} />
              );
            })}
          </div>
        </div>

        {/* Status indicator */}
        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 2 }}>
          <motion.div
            animate={{ opacity: isVerified ? 1 : [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: isVerified ? 0 : Infinity }}
            style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: isVerified ? '#10b981' : (isScanning ? '#f59e0b' : '#00e5ff'),
              boxShadow: isVerified
                ? '0 0 8px rgba(16,185,129,0.6)'
                : isScanning ? '0 0 8px rgba(245,158,11,0.5)' : '0 0 8px rgba(0,229,255,0.5)',
              transition: 'background 0.4s ease, box-shadow 0.4s ease',
            }} />
          <AnimatePresence mode="wait">
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              style={{
                fontSize: '11px',
                color: isVerified ? '#10b981' : 'var(--text-muted)',
                letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600,
                transition: 'color 0.4s ease',
              }}
            >
              {isVerified
                ? (verifiedRole === 'doctor' ? '✓ Doctor Verified' : verifiedRole === 'admin' ? '✓ Admin Verified' : '✓ User Verified')
                : isScanning ? 'Authenticating...' : 'Awaiting Login'}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'verified'>('idle');
  const [verifiedRole, setVerifiedRole] = useState('');
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setScanStatus('scanning');

    try {
      const { data } = await api.post<LoginResponse>('/auth/login/', { email, password });
      setAuth(data.user, data.access, data.refresh);

      // Show verified state
      setVerifiedRole(data.user.role);
      setScanStatus('verified');

      // Wait for the user to see the verification, then navigate
      setTimeout(() => {
        if (data.user.role === 'patient') navigate('/dashboard');
        else if (data.user.role === 'doctor') navigate('/doctor');
        else if (data.user.role === 'admin') navigate('/admin');
      }, 2000);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      setError(axiosError.response?.data?.detail || 'Invalid email or password');
      setScanStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="login-container" style={containerStyle}>
        {/* Left — Form */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card style={{ padding: '40px 32px' }}>
            <form onSubmit={handleSubmit} style={formStyle}>
              <div>
                <h1 style={titleStyle}>Welcome back</h1>
                <p style={subtitleStyle}>Sign in to your Bionex account</p>
              </div>

              {error && <div style={errorBoxStyle}>{error}</div>}

              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button type="submit" fullWidth loading={loading}>
                Sign In
              </Button>

              <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  Register
                </Link>
              </p>
            </form>
          </Card>
        </motion.div>

        {/* Right — Scanner */}
        <motion.div
          className="scanner-visual"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <LoginScanner status={scanStatus} verifiedRole={verifiedRole} />
        </motion.div>
      </div>
    </PageWrapper>
  );
};
