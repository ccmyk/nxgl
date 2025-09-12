// src/providers/RouteTransitionsProvider.tsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/stores/app';

export function RouteTransitionsProvider(props: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { lenis, setIsLoad, setUrl } = useAppStore();

  useEffect(() => {
    setIsLoad(1);
    lenis?.stop();
    setUrl(pathname);

    requestAnimationFrame(() => {
      lenis?.scrollTo(0, { immediate: true, lock: true, force: true });
      setTimeout(() => {
        lenis?.start();
        setIsLoad(0);
      }, 600);
    });
  }, [pathname, lenis, setIsLoad, setUrl]);

  return props.children;
}