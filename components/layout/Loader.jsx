// components/layout/Loader.jsx
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import gsap from 'gsap';
import styles from './Loader.module.pcss';
import { useTextAnimation } from '@/hooks/useTextAnimation';
import WebGLLoader from '@/components/webgl/Loader';

export default function Loader({ onLoaded }) {
  const domLoaderRef = useRef(null); // Changed name for clarity
  const h1Ref = useRef(null);
  const h2Ref = useRef(null);
  const counterDisplayRef = useRef(null); // More descriptive name
  const webglLoaderInstanceRef = useRef(null); // For WebGL Loader instance methods

  const [counterTarget, setCounterTarget] = useState({ num: 0 }); // GSAP target
  const [startDomAnimations, setStartDomAnimations] = useState(false);
  const [isHidingProcess, setIsHidingProcess] = useState(false);

  useTextAnimation(h1Ref, startDomAnimations, { params: { delay: 0.1 } });
  useTextAnimation(h2Ref, startDomAnimations, { params: { delay: 0.15 } });

  useEffect(() => {
    const startTimer = setTimeout(() => setStartDomAnimations(true), 100);
    const counterAnim = gsap.timeline({ paused: true })
      .to(counterTarget, {
        num: 42, ease: 'none', duration: 2,
        onUpdate: () => {
          if (counterDisplayRef.current) { // Always check ref before access
            counterDisplayRef.current.textContent = String(Math.floor(counterTarget.num)).padStart(3, '0');
          }
        },
      }, 0)
      .to(counterTarget, {
        num: 90, ease: 'power2.inOut', duration: 8,
        onUpdate: () => {
          if (counterDisplayRef.current) {
            counterDisplayRef.current.textContent = String(Math.floor(counterTarget.num)).padStart(3, '0');
          }
        },
      }, 2.2);

    if (startDomAnimations) {
      counterAnim.play();
    }
    // Store on a general ref if needed, or directly use counterAnim
    if (!domLoaderRef.current) domLoaderRef.current = {};
    domLoaderRef.current.counterGsapAnim = counterAnim; // Store GSAP timeline

    return () => {
        clearTimeout(startTimer);
        counterAnim.kill();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDomAnimations]); // Removed counterTarget from deps as it's an object mutated by GSAP

  const hideLoader = useCallback(() => {
    if (isHidingProcess) return;
    setIsHidingProcess(true);
    // console.log("DOM Loader hide initiated");

    const counterAnim = domLoaderRef.current?.counterGsapAnim;
    if (counterAnim) {
        gsap.to(counterTarget, { // Animate the target object
            num: 100,
            duration: 0.49,
            ease: 'power2.inOut',
            onUpdate: () => {
                 if (counterDisplayRef.current) {
                     counterDisplayRef.current.textContent = String(Math.floor(counterTarget.num)).padStart(3, '0');
                 }
            },
            onComplete: () => {
                webglLoaderInstanceRef.current?.playFadeOut();
            }
        });
    } else {
        webglLoaderInstanceRef.current?.playFadeOut();
    }

    gsap.to(domLoaderRef.current, {
        opacity: 0,
        duration: 0.5,
        delay: 0.2,
        ease: 'power2.inOut',
        onComplete: () => {
            // console.log("DOM Loader visual fade out complete");
            // WebGL Loader's onFadeOutComplete will call the main onLoaded
        }
    });
  }, [isHidingProcess, counterTarget, domLoaderRef, webglLoaderInstanceRef]); // Added dependencies

   useEffect(() => {
    const demoHideTimer = setTimeout(() => {
        hideLoader();
    }, 1400); // Legacy timeout
    return () => clearTimeout(demoHideTimer);
  }, [hideLoader]);

   const handleWebGLLoaded = useCallback(() => {
       // console.log("WebGL Loader part finished.");
       if (onLoaded) {
           onLoaded();
       }
   }, [onLoaded]);

  return (
    <div ref={domLoaderRef} className={styles.loader}>
      <div className={styles.loader_bg}></div>
      <div className={`${styles.loader_cnt} c-vw`}> {/* Added global c-vw */}
        <div ref={counterDisplayRef} className={styles.loader_tp}>000</div>
        <div className={styles.loader_bp}>
          <h1 ref={h1Ref} className="Awrite" data-params="0.8">
            eva sánchez clemente
          </h1>
          <h2 ref={h2Ref} className="Awrite" data-params="0.8">
            interactive designer_ portfolio
          </h2>
        </div>
      </div>
       <WebGLLoader ref={webglLoaderInstanceRef} onFadeOutComplete={handleWebGLLoaded} />
    </div>
  );
}
