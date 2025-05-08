// hooks/useTextAnimation.js
'use client';

import { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import SplitType from 'split-type';

// Default animation timings derived from main🐙🐙🐙/anims.js writeFn logic
const defaultTimes = [0.22, 0.05, 0.16, 0.05, 0.016]; // [nOpacityDur, nDelayStagger, fScaleDur, fDelayStagger, fInnerDelay] - Check these values against anims.js carefully if different timings were used (e.g. Ms)
const defaultParams = { delay: 0 }; // Default delay is 0

export function useTextAnimation(
  targetRef,
  isActive,
  options = {}
) {
  const {
    splitType = 'chars,words',
    params = defaultParams, // Should contain { delay: number } matching original trigger time/data-params[0]
    loop = false,          // Matches data-bucle="1"
    times = defaultTimes,  // Animation timings
    initialState = 'hidden',
    className = 'Awrite',  // Class to add for potential CSS targeting
  } = options;

  const splitInstanceRef = useRef(null);
  const timelineRef = useRef(null);
  const isInitializedRef = useRef(false);
  const isActiveRef = useRef(isActive); // Ref to track isActive state for looping callback

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // --- Setup Text (writeCt logic) ---
  const setupText = useCallback(() => {
    if (!targetRef.current || isInitializedRef.current) return null;
    const element = targetRef.current;
    element.classList.add(className);
    const fakes = '##·$%&/=€|()@+09*+]}{['; // From writeCt
    const fakesLength = fakes.length;
    const fakeCharsPerReal = 2; // From writeCt (hardcoded loop u<2)

    try {
      splitInstanceRef.current?.revert(); // Revert previous if exists
      const splitInstance = new SplitType(element, { types: splitType, tagName: 'span' });
      splitInstanceRef.current = splitInstance;

      (splitInstance.chars || []).forEach(charEl => {
        if (charEl.innerHTML.trim() === '' && charEl.innerHTML.includes(' ')) {
          // Preserve whitespace
        } else if (charEl.innerHTML.trim() !== '') {
          const originalHTML = charEl.innerHTML;
          charEl.innerHTML = '';
          const nSpan = document.createElement('span');
          nSpan.className = 'n';
          nSpan.innerHTML = originalHTML;
          charEl.appendChild(nSpan);
          for (let u = 0; u < fakeCharsPerReal; u++) {
            const rnd = Math.floor(Math.random() * fakesLength);
            const fSpan = document.createElement('span');
            fSpan.className = 'f';
            fSpan.setAttribute('aria-hidden', 'true');
            fSpan.innerHTML = fakes[rnd];
            charEl.insertBefore(fSpan, nSpan);
          }
          // Initial states exactly matching the setup for state 1 animation
          gsap.set(charEl.querySelectorAll('.f'), { display: 'inline-block', scaleX: 1, opacity: 1 });
          gsap.set(nSpan, { display: 'inline-block', opacity: 0 });
        }
      });

      gsap.set(element, { opacity: initialState === 'hidden' ? 0 : 1 });
      if (initialState === 'visible') {
        gsap.set(element.querySelectorAll('.n'), { opacity: 1 });
        gsap.set(element.querySelectorAll('.f'), { scaleX: 0, opacity: 0, display: 'none' });
        element.classList.add('ivi'); // .ivi seems to be the 'is visible/idle' class
      }

      isInitializedRef.current = true;
      return splitInstance;
    } catch (e) { console.error("SplitType Error:", e); return null; }
  }, [targetRef, splitType, initialState, className]); // Dependencies for setup

  // Effect 1: Run setup
  useEffect(() => {
    const instance = setupText();
    return () => {
      timelineRef.current?.kill();
      instance?.revert();
      isInitializedRef.current = false;
    };
  }, [setupText]); // Run setup only once

  // Effect 2: Trigger Animation
  useEffect(() => {
    if (!targetRef.current || !isInitializedRef.current || !splitInstanceRef.current) return;

    const element = targetRef.current;
    const chars = splitInstanceRef.current.chars;
    if (!chars || chars.length === 0) return;

    const currentParams = { ...defaultParams, ...params }; // Use provided delay
    const currentTimes = [...times]; // Use provided timings

    timelineRef.current?.kill(); // Kill previous animation

    if (isActive) {
      // --- Animation Logic (writeFn state 1 logic) ---
      const tl = gsap.timeline({
        paused: true,
        onStart: () => element.classList.remove('ivi'), // Remove idle class
        onComplete: () => {
          element.classList.add('ivi'); // Add idle class
          if (loop && isActiveRef.current) { // Check loop flag and if still active
            gsap.delayedCall(0.5, () => { // Delay before restarting
              if (isActiveRef.current && targetRef.current) {
                tl.restart();
              }
            });
          }
        }
      });

      // Apply speed factor if it was used (original 'params[1]' wasn't clearly speed)
      // tl.timeScale(currentParams.speedFactor || 1);

      tl.set(element, { opacity: 1 }, 0); // Ensure parent visible

      chars.forEach((charEl, i) => {
        const n = charEl.querySelector('.n');
        const fSpans = charEl.querySelectorAll('.f');

        if (n) {
          tl.to(n, {
            opacity: 1,
            duration: currentTimes[0],
            immediateRender: false,
            ease: 'power4.inOut' // Easing from original writeFn
          }, (i * currentTimes[1]) + currentParams.delay); // Stagger + Delay
        }

        fSpans.forEach((f, z) => {
          gsap.set(f, { scaleX: 1, opacity: 1 }); // Ensure f starts visible
          tl.to(f, {
            scaleX: 0,
            opacity: 0,
            immediateRender: false,
            duration: currentTimes[2],
            ease: 'power4.inOut' // Easing from original writeFn
             // Apply delay + stagger logic for fake chars
          }, currentParams.delay + ((i * currentTimes[3]) + ((1 + z) * currentTimes[4])))
          .set(f, { display: 'none' }, '>');
        });
      });
      timelineRef.current = tl;
      tl.play();

    } else {
      // When isActive becomes false, we simply kill the timeline.
      // If a specific "hide" animation is needed, it should be triggered explicitly
      // based on the state change in the component using the hook.
      // The previous 'power2.out' fade was incorrect.
      timelineRef.current?.kill(); // Stop any ongoing animation
       if (element.classList.contains('ivi')) { // If it was visible/idle, maybe reset opacity? Or leave as is?
           // Optional: gsap.set(element, { opacity: 0 }); // Reset to hidden only if needed
           // element.classList.remove('ivi');
       }
    }
  // Dependencies trigger re-run when isActive or config changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, targetRef, params, loop, times, className, isInitializedRef.current]);

}