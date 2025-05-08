// hooks/usePageScrollHandler.js
'use client';

import { useEffect, useRef } from 'react';
import { useLenis } from '@/context/LenisContext'; // Assuming @ points to root

// Threshold for determining if scrolling is active (adjust as needed)
const VELOCITY_THRESHOLD = 0.1; // Matches legacy check concept

export function usePageScrollHandler() {
  const lenisContext = useLenis();
  const isScrollingRef = useRef(false); // Ref to track scrolling state

  useEffect(() => {
    // Ensure lenis instance is available from context
    const lenis = lenisContext?.lenis;
    if (!lenis) return;

    function handleScroll(e) {
      const { scroll, velocity, direction, targetScroll } = e; // Lenis event object properties

      // 1. Handle scroll-start class (Matches legacy)
      if (targetScroll > 0) {
        if (!document.documentElement.classList.contains('scroll-start')) {
          document.documentElement.classList.add('scroll-start');
        }
      } else {
        if (document.documentElement.classList.contains('scroll-start')) {
          document.documentElement.classList.remove('scroll-start');
        }
      }

      // 2. Handle scroll direction classes (Matches legacy)
      if (direction === 1) { // 1 = down
        document.documentElement.classList.add('scroll-down');
        document.documentElement.classList.remove('scroll-up');
      } else if (direction === -1) { // -1 = up
        document.documentElement.classList.add('scroll-up');
        document.documentElement.classList.remove('scroll-down');
      }
      // Note: Lenis direction is -1 (up), 1 (down), 0 (stopped)

      // 3. Handle stview class (Matches refactor logic based on legacy needs)
      if (scroll > 0) { // Using `scroll` based on Option 2 examples
         if (!document.documentElement.classList.contains('stview')) {
           document.documentElement.classList.add('stview');
         }
      } else {
         if (document.documentElement.classList.contains('stview')) {
           document.documentElement.classList.remove('stview');
         }
      }

      // 4. Handle lenis-scrolling / lenis-stopped classes (Replicates legacy 'scroll-is' concept)
      const isCurrentlyScrolling = Math.abs(velocity) > VELOCITY_THRESHOLD;
      if (isCurrentlyScrolling) {
        if (!isScrollingRef.current) {
          document.documentElement.classList.add('lenis-scrolling');
          document.documentElement.classList.remove('lenis-stopped');
          isScrollingRef.current = true;
        }
      } else {
        if (isScrollingRef.current) {
          document.documentElement.classList.remove('lenis-scrolling');
          document.documentElement.classList.add('lenis-stopped');
          isScrollingRef.current = false;
        }
      }

      // 5. Dispatch legacy scrollDetail event (Matches refactor logic)
      document.dispatchEvent(new CustomEvent('scrollDetail', { detail: e }));
    }

    lenis.on('scroll', handleScroll);

    return () => {
      lenis.off('scroll', handleScroll);
      // Reset scrolling state ref on cleanup
      isScrollingRef.current = false;
      // Optional: Clean up classes on unmount, though provider does this too.
      // document.documentElement.classList.remove('lenis-stopped', 'lenis-scrolling', 'scroll-start', 'scroll-up', 'scroll-down', 'stview');
    };
  }, [lenisContext]); // Rerun effect if lenis instance changes
}