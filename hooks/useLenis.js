// hooks/useLenis.js
'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';


const defaultOptions = {
  lerp: 0.04,
  duration: 0.8,
  smoothWheel: true, 
  smoothTouch: false, 
  normalizeWheel: true,
};

export function useLenis(options = defaultOptions, deps = []) {
  const lenisRef = useRef(null);
  const reqIdRef = useRef(null);

  useEffect(() => {
    const lenis = new Lenis({ ...defaultOptions, ...options });
    lenisRef.current = lenis;

    // Add scroll event listener from original main/index.js createScrollCheck
    // Might need adjustment based on where scrollFn logic lives in React
    // lenis.on('scroll', scrollFn); // Assuming scrollFn is defined/imported

    function raf(time) {
      lenis.raf(time);
      reqIdRef.current = requestAnimationFrame(raf);
    }

    reqIdRef.current = requestAnimationFrame(raf);

    // Initial class based on stopped state (matches original)
    document.documentElement.classList.add('lenis-stopped'); // Ensure this matches initial state
    document.documentElement.classList.remove('lenis-scrolling');

    lenis.on('scroll', ({ velocity }) => {
      if (Math.abs(velocity) > 0.1) { // Threshold to detect movement
         document.documentElement.classList.add('lenis-scrolling');
         document.documentElement.classList.remove('lenis-stopped');
         // Add scroll-start/scroll-up logic here if needed globally
      } else {
         document.documentElement.classList.remove('lenis-scrolling');
         document.documentElement.classList.add('lenis-stopped');
      }
    });


    return () => {
      cancelAnimationFrame(reqIdRef.current);
      // lenis.off('scroll', scrollFn); // Remove listener
      lenis.destroy(); // Clean up Lenis instance
      lenisRef.current = null;
       document.documentElement.classList.remove('lenis-stopped', 'lenis-scrolling');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, ...deps]); // Rerun effect if options or external deps change

  return lenisRef; // Return the ref, allowing access to the Lenis instance if needed
}