// contexts/LenisContext.js
'use client';

import React, { createContext, useContext, useRef, useEffect, useCallback, useMemo } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';

const LenisContext = createContext(null);

const getLegacyLenisOptions = (isTouch = false) => ({
  lerp: 0.04, duration: 0.8, smoothWheel: !isTouch,
  smoothTouch: false, normalizeWheel: true,
});

export function LenisProvider({ children, isTouch }) {
  const lenisRef = useRef(null);
  const tickerCallbackRef = useRef(null);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    const options = getLegacyLenisOptions(isTouch);
    const lenis = new Lenis(options);
    lenisRef.current = lenis;
    lenis.stop(); // Start stopped
    document.documentElement.classList.add('lenis-stopped');
    document.documentElement.classList.remove('lenis-scrolling');

    const handleScroll = (e) => { /* ... (scroll class handling logic as before) ... */
        const { scroll, velocity, direction, targetScroll } = e;
        if (targetScroll > 0) { document.documentElement.classList.add('scroll-start'); }
        else { document.documentElement.classList.remove('scroll-start'); }
        if (direction === 1) { document.documentElement.classList.remove('scroll-up'); document.documentElement.classList.add('scroll-down'); }
        else if (direction === -1) { document.documentElement.classList.remove('scroll-down'); document.documentElement.classList.add('scroll-up'); }
        const isCurrentlyScrolling = Math.abs(velocity) > 0.1;
        if (isCurrentlyScrolling !== isScrollingRef.current) {
            if (isCurrentlyScrolling) { document.documentElement.classList.add('lenis-scrolling'); document.documentElement.classList.remove('lenis-stopped'); }
            else { document.documentElement.classList.remove('lenis-scrolling'); document.documentElement.classList.add('lenis-stopped'); }
            isScrollingRef.current = isCurrentlyScrolling;
        }
    };
    lenis.on('scroll', handleScroll);

    tickerCallbackRef.current = (time) => { lenisRef.current?.raf(time * 1000); };
    gsap.ticker.add(tickerCallbackRef.current);

    return () => {
      if (tickerCallbackRef.current) gsap.ticker.remove(tickerCallbackRef.current);
      lenisRef.current?.off('scroll', handleScroll);
      lenisRef.current?.destroy();
      lenisRef.current = null;
      document.documentElement.classList.remove('lenis-stopped', 'lenis-scrolling', 'scroll-start', 'scroll-up', 'scroll-down');
    };
  }, [isTouch]);

  // --- Lenis Control Methods ---
  const startScroll = useCallback(() => {
    lenisRef.current?.start();
    // Optional: Add legacy event dispatch if needed elsewhere
    // document.dispatchEvent(new Event('startscroll'));
  }, []);

  const stopScroll = useCallback(() => {
    lenisRef.current?.stop();
    // Optional: Add legacy event dispatch if needed elsewhere
    // document.dispatchEvent(new Event('stopscroll'));
  }, []);

  const scrollTo = useCallback((target, options = {}) => {
    lenisRef.current?.scrollTo(target, {
      offset: options.offset ?? 0, immediate: options.immediate ?? false,
      lock: options.lock ?? false, force: options.force ?? false,
      duration: options.duration ?? 1.2,
      easing: options.easing ?? ((t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))),
      ...options,
    });
     // Optional: Add legacy event dispatch if needed elsewhere
     // const event = new CustomEvent('scrollto', { detail: { target, options } });
     // document.dispatchEvent(event);
  }, []);

  // --- Context Value ---
  const value = useMemo(() => ({
    lenis: lenisRef, // Provide the ref
    startScroll,      // Provide control function
    stopScroll,       // Provide control function
    scrollTo,         // Provide control function
  }), [startScroll, stopScroll, scrollTo]); // Dependencies include the stable callbacks

  return (
    <LenisContext.Provider value={value}>
      {children}
    </LenisContext.Provider>
  );
}

// --- Hook ---
export function useLenis() {
  const context = useContext(LenisContext);
  if (context === null) {
    throw new Error('useLenis must be used within a LenisProvider');
  }
  // Return the ref and the control methods
  return context;
}
