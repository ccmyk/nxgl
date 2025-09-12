// src/hooks/useSmartLinks.ts
'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/app';


export function useSmartLinks(scope?: HTMLElement | Document) {
  const lenis = useAppStore((s) => s.lenis);

  useEffect(() => {
    const root = scope || document;
    const links = Array.from(root.querySelectorAll('a')) as HTMLAnchorElement[];
    links.forEach((a) => {
      const isAnchor = a.href.includes('#');
      const local = a.origin === window.location.origin;
      if (!local && !isAnchor && !a.href.startsWith('mailto') && !a.href.startsWith('tel')) {
        a.rel = 'noopener';
        a.target = '_blank';
        return;
      }
      a.onclick = (e) => {
        if (isAnchor) {
          e.preventDefault();
          const id = a.href.split('#')[1];
          if (id) lenis?.scrollTo('#' + id, { offset: -100 });
        }
      };
    });
  }, [lenis, scope]);
}