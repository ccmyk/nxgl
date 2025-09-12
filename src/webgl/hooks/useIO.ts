// src/webgl/hooks/useIO.ts
'use client';

import { useEffect } from 'react';
import { useOGLStore } from '../stores/ogl';

export function useIO(id: string, el: React.RefObject<HTMLElement>, onVis?: (vis: boolean, entry: IntersectionObserverEntry) => void) {
  const { register, unregister } = useOGLStore();

  useEffect(() => {
    const node = el.current;
    if (!node) return;

    const ioId = id;
    register({ id: ioId, el: node, active: -1 });

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        onVis?.(en.isIntersecting, en);
      });
    }, { threshold: [0] });

    obs.observe(node);
    return () => {
      obs.disconnect();
      unregister(ioId);
    };
  }, [id, el, register, unregister, onVis]);
}