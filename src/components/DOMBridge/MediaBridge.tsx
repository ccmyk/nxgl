// src/components/DOMBridge/MediaBridge.tsx
'use client';

import { useMediaLoader } from '@/hooks/useMediaLoader';

export function MediaBridge({ root }: { root: HTMLElement | null }) {
  useMediaLoader(root);
  return null;
}