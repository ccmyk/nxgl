// hooks/useIntersectionObserver.js
'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to track element visibility using Intersection Observer.
 * Based on the setup found in js🧠🧠🧠/page👁️/ios.js and gl🌊🌊🌊/ios.js
 */
export function useIntersectionObserver(
  elementRef,
  options = { threshold: 0, root: null, rootMargin: '0px' },
  freezeOnceVisible = false, // Option to stop observing after first intersection
  startObserving = true // Option to delay observation start
) {
  const [entry, setEntry] = useState(null); // Stores the IntersectionObserverEntry
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef(null);
  const frozenRef = useRef(false);

  const observe = useCallback(() => {
    const node = elementRef?.current;
    if (!node || frozenRef.current || observerRef.current) return;

    observerRef.current = new IntersectionObserver(([entry]) => {
      setEntry(entry); // Store the full entry
      const intersecting = entry.isIntersecting;
      setIsIntersecting(intersecting);

      if (freezeOnceVisible && intersecting && observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
        frozenRef.current = true;
      }
    }, options);

    observerRef.current.observe(node);
  }, [elementRef, options, freezeOnceVisible]); // useCallback dependencies

  const unobserve = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
      frozenRef.current = false;
      setIsIntersecting(false);
      setEntry(null);
    }
  }, []); // No dependencies needed for unobserve

  useEffect(() => {
    if (startObserving) {
      observe();
    }
    // Cleanup function
    return () => {
      unobserve();
    };
    // Observe/Unobserve when startObserving flag changes or other deps change
  }, [observe, unobserve, startObserving]);

  // Return state, entry, and control functions
  return [isIntersecting, entry, observe, unobserve];
}