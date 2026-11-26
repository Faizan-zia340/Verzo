import { useEffect, useRef, useState } from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '../../lib/utils.js';

// Vengeance UI StatsCounter, converted from .tsx to .jsx (types stripped).
// Verzo's Vite build cannot compile .tsx files (vite.config forces the
// esbuild 'jsx' loader), so shadcn-CLI components need this conversion.
// Counts up when scrolled into view. Deps: framer-motion only.
export default function StatsCounter({
  value,
  duration = 1.5,
  prefix = '',
  suffix = '',
  decimals = 0,
  className,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: duration * 1000, bounce: 0 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      setDisplayValue(latest);
    });
    return unsubscribe;
  }, [springValue]);

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
}
