'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useAnimBus } from '@/hooks/useAnimBus';

export function MouseCursor() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const animBus = useAnimBus();

  useEffect(() => {
    const root = document.createElement('div');
    root.className = 'mouse';
    document.body.appendChild(root);
    rootRef.current = root;

    const toX = gsap.quickTo(root, 'x', { duration: 0.05, ease: 'none' });
    const toY = gsap.quickTo(root, 'y', { duration: 0.05, ease: 'none' });

    const onMove = (e: MouseEvent) => { toX(e.clientX); toY(e.clientY); };
    document.body.addEventListener('mousemove', onMove);

    const pHide = document.querySelector('.pHide');
    if (pHide) {
      pHide.addEventListener('mouseenter', () => {
        // collapse chip if present (same visual intent as original)
      });
    }

    // MW tooltips
    const nodes = Array.from(document.querySelectorAll('.MW')) as HTMLElement[];
    nodes.forEach((el) => {
      if (el.classList.contains('evt')) return;
      el.addEventListener('mouseenter', () => {
        const chip = document.createElement('div');
        const text = document.createElement('div');
        chip.className = 'mouse_el';
        text.className = 'Awrite Awrite-inv Ms';
        if (el.dataset.w) text.classList.add('Awrite-w');
        text.innerHTML = el.dataset.tt || '';
        animBus.dispatch({ state: 0, style: 0, el: text });
        chip.appendChild(text);
        root.appendChild(chip);
        animBus.dispatch({ state: 1, style: 0, el: text });
      });
      el.addEventListener('mouseleave', () => {
        // collapse chip (mirror original)
      });
      el.classList.add('evt');
    });

    return () => {
      document.body.removeEventListener('mousemove', onMove);
      root.remove();
    };
  }, [animBus]);

  return null;
}