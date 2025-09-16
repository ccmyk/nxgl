// src/app/page.tsx
'use client';

import { useEffect, useRef } from 'react';
import { Bg } from '@/webgl/components/Bg/Bg';
import { Tt } from '@/webgl/components/Tt/Tt';

export default function Home()       {
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect() => {
    contentRef.current = document.querySelector('#content');
  }
}
