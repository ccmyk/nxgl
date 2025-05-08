// components/layout/TransitionLayout.jsx
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation'; // Use App Router hook

export default function TransitionLayout({ children }) {
  const pathname = usePathname();

  // Define animation variants
  const variants = {
    initial: {
      opacity: 0,
      // y: 20, // Optional slide effect
    },
    animate: {
      opacity: 1,
      // y: 0,
      transition: {
        duration: 0.6, // Match legacy animOut/animIntro duration?
        ease: [0.65, 0, 0.35, 1], // Example ease (cubic-bezier)
      },
    },
    exit: {
      opacity: 0,
      // y: -20, // Optional slide effect
      transition: {
        duration: 0.4, // Faster exit?
        ease: [0.65, 0, 0.35, 1],
      },
    },
  };

  return (
    <AnimatePresence mode="wait"> {/* 'wait' ensures exit animation finishes before enter starts */}
      <motion.div
        key={pathname} // Key change triggers animation on route change
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
