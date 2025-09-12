// src/providers/AppEventsProvider.tsx
'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/app';
import { useResizeSync } from '@/hooks/useResizeSync';
import { useScrollCheck } from '@/hooks/useScrollCheck';
import { useAnimBus } from '@/hooks/useAnimBus';
import { useOGLStore } from '@/webgl/stores/ogl';

export function AppEventsProvider(props: { children: React.ReactNode }) {
  const { lenis } = useAppStore();
  useResizeSync();
  useScrollCheck();

  useEffect(() => {
    const off = useAnimBus.getState().on((d) => {
      if (d.style === 1) {
        const run = async () => {
          lenis?.scrollTo(0, { immediate: true, lock: true, force: true });
          await new Promise((r) => setTimeout(r, 600));
          const st = Array.isArray(d.params) ? d.params[0] : d.state;
          useOGLStore.getState().changeSlides(Number(st) || 0);
        };
        run();
      }
    });
    return off;
  }, [lenis]);

  return props.children;
}