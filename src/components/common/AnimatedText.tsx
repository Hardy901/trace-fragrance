import React from 'react';
import { motion, useInView } from 'framer-motion';
import type { Variants } from 'framer-motion';

interface AnimatedTextProps {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
  delay?: number;
  once?: boolean;
  splitBy?: 'char' | 'word';
}

const customEase = [0.16, 1, 0.3, 1] as const;

const charAnimation: Variants = {
  hidden: { opacity: 0, y: 50, rotateX: -80 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      duration: 0.45,
      ease: customEase,
      delay: i * 0.02
    }
  })
};

const wordAnimation: Variants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(4px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: customEase,
      delay: i * 0.06
    }
  })
};

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  className = '',
  as = 'h2',
  delay = 0,
  once = true,
  splitBy = 'char'
}) => {
  const Tag = as;
  const animation = splitBy === 'char' ? charAnimation : wordAnimation;
  
  if (splitBy === 'word') {
    const words = text.split(' ');
    return (
      <Tag className={className}>
        <motion.span
          initial="hidden"
          whileInView="visible"
          viewport={{ once, margin: '-80px' }}
          className="inline-block"
        >
          {words.map((word, wordIndex) => (
            <motion.span
              key={wordIndex}
              custom={wordIndex + (delay * 10)}
              variants={animation}
              className="inline-block mr-[0.3em]"
              style={{ perspective: '600px' }}
            >
              {word}
            </motion.span>
          ))}
        </motion.span>
      </Tag>
    );
  }

  // Character split with line preservation
  const lines = text.split('\n');
  
  let globalCharIndex = 0;

  return (
    <Tag className={className}>
      <motion.span
        initial="hidden"
        whileInView="visible"
        viewport={{ once, margin: '-80px' }}
      >
        {lines.map((line, lineIndex) => (
          <span key={lineIndex} className="block overflow-hidden" style={{ perspective: '800px' }}>
            {line.split('').map((char) => {
              const currentIndex = globalCharIndex++;
              return (
                <motion.span
                  key={currentIndex}
                  custom={currentIndex + (delay * 20)}
                  variants={animation}
                  className="inline-block"
                  style={{ 
                    whiteSpace: char === ' ' ? 'pre' : 'normal'
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              );
            })}
          </span>
        ))}
      </motion.span>
    </Tag>
  );
};

// Animated line/divider component
export const AnimatedLine: React.FC<{ className?: string; delay?: number }> = ({ 
  className = '', 
  delay = 0 
}) => (
  <motion.div
    initial={{ scaleX: 0 }}
    whileInView={{ scaleX: 1 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay }}
    className={`origin-left ${className}`}
  />
);

// Animated counter component
export const AnimatedCounter: React.FC<{
  value: string;
  className?: string;
  prefix?: string;
  suffix?: string;
}> = ({ value, className = '', prefix = '', suffix = '' }) => {
  // Extract numeric part from value string (e.g., "40%" -> 40, "18–24h" -> 18)
  const numericMatch = value.match(/(\d+)/);
  const numericTarget = numericMatch ? parseInt(numericMatch[1], 10) : 0;
  const ref = React.useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const [displayValue, setDisplayValue] = React.useState('0');

  React.useEffect(() => {
    if (!isInView) return;
    
    const duration = 1200;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * numericTarget);
      
      // Replace the first number in the original string with the animated value
      setDisplayValue(value.replace(/\d+/, current.toString()));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isInView, numericTarget, value]);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {prefix}{displayValue}{suffix}
    </motion.span>
  );
};
