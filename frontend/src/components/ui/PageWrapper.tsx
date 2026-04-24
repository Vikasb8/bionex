/**
 * Framer Motion page transition wrapper.
 */
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

export const PageWrapper = ({ children, noPadding = false }: { children: ReactNode; noPadding?: boolean }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="enter"
    exit="exit"
    style={{ minHeight: '100vh', paddingTop: noPadding ? 0 : '100px' }}
  >
    {children}
  </motion.div>
);
