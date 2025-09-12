// src/components/DOMBridge/IOBridge.tsx
'use client';

import { useEffect } from 'react';
import { useAnimBus } from '@/hooks/useAnimBus';

export function IOBridge({ root }: { root: HTMLElement | null }) {
  const { dispatch } = useAnimBus();

  useEffect(() => {
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll('.iO'));
    const obs = new IntersectionObserver((entries) => {
      for (const en of entries) {
        const parent = en.target.parentElement as HTMLElement | null;
        if (!parent) continue;
        if (en.isIntersecting) {
          parent.classList.add('inview', 'stview');
          if (en.target.classList.contains('iO-std')) {
            dispatch({ style: 0, state: 1, el: parent });
            if (parent.dataset.bucle) parent.classList.add('okF');
          }
        } else {
          parent.classList.remove('inview', 'okF');
          dispatch({ style: 0, state: -1, el: parent });
        }
      }
    }, { threshold: [0, 1] });
    nodes.forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, [root, dispatch]);

  return null;
}