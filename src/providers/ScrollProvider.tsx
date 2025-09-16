// src/providers/ScrollProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Lenis from 'lenis';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { useAppStore } from '@/stores/app';
import { useVisibilityChange } from '@/hooks/useVisibilityChange';

interface ScrollContextType {
  lenis: Lenis | null;
  isScrolling: boolean;
}

const ScrollContext = createContext<ScrollContextType | null>(null);

export const useScroll = () => {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error('useScroll must be used within a ScrollProvider');
  }
  return context;
};

interface ScrollProviderProps {
  children: ReactNode;
}

export function ScrollProvider({ children }: ScrollProviderProps) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const pathname = usePathname();
  const { isMenuOpen } = useAppStore();
  const isVisible = useVisibilityChange();

  useEffect(() => {
    const newLenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    newLenis.on('scroll', (e: any) => {
      ScrollTrigger.update(e);
      setIsScrolling(true);
    });

    gsap.ticker.add((time) => {
      newLenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    setLenis(newLenis);

    // Stop scrolling when component unmounts
    return () => {
      newLenis.destroy();
      setLenis(null);
    };
  }, []);

  // Handle menu state
  useEffect(() => {
    if (lenis) {
      if (isMenuOpen) {
        lenis.stop();
      } else {
        lenis.start();
      }
    }
  }, [lenis, isMenuOpen]);

  // Handle tab visibility
  useEffect(() => {
    if (lenis) {
      if (isVisible) {
        lenis.start();
      } else {
        lenis.stop();
      }
    }
  }, [lenis, isVisible]);

  // Handle route changes
  useEffect(() => {
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    }
  }, [pathname, lenis]);

  // Handle scroll stop
  useEffect(() => {
    let scrollStopTimeout: NodeJS.Timeout;
    if (isScrolling) {
      scrollStopTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 200); // Adjust timeout as needed
    }
    return () => clearTimeout(scrollStopTimeout);
  }, [isScrolling]);


  return (
    <ScrollContext.Provider value={{ lenis, isScrolling }}>
      {children}
    </ScrollContext.Provider>
  );
}
