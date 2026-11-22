import { useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import type { RefObject } from 'react';

// 1. useParallax - Smooth parallax scrolling effect
export function useParallax(offset: number = 50): { ref: RefObject<HTMLDivElement | null>; y: MotionValue<number> } {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);
  return { ref, y };
}

// 2. useImageScale - Scale image on scroll (1 → 1.1 as it scrolls through viewport)
export function useImageScale(range: [number, number] = [1, 1.08]): { ref: RefObject<HTMLDivElement | null>; scale: MotionValue<number> } {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });
  const scale = useTransform(scrollYProgress, [0, 1], range);
  return { ref, scale };
}

// 3. useSmoothCounter - Animate counting up to a target number
export function useSmoothCounter(target: number, duration: number = 1500): { ref: RefObject<HTMLDivElement | null>; count: number } {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      setCount(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isInView, target, duration]);

  return { ref, count };
}

// 4. useRevealOnScroll - Returns clip-path animation values for mask reveals
export function useRevealOnScroll(): { ref: RefObject<HTMLDivElement | null>; clipPath: MotionValue<string> } {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 85%', 'start 40%']
  });
  const clipPath = useTransform(
    scrollYProgress,
    [0, 1],
    ['inset(0 0 100% 0)', 'inset(0 0 0% 0)']
  );
  return { ref, clipPath };
}

// 5. useMagneticHover - Magnetic cursor-following effect for elements
export function useMagneticHover(strength: number = 0.3): {
  ref: RefObject<HTMLDivElement | null>;
  x: MotionValue<number>;
  y: MotionValue<number>;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseLeave: () => void;
} {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 150, damping: 15 });
  const y = useSpring(0, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * strength);
    y.set((e.clientY - centerY) * strength);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return { ref, x, y, handleMouseMove, handleMouseLeave };
}

// 6. Shared animation variants for reuse across components
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1
    }
  }
};

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  }
};

// 7. Character-by-character text reveal variant
export const charRevealContainer = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.025,
      delayChildren: 0.1
    }
  }
};

export const charRevealItem = {
  hidden: { opacity: 0, y: 40, rotateX: -60 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }
};

// 8. Smooth section entrance with clip-path
export const sectionReveal = {
  hidden: { opacity: 0, y: 60, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] }
  }
};

// 9. Image scale entrance
export const imageReveal = {
  hidden: { opacity: 0, scale: 1.15 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
  }
};

// 10. Line draw animation (for horizontal rules)
export const lineGrow = {
  hidden: { scaleX: 0, originX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }
  }
};
