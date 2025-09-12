// src/hooks/useScrollCheck.ts
'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/app';

export function useScrollCheck() {
  const lenis = useAppStore((s) => s.lenis);
  const setSpeed = useAppStore((s) => s.setSpeed);

  useEffect(() => {
    if (!lenis) return;
    const onScroll = ({ velocity }: any) => {
      setSpeed(velocity);
      const root = document.documentElement;
      root.classList.toggle('scroll-up', velocity < 0);
      root.classList.toggle('scroll-start', lenis.targetScroll > 0);
    };
    lenis.on('scroll', onScroll);
    return () => lenis.off('scroll', onScroll);
  }, [lenis, setSpeed]);
}