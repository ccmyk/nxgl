// src/app/page.tsx
'use client';
import { useRef, useEffect } from 'react';
import { IOBridge } from '@/components/DOMBridge/IOBridge';
import { MediaBridge } from '@/components/DOMBridge/MediaBridge';
import { Tt } from '@/webgl/components/Tt/Tt';
import { Bg } from '@/webgl/components/Bg/Bg';
import { useSmartLinks } from '@/hooks/useSmartLinks';

export default function Home() {
  const contentRef = useRef<HTMLDivElement | null>(null);
+  useSmartLinks();

  useEffect(() => {
    contentRef.current = document.querySelector('#content');
  }, []);