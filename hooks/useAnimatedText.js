// hooks/useAnimatedText.js
'use client';

import { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import SplitType from 'split-type';

const FAKE_CHARS = '##·$%&/=€|()@+09*+]}{[';
const DEFAULT_TIMES = [0.3, 0.05, 0.16, 0.05, 0.016];

export function useAnimatedText(ref, isActive, options = {}) {
  const {
    splitType = 'chars,words',
    className = 'Awrite',
    visibleClass = 'ivi',
    delay = 0,
    fakeCount = 2,
    times = DEFAULT_TIMES,
    loop = false,
  } = options;

  const splitInstance = useRef(null);
  const timeline = useRef(null);
  const isInitialized = useRef(false);

  const setup = useCallback(() => {
    const el = ref.current;
    if (!el || isInitialized.current) return;

    el.classList.add(className);

    if (el.classList.contains('Atext') || el.classList.contains('Aline')) {
      const type = 'lines';
      splitInstance.current = new SplitType(el, { types: type });
      const lines = el.querySelectorAll('.line');
      lines.forEach((line, i) => line.dataset.params = i * 0.15);
      isInitialized.current = true;
      return;
    }

    splitInstance.current = new SplitType(el, { types: splitType });

    const chars = el.querySelectorAll('.char');
    chars.forEach(char => {
      const original = char.innerHTML;
      char.innerHTML = '';

      const nSpan = document.createElement('span');
      nSpan.className = 'n';
      nSpan.innerHTML = original;

      for (let i = 0; i < fakeCount; i++) {
        const fake = document.createElement('span');
        fake.className = 'f';
        fake.setAttribute('aria-hidden', 'true');
        fake.innerHTML = FAKE_CHARS[Math.floor(Math.random() * FAKE_CHARS.length)];
        char.appendChild(fake);
      }

      char.appendChild(nSpan);
      gsap.set(char.querySelectorAll('.f'), { display: 'inline-block', opacity: 1, scaleX: 1 });
      gsap.set(nSpan, { opacity: 0 });
    });

    gsap.set(el, { opacity: 0 });
    isInitialized.current = true;
  }, [ref]);

  useEffect(() => {
    setup();
    return () => {
      splitInstance.current?.revert();
      timeline.current?.kill();
      isInitialized.current = false;
    };
  }, [setup]);

  useEffect(() => {
    if (!isInitialized.current || !isActive || !ref.current) return;
    const el = ref.current;
    const chars = el.querySelectorAll('.char');

    const tl = gsap.timeline({
      onStart: () => el.classList.remove(visibleClass),
      onComplete: () => el.classList.add(visibleClass),
    });

    tl.set(el, { opacity: 1 }, 0);

    chars.forEach((char, i) => {
      const n = char.querySelector('.n');
      const fSpans = char.querySelectorAll('.f');

      tl.to(n, {
        opacity: 1,
        duration: times[0],
        ease: 'power4.inOut',
      }, i * times[1] + delay);

      fSpans.forEach((f, z) => {
        tl.fromTo(f, {
          scaleX: 1,
          opacity: 1,
        }, {
          scaleX: 0,
          opacity: 0,
          duration: times[2],
          ease: 'power4.inOut',
        }, delay + (i * times[3]) + ((1 + z) * times[4]))
        .set(f, { display: 'none' }, '>-0.01');
      });
    });

    timeline.current = tl;
    tl.play();
  }, [isActive]);
}