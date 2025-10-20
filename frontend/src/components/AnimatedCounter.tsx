import React, { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  to: number;
  duration?: number; // ms
  className?: string;
  prefix?: string;
  suffix?: string;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ to, duration = 1200, className, prefix = '', suffix = '' }) => {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    let raf: number;
    const step = (ts: number) => {
      if (startRef.current == null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      setValue(Math.floor(eased * to));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);

  return <span className={className}>{prefix}{value.toLocaleString()}{suffix}</span>;
};

export default AnimatedCounter;
