// src/hooks/useResizeSync.ts
'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/app';

export function useResizeSync() {
  const setScreen = useAppStore((s) => s.setScreen);

  useEffect(() => {
    const apply = () => {
      const doc = document.documentElement;
      doc.style.setProperty('--ck_hscr', window.innerHeight + 'px');
      doc.style.setProperty('--ck_hvar', window.innerHeight + 'px');
      doc.style.setProperty('--ck_hmin', window.innerHeight + 'px');
      setScreen(window.innerWidth, window.innerHeight);
    };
    apply();
    const onResize = () => {
      clearTimeout((window as any).__rsz);
      (window as any).__rsz = setTimeout(apply, 200);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [setScreen]);
}