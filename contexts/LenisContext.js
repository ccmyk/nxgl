// contexts/LenisContext.js (or .jsx)
'use client';

import React, { createContext, useContext, useRef, useEffect, useCallback, useMemo, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';

const LenisContext = createContext(null);

// Options based on your legacy setup
const getLenisOptions = (isTouchDevice = false) => ({
  lerp: isTouchDevice ? 0.1 : 0.07, // Example: slightly different lerp for touch
  duration: 1.2, // From your scrollTo example, or adjust
  smoothWheel: !isTouchDevice,
  smoothTouch: isTouchDevice, // Enable smooth touch if desired
  normalizeWheel: true, // Usually good to keep
});

export function LenisProvider({ children, isTouch: isTouchDeviceProp }) {
  const lenisRef = useRef(null);
  const tickerCallbackRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Determine isTouch. Default to false if prop not provided initially.
  const isTouch = typeof isTouchDeviceProp === 'boolean' ? isTouchDeviceProp : false;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const options = getLenisOptions(isTouch);
    const lenis = new Lenis(options);
    lenisRef.current = lenis;
    setIsReady(true);

    // Start stopped, as per loader sequence logic
    lenis.stop();
    document.documentElement.classList.add('lenis-stopped');
    document.documentElement.classList.remove('lenis-scrolling');

    const handleScroll = (e) => {
      const { velocity, direction, targetScroll } = e;
      if (targetScroll > 0) {
        document.documentElement.classList.add('scroll-start');
      } else {
        document.documentElement.classList.remove('scroll-start');
      }

      if (direction === 1) {
        document.documentElement.classList.remove('scroll-up');
        document.documentElement.classList.add('scroll-down');
      } else if (direction === -1) {
        document.documentElement.classList.remove('scroll-down');
        document.documentElement.classList.add('scroll-up');
      }

      const currentlyScrolling = Math.abs(velocity) > 0.02;
      if (currentlyScrolling !== isScrolling) {
          setIsScrolling(currentlyScrolling);
          if (currentlyScrolling) {
              document.documentElement.classList.add('lenis-scrolling');
              document.documentElement.classList.remove('lenis-stopped');
          } else {
              document.documentElement.classList.remove('lenis-scrolling');
              document.documentElement.classList.add('lenis-stopped');
          }
      }
    };

    lenis.on('scroll', handleScroll);

    // Use GSAP ticker for Lenis updates
    tickerCallbackRef.current = (time) => {
      lenisRef.current?.raf(time * 1000); // Lenis expects milliseconds
    };
    gsap.ticker.add(tickerCallbackRef.current);

    return () => {
      if (tickerCallbackRef.current) {
        gsap.ticker.remove(tickerCallbackRef.current);
        tickerCallbackRef.current = null;
      }
      lenisRef.current?.off('scroll', handleScroll);
      lenisRef.current?.destroy();
      lenisRef.current = null;
      setIsReady(false);
      // Clear classes on unmount
      document.documentElement.classList.remove(
        'lenis-stopped', 'lenis-scrolling',
        'scroll-start', 'scroll-up', 'scroll-down'
      );
    };
  }, [isTouch, isScrolling]); // Added isScrolling to dependencies of useEffect

  const startScroll = useCallback(() => {
    if (lenisRef.current && isReady) {
        lenisRef.current.start();
        // Class update might be slightly delayed due to event, force it if needed
        // document.documentElement.classList.remove('lenis-stopped');
        // document.documentElement.classList.add('lenis-scrolling'); // Or let event handle
        console.log("Lenis: Scrolling STARTED via startScroll()");
    }
  }, [isReady]);

  const stopScroll = useCallback(() => {
    if (lenisRef.current && isReady) {
        lenisRef.current.stop();
        // document.documentElement.classList.add('lenis-stopped');
        // document.documentElement.classList.remove('lenis-scrolling');
        console.log("Lenis: Scrolling STOPPED via stopScroll()");
    }
  }, [isReady]);

  const scrollTo = useCallback((target, options = {}) => {
    if (lenisRef.current && isReady) {
        lenisRef.current.scrollTo(target, {
            offset: options.offset ?? 0,
            immediate: options.immediate ?? false,
            lock: options.lock ?? false,
            force: options.force ?? false, // Not a standard Lenis option, remove if not custom
            duration: options.duration ?? 1.2, // Default duration from your example
            easing: options.easing ?? ((t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))), // Default easing
            ...options, // Pass through other valid Lenis options
        });
    }
  }, [isReady]);

  const value = useMemo(() => ({
    lenisInstance: lenisRef.current, // Expose the instance directly if needed by advanced components
    startScroll,
    stopScroll,
    scrollTo,
    isScrolling, // Expose scrolling state
    isLenisReady: isReady, // Expose ready state
  }), [startScroll, stopScroll, scrollTo, isScrolling, isReady]); // isReady added

  return (
    <LenisContext.Provider value={value}>
      {children}
    </LenisContext.Provider>
  );
}

export function useLenis() {
  const context = useContext(LenisContext);
  if (context === null) {
    throw new Error('useLenis must be used within a LenisProvider');
  }
  return context;
}