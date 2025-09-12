'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/app';

export function BootProvider(props: { children: React.ReactNode }) {
  const { setDevice, setIsTouch } = useAppStore();

  useEffect(() => {
    const isTouch =
      /Mobi|Android|Tablet|iPad|iPhone/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    const w = window.innerWidth;
    const h = window.innerHeight;
    let device = 0;
    if (!isTouch) {
      device = w > 1780 ? -1 : 0;
      document.documentElement.classList.add('D');
    } else {
      document.documentElement.classList.add('T');
      if (w > 767) device = w > h ? 1 : 2;
      else device = 3;
    }

    // WebGL flag/class parity (optional)
    const canvas = document.createElement('canvas');
    const hasGL =
      !!(window as any).WebGL2RenderingContext ||
      !!canvas.getContext('webgl') ||
      !!canvas.getContext('experimental-webgl');
    if (!hasGL || /android/i.test(navigator.userAgent)) {
      document.documentElement.classList.add('AND');
    }

    setDevice(device);
    setIsTouch(!!isTouch);
  }, [setDevice, setIsTouch]);

  return props.children;
}