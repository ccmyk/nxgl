// src/hooks/useMediaLoader.ts
// src/hooks/useMediaLoader.ts
'use client';

import { useEffect } from 'react';

export function useMediaLoader(root: HTMLElement | null) {
  useEffect(() => {
    if (!root) return;
    const imgs = Array.from(root.querySelectorAll('img'));
    const vids = Array.from(root.querySelectorAll('video'));

    imgs.forEach((img: HTMLImageElement) => {
      if (img.getAttribute('src')) return;
      const url = img.dataset.src;
      if (!url) return;
      const probe = new Image();
      probe.onload = () => {
        img.src = url;
        img.classList.add('Ldd');
        img.removeAttribute('data-src');
      };
      probe.onerror = () => { img.src = url; };
      probe.src = url;
      if (/\.(gif)$/.test(url)) {
        img.src = url;
        img.classList.add('Ldd');
      }
    });

    vids.forEach((v: HTMLVideoElement) => {
      if (v.getAttribute('src')) return;
      const url = v.dataset.src;
      if (!url) return;
      v.loop = !v.dataset.loop;
      v.muted = true;
      v.autoplay = true;
      v.playsInline = true as any;
      v.onplay = () => { (v as any).isPlaying = true; };
      v.oncanplay = () => {
        if ((v as any).isPlaying) {
          v.classList.add('Ldd');
          v.currentTime = 0;
        }
      };
      v.onerror = () => {};
      v.src = url;
      v.play().catch(() => {});
    });
  }, [root]);
}