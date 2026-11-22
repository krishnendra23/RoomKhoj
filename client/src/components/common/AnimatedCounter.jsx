import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

export default function AnimatedCounter({ value = 0, duration = 600 }) {
  const shouldReduceMotion = useReducedMotion();
  const numericValue = Number(value) || 0;
  const [display, setDisplay] = useState(shouldReduceMotion ? numericValue : 0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplay(numericValue);
      return;
    }

    let rafId;
    const startTime = performance.now();
    const startVal = 0;

    const tick = (now) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startVal + (numericValue - startVal) * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [numericValue, duration, shouldReduceMotion]);

  return <span>{display.toLocaleString('en-IN')}</span>;
}
