// components/layout/Loader.jsx
'use client';

import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap'; // Import GSAP
import styles from './Loader.module.pcss';
import { useTextAnimation } from '@/hooks/useTextAnimation'; // Import the text animation hook
import WebGLLoader from '@/components/webgl/Loader'; // Import the WebGL Loader

export default function Loader({ onLoaded }) { // Add prop to signal completion
  const loaderRef = useRef(null);
  const h1Ref = useRef(null);
  const h2Ref = useRef(null);
  const counterRef = useRef(null); // Ref for the number display
  const webglLoaderRef = useRef(null); // Ref to call WebGL fade out

  const [counterState, setCounterState] = useState({ num: 0 }); // State for GSAP target
  const [startAnimations, setStartAnimations] = useState(false);
  const [isHiding, setIsHiding] = useState(false); // State to control hiding

  // --- Text Animations ---
  // Trigger text animations when startAnimations is true
  // Delays match the legacy loader's sequence
  useTextAnimation(h1Ref, startAnimations, { params: { delay: 0.1 } }); // Small delay after start
  useTextAnimation(h2Ref, startAnimations, { params: { delay: 0.15 } }); // Slightly later

  // --- Counter Animation ---
  useEffect(() => {
    // Start counter and text animations slightly after mount
    const startTimer = setTimeout(() => setStartAnimations(true), 100); // Small delay

    // GSAP Counter Animation (mirrors legacy Loader createAnim)
    const counterAnim = gsap.timeline({ paused: true })
      .to(counterState, {
        num: 42, ease: 'none', duration: 2,
        onUpdate: () => counterRef.current.textContent = String(Math.floor(counterState.num)).padStart(3, '0'),
      }, 0)
      .to(counterState, {
        num: 90, ease: 'power2.inOut', duration: 8, // Longer duration like legacy
        onUpdate: () => counterRef.current.textContent = String(Math.floor(counterState.num)).padStart(3, '0'),
      }, 2.2); // Start second phase later

    if (startAnimations) {
      counterAnim.play();
    }

    // Store timeline in ref for later control
    const storeTimeline = (tl) => {
        if (!loaderRef.current) loaderRef.current = {}; // Ensure ref object exists
        loaderRef.current.counterAnim = tl;
    };
    storeTimeline(counterAnim);


    return () => {
        clearTimeout(startTimer);
        counterAnim.kill(); // Cleanup GSAP animation
    };
  }, [startAnimations, counterState]); // Rerun if startAnimations changes

  // --- Fade Out Logic ---
  useEffect(() => {
    // This effect simulates the parent component telling the loader to hide
    // In a real app, this would be triggered by actual loading completion
    const hideTimer = setTimeout(() => {
        console.log("Triggering Loader Hide");
        hideLoader();
    // }, 5000); // Example: Hide after 5 seconds for testing
    }, 1400); // Match legacy timeout

    return () => clearTimeout(hideTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount for demo

  // Function to initiate hiding sequence
  const hideLoader = useCallback(() => {
    if (isHiding) return; // Prevent multiple calls
    setIsHiding(true);
    console.log("Loader hide initiated");

    // 1. Accelerate counter to 100%
    const counterAnim = loaderRef.current?.counterAnim;
    if (counterAnim) {
        gsap.to(counterState, {
            num: 100,
            duration: 0.49, // Fast completion
            ease: 'power2.inOut',
            onUpdate: () => {
                 if (counterRef.current) { // Check if ref exists
                     counterRef.current.textContent = String(Math.floor(counterState.num)).padStart(3, '0');
                 }
            },
            onComplete: () => {
                // 2. Trigger WebGL fade out *after* counter hits 100
                webglLoaderRef.current?.playFadeOut();
            }
        });
    } else {
        // If counter anim doesn't exist, trigger WebGL immediately
        webglLoaderRef.current?.playFadeOut();
    }

    // 3. Fade out the DOM Loader container (slightly delayed)
    gsap.to(loaderRef.current, { // Target the main loader div
        opacity: 0,
        duration: 0.5,
        delay: 0.2, // Matches legacy delay
        ease: 'power2.inOut',
        onComplete: () => {
            // DOM loader fade out complete (WebGL handles its own completion)
            console.log("DOM Loader fade out complete");
            // Note: The WebGL onFadeOutComplete callback will call the parent's onLoaded
        }
    });


  }, [isHiding, counterState]); // Include counterState

   // Callback passed to WebGL Loader
   const handleWebGLLoaded = useCallback(() => {
       console.log("WebGL Loader fade out notified completion.");
       if (onLoaded) {
           onLoaded(); // Notify parent component
       }
   }, [onLoaded]);


  return (
    // Use the ref here
    <div ref={loaderRef} className={styles.loader}>
      <div className={styles.loader_bg}></div>
      <div className={`${styles.loader_cnt} ${styles.c_vw}`}>
        {/* Attach ref to the number display */}
        <div ref={counterRef} className={styles.loader_tp}>000</div>
        <div className={styles.loader_bp}>
          {/* Attach refs for text animation */}
          <h1 ref={h1Ref} className="Awrite" data-params="0.8"> {/* Add Awrite class if hook relies on it */}
            eva sánchez clemente
          </h1>
          <h2 ref={h2Ref} className="Awrite" data-params="0.8">
            interactive designer_ portfolio
          </h2>
        </div>
      </div>
       {/* Render the WebGL Loader Component */}
       <WebGLLoader ref={webglLoaderRef} onFadeOutComplete={handleWebGLLoaded} />
    </div>
  );
}
