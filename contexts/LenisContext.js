// context/LenisContext.js
'use client';

import React, { createContext, useContext, useRef, useEffect, useCallback, useMemo } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap'; // Assuming GSAP is used for the ticker

const LenisContext = createContext(null);

// Helper function to get legacy options
const getLegacyLenisOptions = (isTouch = false) => ({
  // wheelEventsTarget: document.documentElement, // Optional: only if needed and tested
  lerp: 0.04,
  duration: 0.8,
  smoothWheel: !isTouch, // Use touch detection result here
  smoothTouch: false,
  normalizeWheel: true,
  // Add other legacy options if they existed and are needed
});

export function LenisProvider({ children, isTouch }) { // Pass isTouch prop if needed for options
  const lenisRef = useRef(null);
  const tickerCallbackRef = useRef(null);

  useEffect(() => {
    // 1. Instantiate Lenis with legacy-matched options
    const options = getLegacyLenisOptions(isTouch);
    lenisRef.current = new Lenis(options);

    // 2. Initial State (Stopped) & Class
    lenisRef.current.stop(); // Start stopped like legacy
    document.documentElement.classList.add('lenis-stopped');
    document.documentElement.classList.remove('lenis-scrolling');

    // 3. Sync RAF loop with GSAP ticker (Assumed)
    // Store the callback in a ref to ensure the latest lenis instance is used
    tickerCallbackRef.current = (time, deltaTime, frame) => {
        // Lenis expects time in milliseconds
        lenisRef.current?.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallbackRef.current);

    // 4. Cleanup
    return () => {
      if (tickerCallbackRef.current) {
        gsap.ticker.remove(tickerCallbackRef.current);
        tickerCallbackRef.current = null;
      }
      lenisRef.current?.destroy(); // Destroy Lenis instance
      lenisRef.current = null;
      document.documentElement.classList.remove('lenis-stopped', 'lenis-scrolling', 'scroll-start', 'scroll-up', 'scroll-down', 'stview'); // Clean up all classes
    };
  }, [isTouch]); // Re-run if touch status changes options

  // scrollTo helper matching legacy defaults (duration/easing can be overridden)
  const scrollTo = useCallback((target, options = {}) => {
    lenisRef.current?.scrollTo(target, {
      offset: options.offset ?? 0,
      immediate: options.immediate ?? false,
      lock: options.lock ?? false,
      force: options.force ?? false, // Added legacy option
      duration: options.duration ?? 1.2, // Default duration can be adjusted
      easing: options.easing ?? ((t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))), // Default easing can be adjusted
      ...options, // Allow overriding defaults
    });
  }, []);

  // Context value
  const value = useMemo(() => ({
    lenis: lenisRef.current, // Provide the instance itself
    scrollTo,
  }), [scrollTo, lenisRef.current]); // Update value if lenis instance changes (on mount)

  return (
    <LenisContext.Provider value={value}>
      {children}
    </LenisContext.Provider>
  );
}

// Custom hook to consume the context
export function useLenis() {
  const context = useContext(LenisContext);
  // Optionally add a check here if context is null when not wrapped,
  // though typically the provider is at the root.
  // if (context === null) {
  //   throw new Error('useLenis must be used within a LenisProvider');
  // }
  return context; // Returns { lenis: instance, scrollTo: function }
}