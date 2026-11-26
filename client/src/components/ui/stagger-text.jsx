import React from 'react';
import { motion } from 'framer-motion';

// Vengeance UI Stagger Text, converted from .tsx to .jsx (types stripped).
// Penlix's Vite build cannot compile .tsx files (vite.config forces the
// esbuild 'jsx' loader), so shadcn-CLI components need this conversion.
// Reveals words (or letters) one by one when scrolled into view.
// Deps: framer-motion only. Only supports plain-text children.
const EASE = [0.22, 1, 0.36, 1];

const container = (stagger, delay) => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: stagger,
      delayChildren: delay,
    },
  },
});

const item = {
  hidden: { y: '110%' },
  show: {
    y: '0%',
    transition: { duration: 0.6, ease: EASE },
  },
};

export function StaggerText({ children, delay = 0, divideBy = 'word' }) {
  if (typeof children !== 'string') {
    if (typeof children === 'number' || typeof children === 'boolean') {
      children = String(children);
    } else {
      console.warn('StaggerText only supports plain text/string children.');
      return <>{children}</>;
    }
  }

  const text = children;
  const parts = divideBy === 'letter' ? text.split('') : text.split(' ');
  const stagger = divideBy === 'letter' ? 0.02 : 0.05;

  return (
    <motion.span
      variants={container(stagger, delay)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      style={{ display: 'inline-block' }}
    >
      {parts.map((part, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden relative"
          style={{ verticalAlign: 'top' }}
        >
          <motion.span
            variants={item}
            className="inline-block will-change-transform"
          >
            {divideBy === 'letter' ? (part === ' ' ? '\u00A0' : part) : part + '\u00A0'}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

export default StaggerText;
