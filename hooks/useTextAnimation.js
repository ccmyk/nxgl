// hooks/useTextAnimation.js
'use client';

import { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import SplitType from 'split-type';

// Default animation timings derived from main🐙🐙🐙/anims.js writeFn state 1 logic
// [nOpacityDur, nDelayStagger, fScaleDur, fDelayStagger, fInnerDelay]
const defaultTimes = [0.3, 0.05, 0.16, 0.05, 0.016];
const defaultParams = { delay: 0 }; // Default start delay

/**
 * Hook to apply legacy text reveal animation.
 * @param {React.RefObject} targetRef - Ref to the DOM element containing the text.
 * @param {boolean} isActive - Controls whether the reveal animation should play.
 * @param {object} options - Configuration options.
 * @param {string} [options.splitType='chars,words'] - How to split the text (passed to SplitType).
 * @param {object} [options.params={ delay: 0 }] - Animation parameters, primarily `delay`.
 * @param {boolean} [options.loop=false] - Whether the animation should loop (matches data-bucle).
 * @param {number[]} [options.times=defaultTimes] - Array of timing values for the animation stages.
 * @param {'hidden'|'visible'} [options.initialState='hidden'] - Initial visibility state before animation.
 * @param {string} [options.className='Awrite'] - Base class to add to the element.
 * @param {string} [options.visibleClass='ivi'] - Class added when the animation completes (matches legacy).
 * @param {Array} [options.triggerDependencies=[]] - Array of dependencies that should trigger a re-run of the animation if `isActive` is true.
 */
export function useTextAnimation(
  targetRef,
  isActive,
  options = {}
) {
  const {
    splitType = 'chars,words',
    params: userParams = {},
    loop = false,
    times: userTimes = [],
    initialState = 'hidden',
    className = 'Awrite', // Base class from legacy
    visibleClass = 'ivi', // Visible/idle class from legacy
    triggerDependencies = [], // Allow external triggers
  } = options;

  // Merge default and user options
  const params = { ...defaultParams, ...userParams };
  const times = [...defaultTimes]; // Create copy
  // Override default times with user times if provided
  userTimes.forEach((t, i) => { if (t !== undefined) times[i] = t; });

  const splitInstanceRef = useRef(null);
  const timelineRef = useRef(null);
  const isInitializedRef = useRef(false);
  const isActiveRef = useRef(isActive); // Ref to track isActive state for looping callback

  // Keep isActiveRef updated
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // --- Setup Text (writeCt logic) ---
  const setupText = useCallback(() => {
    if (!targetRef.current || isInitializedRef.current) return null;
    const element = targetRef.current;
    element.classList.add(className); // Add base class

    // Determine if inverted style is needed (could be passed via options if dynamic)
    const isInverted = element.classList.contains('Awrite-inv');

    const fakes = '##·$%&/=€|()@+09*+]}{['; // From writeCt
    const fakesLength = fakes.length;
    const fakeCharsPerReal = 2; // From writeCt loop u<l (assuming l=2)

    try {
      splitInstanceRef.current?.revert(); // Revert previous if exists
      const splitInstance = new SplitType(element, { types: splitType, tagName: 'span' });
      splitInstanceRef.current = splitInstance;

      (splitInstance.chars || []).forEach(charEl => {
        // Skip processing if it's just whitespace inside a char span
        if (charEl.innerHTML.trim() === '' && charEl.innerHTML.includes('&nbsp;')) {
           // Keep &nbsp; if that's the only content
           charEl.innerHTML = '&nbsp;';
           return;
        }
        if (charEl.innerHTML.trim() === '') {
            // If it's empty for other reasons, maybe clear it or leave it
            charEl.innerHTML = ''; // Clear potentially empty spans
            return;
        }

        const originalHTML = charEl.innerHTML;
        charEl.innerHTML = ''; // Clear current content

        // Create the 'n' span for the real character
        const nSpan = document.createElement('span');
        nSpan.className = 'n';
        nSpan.innerHTML = originalHTML; // Use original content
        charEl.appendChild(nSpan);

        // Create and prepend the 'f' spans for fake characters
        for (let u = 0; u < fakeCharsPerReal; u++) {
          const rnd = Math.floor(Math.random() * fakesLength);
          const fSpan = document.createElement('span');
          fSpan.className = 'f';
          fSpan.setAttribute('aria-hidden', 'true');
          fSpan.innerHTML = fakes[rnd];
          // Set background based on inversion (matches legacy .Awrite .char .f)
          fSpan.style.background = isInverted ? 'transparent' : 'var(--dark)'; // Use CSS vars
          charEl.insertBefore(fSpan, nSpan);
        }

        // Set initial styles for animation (matching setup for state 1)
        gsap.set(charEl.querySelectorAll('.f'), { display: 'inline-block', scaleX: 1, opacity: 1 });
        gsap.set(nSpan, { display: 'inline-block', opacity: 0 });
      });

      // Set initial visibility of the parent element
      gsap.set(element, { opacity: initialState === 'hidden' ? 0 : 1 });
      if (initialState === 'visible') {
        // If starting visible, set final state immediately
        gsap.set(element.querySelectorAll('.n'), { opacity: 1 });
        gsap.set(element.querySelectorAll('.f'), { scaleX: 0, opacity: 0, display: 'none' });
        element.classList.add(visibleClass); // Add idle class
      } else {
        element.classList.remove(visibleClass); // Ensure idle class is removed if starting hidden
      }

      isInitializedRef.current = true;
      return splitInstance;
    } catch (e) { console.error("SplitType Error in useTextAnimation:", e, element); return null; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetRef, splitType, initialState, className, visibleClass]); // Dependencies for setup

  // Effect 1: Run setup on mount/target change
  useEffect(() => {
    const instance = setupText();
    // Cleanup function
    return () => {
      timelineRef.current?.kill(); // Kill animation timeline
      instance?.revert(); // Revert SplitType changes
      isInitializedRef.current = false; // Reset initialization flag
    };
  }, [setupText]); // Run setup only once or if setup dependencies change

  // Effect 2: Trigger Animation based on isActive and triggerDependencies
  useEffect(() => {
    if (!targetRef.current || !isInitializedRef.current || !splitInstanceRef.current) return;

    const element = targetRef.current;
    const chars = splitInstanceRef.current.chars;
    if (!chars || chars.length === 0) return;

    timelineRef.current?.kill(); // Kill previous animation before starting new one

    if (isActive) {
      // --- Animation Logic (writeFn state 1 logic) ---
      const tl = gsap.timeline({
        paused: true,
        onStart: () => element.classList.remove(visibleClass), // Remove idle class on start
        onComplete: () => {
          element.classList.add(visibleClass); // Add idle class on completion
          if (loop && isActiveRef.current) { // Check loop flag and if still active
            gsap.delayedCall(0.5, () => { // Delay before restart
              if (isActiveRef.current && targetRef.current && isInitializedRef.current) {
                 // Reset initial styles before restarting
                 gsap.set(element.querySelectorAll('.f'), { display: 'inline-block', scaleX: 1, opacity: 1 });
                 gsap.set(element.querySelectorAll('.n'), { display: 'inline-block', opacity: 0 });
                 element.classList.remove(visibleClass);
                 tl.restart();
              }
            });
          }
        }
      });

      // Apply speed factor if needed (e.g., options.speedFactor)
      // tl.timeScale(options.speedFactor || 1);

      tl.set(element, { opacity: 1 }, 0); // Ensure parent element is visible

      chars.forEach((charEl, i) => {
        const n = charEl.querySelector('.n');
        const fSpans = charEl.querySelectorAll('.f');

        if (n) {
          tl.to(n, {
            opacity: 1,
            duration: times[0],
            immediateRender: false,
            ease: 'power4.inOut'
          }, (i * times[1]) + params.delay); // Stagger based on char index + initial delay
        }

        fSpans.forEach((f, z) => {
          // Ensure 'f' starts visible for the animation
          gsap.set(f, { display: 'inline-block', scaleX: 1, opacity: 1 });
          tl.to(f, {
            scaleX: 0,
            opacity: 0,
            immediateRender: false,
            duration: times[2],
            ease: 'power4.inOut'
             // Stagger based on char index (i), fake char index (z), and delays
          }, params.delay + ((i * times[3]) + ((1 + z) * times[4])))
          // Set display none *after* the animation completes for that specific 'f'
          .set(f, { display: 'none' }, '>'); // '>' places it at the very end of the previous tween
        });
      });

      timelineRef.current = tl;
      tl.play();

    } else {
      // When isActive becomes false, kill the animation.
      // If a specific "hide" animation (like state -1) is needed,
      // it would require a separate trigger or state.
      timelineRef.current?.kill();
      // Optionally reset to initial hidden state if desired when isActive goes false
      // if (initialState === 'hidden') {
      //    setupText(); // Re-run setup to reset styles (might cause flicker)
      //    gsap.set(element, { opacity: 0 });
      //    element.classList.remove(visibleClass);
      // }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, targetRef, params.delay, loop, times, className, visibleClass, isInitializedRef.current, ...triggerDependencies]); // Add triggerDependencies

}
