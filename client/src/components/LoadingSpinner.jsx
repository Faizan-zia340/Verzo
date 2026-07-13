import { motion } from 'framer-motion';

export default function LoadingSpinner({ size = 'md' }) {
  const dotSize = size === 'sm' ? 6 : size === 'lg' ? 12 : 9;
  const gap = size === 'sm' ? 'gap-1' : 'gap-1.5';
  const py = size === 'sm' ? 'py-2' : 'py-6';
  return (
    <div className={`flex justify-center items-center ${gap} ${py}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="rounded-full bg-indigo-500"
          style={{ width: dotSize, height: dotSize }}
          animate={{ y: [0, -8, 0], opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.14, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}
