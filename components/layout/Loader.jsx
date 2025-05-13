// components/layout/Loader.jsx
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import gsap from 'gsap';
import styles from './Loader.module.pcss';
import { useAnimatedText } from '@/hooks/useAnimatedText';
import WebGLLoader from '@/components/webgl/Loader';

export default function Loader({ onLoaded }) {
  const domLoaderRef = useRef(null);
  const h1Ref = useRef(null);
  const h2Ref = useRef(null);
  const counterDisplayRef = useRef(null);
  const webglLoaderInstanceRef = useRef(null);

  const [counterTarget, setCounterTarget] = useState({ num: 0 });
  const [startDomAnimations, setStartDomAnimations] = useState(false);
  const [isHidingProcess, setIsHidingProcess] = useState(false);

  useAnimatedText(h1Ref, startDomAnimations, { params: { delay: 0.1 }, initialState: 'hidden' });
  useAnimatedText(h2Ref, startDomAnimations, { params: { delay: 0.15 }, initialState: 'hidden' });

  useEffect(() => {
    const startTimer = setTimeout(() => setStartDomAnimations(true), 100);

    const counterAnim = gsap.timeline({ paused: true })
      .to(counterTarget, {
        num: 42,
        ease: 'none',
        duration: 2,
        onUpdate: () => {
          if (counterDisplayRef.current) {
            counterDisplayRef.current.textContent = String(Math.floor(counterTarget.num)).padStart(3, '0');
          }
        },
      }, 0)
      .to(counterTarget, {
        num: 90,
        ease: 'power2.inOut',
        duration: 8,
        onUpdate: () => {
          if (counterDisplayRef.current) {
            counterDisplayRef.current.textContent = String(Math.floor(counterTarget.num)).padStart(3, '0');
          }
        },
      }, 2.2);

    if (startDomAnimations) {
      counterAnim.play();
    }

    domLoaderRef.current.counterGsapAnim = counterAnim;

    return () => {
      clearTimeout(startTimer);
      counterAnim.kill();
    };
  }, [startDomAnimations]);

  const hideLoader = useCallback(() => {
    if (isHidingProcess) return;
    setIsHidingProcess(true);

    const counterAnim = domLoaderRef.current?.counterGsapAnim;
    if (counterAnim) {
      gsap.to(counterTarget, {
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
      ease: 'power2.inOut'
    });
  }, [isHidingProcess, counterTarget]);

  useEffect(() => {
    const demoHideTimer = setTimeout(() => {
      hideLoader();
    }, 1400);
    return () => clearTimeout(demoHideTimer);
  }, [hideLoader]);

  const handleWebGLLoaded = useCallback(() => {
    if (onLoaded) onLoaded();
  }, [onLoaded]);

  return (
    <div ref={domLoaderRef} className={styles.loader}>
      <div className={styles.loader_bg}></div>
      <div className={`${styles.loader_cnt} c-vw`}>
        <div ref={counterDisplayRef} className={styles.loader_tp}>000</div>
        <div className={styles.loader_bp}>
          <h1 ref={h1Ref} className="Awrite" data-params="0.8">
            chris hall
          </h1>
          <h2 ref={h2Ref} className="Awrite" data-params="0.8">
            interactive designer_portfolio
          </h2>
        </div>
      </div>
      <WebGLLoader ref={webglLoaderInstanceRef} onFadeOutComplete={handleWebGLLoaded} />
    </div>
  );
}
