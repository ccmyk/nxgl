// src/hooks/useInViewClass.ts
'use client';

import { useEffect } from 'react';

export function useInViewClass(el: HTMLElement | null, onEnter?: () => void, onLeave?: () => void) {
  useEffect(() => {
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (en.isIntersecting) {
          el.classList.add('stview', 'inview');
          onEnter?.();
        } else {
          el.classList.remove('inview');
          onLeave?.();
        }
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [el, onEnter, onLeave]);
}