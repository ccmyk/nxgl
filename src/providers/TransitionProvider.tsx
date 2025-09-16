// src/providers/TransitionProvider.tsx
"use client";

import { createContext, useContext, useState, useRef, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';

interface TransitionContextType {
  playTransition: (href: string) => void;
}

const TransitionContext = createContext<TransitionContextType | null>(null);

export const useTransition = () => {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error('useTransition must be used within a TransitionProvider');
  }
  return context;
};

export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

  const playTransition = useCallback((href: string) => {
    gsap.to(overlayRef.current, {
      opacity: 1,
      duration: 0.5,
      ease: 'power2.inOut',
      onComplete: () => {
        router.push(href);
        // Fade out on the new page
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.5,
          delay: 0.5, // Wait for page to load
          ease: 'power2.inOut',
        });
      },
    });
  }, [router]);

  return (
    <TransitionContext.Provider value={{ playTransition }}>
      {children}
      <div
        ref={overlayRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#000000',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      />
    </TransitionContext.Provider>
  );
}

