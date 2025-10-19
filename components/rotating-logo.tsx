'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const rotatingWords = ['4You', '4Business', '4Everyone'];

export function RotatingLogo() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 3500); // Show each word for 3.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <Link href="/" className="flex items-center shrink-0 group">
      <div className="flex items-center gap-1">
        <span className="text-xl sm:text-2xl font-bold text-foreground transition-colors duration-300 group-hover:text-primary/80">
          Reserve
        </span>
        <div className="relative inline-flex items-center overflow-hidden rounded-lg bg-primary/10 px-2 py-1 border border-primary/20">
          <AnimatePresence mode="wait">
            <motion.span
              key={currentWordIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{
                type: 'spring',
                damping: 20,
                stiffness: 300,
                duration: 0.5
              }}
              className="text-xl sm:text-2xl font-bold text-primary whitespace-nowrap"
            >
              {rotatingWords[currentWordIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </Link>
  );
}

export function RotatingLogoMobile() {
  return (
    <Link href="/" className="flex items-center shrink-0">
      <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
        <span className="text-xl font-bold text-primary-foreground">R</span>
      </div>
    </Link>
  );
}

