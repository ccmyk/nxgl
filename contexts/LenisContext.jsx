// contexts/LenisContext.jsx
'use client';

import Lenis from '@studio-freight/lenis';
import { createContext, useEffect, useContext, useRef } from 'react';

const LenisContext = createContext(null);
export const useLenisContext = () => useContext(LenisContext);

export default function LenisProvider({ children }) {
  const lenisRef = useRef(null);

  useEffect(() => {
    lenisRef.current = new Lenis();
    const raf = (time) => {
      lenisRef.current.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    return () => lenisRef.current.destroy();
  }, []);

  return <LenisContext.Provider value={lenisRef}>{children}</LenisContext.Provider>;
}