/**
 * Top floating navigation bar with auth state awareness.
 * Premium glassmorphic pill navbar with enlarged logo, no text branding.
 */
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';
import type { CSSProperties } from 'react';
// @ts-expect-error - image handled by vite
import bionexLogo from '../../assets/bionexlogo.png';

const navContainerStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 100,
  display: 'flex',
  justifyContent: 'center',
  padding: '20px 16px',
  pointerEvents: 'none',
};

const navContentStyle: CSSProperties = {
  pointerEvents: 'auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 28px',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  borderRadius: '60px',
  width: '100%',
  maxWidth: '1200px',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
};

const logoStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  position: 'relative',
  width: '140px', 
  height: '32px', 
};

const logoImgStyle: CSSProperties = {
  position: 'absolute',
  left: 0,
  top: '50%',
  marginTop: '-40px', 
  height: '80px',
  width: 'auto',
  filter: 'drop-shadow(0 0 16px rgba(0, 229, 255, 0.6))',
  transition: 'all 0.3s ease',
};

const navLinksStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const linkStyle: CSSProperties = {
  color: 'var(--text-muted)',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 500,
  padding: '8px 18px',
  borderRadius: '24px',
  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  letterSpacing: '0.01em',
};

const activeLinkStyle: CSSProperties = {
  ...linkStyle,
  color: 'var(--text-heading)',
  background: 'rgba(0, 229, 255, 0.08)',
  boxShadow: 'inset 0 0 0 1px rgba(0, 229, 255, 0.12)',
};

const ctaButtonStyle: CSSProperties = {
  ...linkStyle,
  background: 'linear-gradient(135deg, #00e5ff 0%, #0088cc 100%)',
  color: '#050a12',
  fontWeight: 700,
  fontSize: '13px',
  letterSpacing: '0.02em',
  padding: '9px 22px',
  boxShadow: '0 4px 16px -4px rgba(0, 229, 255, 0.4)',
};

const logoutBtnStyle: CSSProperties = {
  background: 'rgba(239, 68, 68, 0.08)',
  color: '#ef4444',
  border: '1px solid rgba(239, 68, 68, 0.15)',
  padding: '8px 20px',
  borderRadius: '24px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 600,
  fontFamily: 'var(--font-sans)',
  marginLeft: '8px',
  transition: 'all 0.25s ease',
};

export const Navbar = () => {
  const { isAuthenticated, user, logout, refreshToken } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { scrollY } = useScroll();

  // Shrink the navbar slightly when scrolling down
  const width = useTransform(scrollY, [0, 100], ['100%', '92%']);
  const padding = useTransform(scrollY, [0, 100], ['20px 16px', '12px 16px']);
  const navBg = useTransform(
    scrollY,
    [0, 80],
    ['rgba(8, 14, 28, 0)', 'rgba(8, 14, 28, 0.92)']
  );
  const navBorder = useTransform(
    scrollY,
    [0, 80],
    ['1px solid rgba(255, 255, 255, 0)', '1px solid rgba(255, 255, 255, 0.06)']
  );
  const navShadow = useTransform(
    scrollY,
    [0, 80],
    ['none', '0 8px 32px -8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.04)']
  );

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout/', { refresh: refreshToken });
    } catch {
      // Logout anyway
    }
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.div style={{ ...navContainerStyle, padding }}>
      <motion.nav
        className="nav-content"
        style={{ ...navContentStyle, width, background: navBg, border: navBorder, boxShadow: navShadow }}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      >
        {/* Logo only — no text branding */}
        <Link to="/" style={logoStyle}>
          <motion.img
            layoutId="bionex-logo"
            src={bionexLogo}
            alt="Bionex Logo"
            style={logoImgStyle}
            className="logo-img"
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          />
        </Link>

        <div className="nav-links-desktop" style={navLinksStyle}>
          {!isAuthenticated ? (
            <>
              <Link to="/login" style={isActive('/login') ? activeLinkStyle : linkStyle}>
                Login
              </Link>
              <Link to="/register" style={ctaButtonStyle}>
                Get Started
              </Link>
            </>
          ) : (
            <>
              {user?.role === 'patient' && (
                <Link to="/dashboard" style={isActive('/dashboard') ? activeLinkStyle : linkStyle}>
                  Dashboard
                </Link>
              )}
              {user?.role === 'doctor' && (
                <Link to="/doctor" style={isActive('/doctor') ? activeLinkStyle : linkStyle}>
                  Doctor Panel
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link to="/admin" style={isActive('/admin') ? activeLinkStyle : linkStyle}>
                  Admin Control
                </Link>
              )}
              <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.08)', margin: '0 8px' }} />
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
                {user?.name}
              </span>
              <motion.button
                style={logoutBtnStyle}
                whileHover={{ scale: 1.05, background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
              >
                Logout
              </motion.button>
            </>
          )}
        </div>
      </motion.nav>
    </motion.div>
  );
};
