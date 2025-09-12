// src/providers/LenisProvider.tsx
'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { useAppStore } from '@/stores/app';

export function LenisProvider(props: { children: React.ReactNode }) {
  const setLenis = useAppStore((s) => s.setLenis);

  useEffect(() => {
    const lenis = new Lenis({
      wheelEventsTarget: document.documentElement,
      lerp: 0.04,
      duration: 0.8,
      smoothWheel: true,
      smoothTouch: false,
      normalizeWheel: true
    });
    setLenis(lenis);

    const raf = (t: number) => {
      lenis.raf(t);
      requestAnimationFrame(raf);
    };
    const id = requestAnimationFrame(raf);

    const onVis = () => {
      if (document.visibilityState === 'hidden') lenis.stop();
      else lenis.start();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener('visibilitychange', onVis);
      lenis.destroy();
    };
  }, [setLenis]);

  return props.children;
}