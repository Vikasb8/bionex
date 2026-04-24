/**
 * MediID — App root with routing.
 */
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
// @ts-expect-error - image handled by vite
import bionexLogo from './assets/bionexlogo.png';
import { Navbar } from './components/ui/Navbar';
import { ProtectedRoute } from './components/ui/ProtectedRoute';
import { Landing } from './pages/public/Landing';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { PatientDashboard } from './pages/patient/Dashboard';
import { DoctorDashboard } from './pages/doctor/Dashboard';
import { AdminDashboard } from './pages/admin/Dashboard';
import { EmergencyView } from './pages/emergency/EmergencyView';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
});

const BootScreen = () => {
  const [phase, setPhase] = useState(0); // 0=particles, 1=pulse, 2=logo, 3=text, 4=exit

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),   // pulse line appears
      setTimeout(() => setPhase(2), 1000),   // logo materializes
      setTimeout(() => setPhase(3), 1600),   // text + progress bar
      setTimeout(() => setPhase(4), 2800),   // ready to exit
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Generate floating particles
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 2,
    dur: Math.random() * 3 + 2,
  }));

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)', transition: { duration: 0.6, ease: 'easeInOut' } }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999, background: '#030712',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Floating particles */}
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.6, 0],
            y: [0, -30, 0],
            x: [0, (Math.random() - 0.5) * 20, 0],
          }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            left: `${p.x}%`, top: `${p.y}%`,
            width: `${p.size}px`, height: `${p.size}px`,
            borderRadius: '50%',
            background: '#00e5ff',
            boxShadow: `0 0 ${p.size * 4}px rgba(0,229,255,0.4)`,
          }}
        />
      ))}




      {/* Logo */}
      <motion.div
        initial={{ scale: 0.3, opacity: 0, filter: 'blur(20px)' }}
        animate={phase >= 2
          ? { scale: 1, opacity: 1, filter: 'blur(0px)' }
          : { scale: 0.3, opacity: 0, filter: 'blur(20px)' }
        }
        transition={{ type: 'spring', stiffness: 120, damping: 15 }}
        style={{ position: 'relative', zIndex: 10 }}
      >
        <motion.img
          layoutId="bionex-logo"
          src={bionexLogo}
          alt="Bionex Boot Logo"
          style={{
            height: '350px', maxWidth: '85vw', objectFit: 'contain',
            filter: 'drop-shadow(0 0 80px rgba(0, 229, 255, 1))',
          }}
          transition={{ type: 'spring', stiffness: 150, damping: 25 }}
        />
        {/* Glow ring behind logo */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            width: '400px', height: '400px', marginTop: '-200px', marginLeft: '-200px',
            borderRadius: '50%', border: '1px solid rgba(0,229,255,0.15)',
            background: 'radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)',
            pointerEvents: 'none', zIndex: -1,
          }}
        />
      </motion.div>

      {/* System text + progress bar */}
      <AnimatePresence>
        {phase >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              marginTop: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
            }}
          >
            <motion.div
              style={{
                fontSize: '12px', fontWeight: 600, color: 'rgba(0,229,255,0.7)',
                letterSpacing: '4px', textTransform: 'uppercase',
                fontFamily: "'Inter', monospace",
              }}
            >
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                Initializing Secure Environment
              </motion.span>
            </motion.div>

            {/* Progress bar */}
            <div style={{
              width: '200px', height: '3px', borderRadius: '4px',
              background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
            }}>
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  height: '100%', borderRadius: '4px',
                  background: 'linear-gradient(90deg, #00e5ff, #38bdf8)',
                  boxShadow: '0 0 12px rgba(0,229,255,0.5)',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const GlobalBackground = () => {
  const [mousePos, setMousePos] = useState({ x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden', background: '#030712' }}>
      {/* Subtle Base Grid */}
      <div style={{ position: 'absolute', inset: '-50%', backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.8 }} />
      
      {/* Mouse Tracking Spotlight */}
      <motion.div
        animate={{ x: mousePos.x - 500, y: mousePos.y - 500 }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.8 }}
        style={{
          position: 'absolute',
          width: '1000px',
          height: '1000px',
          background: 'radial-gradient(circle, rgba(0, 229, 255, 0.12) 0%, transparent 60%)',
          borderRadius: '50%',
        }}
      />
      
      {/* Ambient Purple Glow */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.15, 0.08] }} 
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} 
        style={{ position: 'absolute', top: '10%', right: '5%', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.12) 0%, transparent 70%)', borderRadius: '50%' }} 
      />
      
      {/* Ambient Cyan Glow */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.06, 0.12, 0.06] }} 
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }} 
        style={{ position: 'absolute', bottom: '10%', left: '5%', width: '700px', height: '700px', background: 'radial-gradient(circle, rgba(0, 229, 255, 0.1) 0%, transparent 70%)', borderRadius: '50%' }} 
      />
    </div>
  );
};

const Footer = () => (
  <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '40px 20px', textAlign: 'center', background: 'rgba(3, 7, 18, 0.8)', backdropFilter: 'blur(10px)', position: 'relative', zIndex: 10, marginTop: 'auto' }}>
    <div className="site-footer" style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '16px', flexWrap: 'wrap' }}>
      <a href="mailto:support@bionex.health" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color='var(--primary)'} onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>support@bionex.health</a>
      <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color='var(--primary)'} onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>Terms of Service</a>
      <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color='var(--primary)'} onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>Privacy Policy</a>
    </div>
    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
      &copy; {new Date().getFullYear()} Bionex Health Systems. All rights reserved.
    </div>
  </footer>
);

function App() {
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 3200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <GlobalBackground />
        
        <AnimatePresence mode="wait">
          {isBooting ? (
            <BootScreen key="boot" />
          ) : (
            <motion.div key="main-app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <Navbar />
              <AnimatePresence mode="wait">
                <Routes>
                  {/* Public */}
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/emergency/:token" element={<EmergencyView />} />

                  {/* Patient */}
                  <Route path="/dashboard" element={<ProtectedRoute requiredRole="patient"><PatientDashboard /></ProtectedRoute>} />

                  {/* Doctor */}
                  <Route path="/doctor" element={<ProtectedRoute requiredRole="doctor"><DoctorDashboard /></ProtectedRoute>} />

                  {/* Admin */}
                  <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
                </Routes>
              </AnimatePresence>
              <Footer />
            </motion.div>
          )}
        </AnimatePresence>
        
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
