// hooks/iuseScroll.js

"use client";

import { useEffect } from 'react';
import { useLenis } from '@/context/LenisContext';

export function usePageScroll() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;
    function handle(e) {
      const { scroll, velocity, direction, targetScroll } = e;
      // stview
      if (targetScroll > 0) document.documentElement.classList.add('stview');
      else document.documentElement.classList.remove('stview');
      // up/down
      if (direction === 'down') {
        document.documentElement.classList.remove('scroll-up');
        document.documentElement.classList.add('scroll-down');
      } else {
        document.documentElement.classList.remove('scroll-down');
        document.documentElement.classList.add('scroll-up');
      }
      // legacy scrollDetail event
      document.dispatchEvent(new CustomEvent('scrollDetail', { detail: e }));
    }
    lenis.on('scroll', handle);
    return () => lenis.off('scroll', handle);
  }, [lenis]);
}