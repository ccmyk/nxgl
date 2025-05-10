// hooks/useIntersectionObserver.js
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to track element visibility using Intersection Observer.
 * @param {React.RefObject} elementRef - Ref to the DOM element to observe.
 * @param {IntersectionObserverInit} options - Intersection Observer options (threshold, root, rootMargin).
 * @param {boolean} freezeOnceVisible - If true, stops observing after the element becomes visible once.
 * @param {boolean} startObserving - If false, observation won't start until the observe function is called.
 * @returns {[boolean, IntersectionObserverEntry | null, () => void, () => void]} - [isIntersecting, entry, observe, unobserve]
 */
export function useIntersectionObserver(
  elementRef,
  options = { threshold: 0.1 }, // Default threshold slightly > 0
  freezeOnceVisible = false,
  startObserving = true
) {
  const [entry, setEntry] = useState(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef(null);
  const frozenRef = useRef(false); // Tracks if observation is frozen

  // Callback function for the Intersection Observer
  const handleIntersection = useCallback(([entry]) => {
    setEntry(entry); // Store the latest entry
    const intersecting = entry.isIntersecting;
    setIsIntersecting(intersecting);

    // If freezeOnceVisible is true and the element is intersecting, disconnect
    if (freezeOnceVisible && intersecting && observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null; // Clear the observer ref
      frozenRef.current = true; // Mark as frozen
      // console.log('Intersection observer frozen for element:', elementRef.current);
    }
  }, [freezeOnceVisible, elementRef]); // elementRef added for potential logging/debugging

  // Function to explicitly start observing
  const observe = useCallback(() => {
    const node = elementRef?.current;
    // Don't start if no node, already frozen, or already observing
    if (!node || frozenRef.current || observerRef.current) {
      return;
    }

    // console.log('Starting intersection observer for element:', node, options);
    observerRef.current = new IntersectionObserver(handleIntersection, options);
    observerRef.current.observe(node);
  }, [elementRef, options, handleIntersection]); // Dependencies for observe

  // Function to explicitly stop observing
  const unobserve = useCallback(() => {
    if (observerRef.current) {
      // console.log('Stopping intersection observer for element:', elementRef.current);
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    // Reset state if needed when manually unobserving
    frozenRef.current = false;
    setIsIntersecting(false);
    setEntry(null);
  }, [elementRef]); // elementRef added for potential logging/debugging

  // Effect to manage the observer lifecycle
  useEffect(() => {
    if (startObserving) {
      observe(); // Start observing if flag is true
    }
    // Cleanup function: disconnect observer when component unmounts or dependencies change
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null; // Clear ref on cleanup too
      }
    };
  }, [observe, startObserving]); // Re-run effect if observe function or startObserving flag changes

  // Return the intersecting state, the full entry, and control functions
  return [isIntersecting, entry, observe, unobserve];
}
