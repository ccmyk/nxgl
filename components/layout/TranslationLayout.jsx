// components/layout/TransitionLayout.jsx
'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { useLenis } from '@/contexts/LenisContext'; // To stop/start scroll

export default function TransitionLayout({ children }) {
  const pathname = usePathname();
  const contentRef = useRef(null);
  const { lenis } = useLenis(); // Get Lenis instance ref

  useEffect(() => {
    const pageElement = contentRef.current;
    if (!pageElement) {return;}

    const lenisInstance = lenis?.current;

    // Stop Lenis during transition
    lenisInstance?.stop();

    // Intro animation (matches legacy animIntro)
    // Ensure element starts at opacity 0 if it's a new page
    gsap.set(pageElement, { opacity: 0 }); // Set initial state for incoming page
    const tl = gsap.timeline({
      onComplete: () => {
        lenisInstance?.start(); // Resume scroll after intro
      }
    });

    tl.to(pageElement, {
      opacity: 1,
      duration: 0.45, // Legacy duration
      delay: 0.1,     // Legacy delay
      ease: 'power2.inOut', // Example ease
    });

    // Handle exit animation when pathname changes for the *outgoing* page
    // This requires a more complex setup with a library like react-transition-group
    // or a custom hook to manage previous children.
    // For a simpler GSAP approach without extra libraries for exit:
    // We'd typically trigger an exit animation *before* Next.js unmounts the old page.
    // This can be done by listening to router events in usePageTransition.js
    // and having it control a global "isTransitioning" state or call an exit function.

    // For now, this focuses on the enter animation.
    // The `usePageTransition` hook already handles stopping Lenis on routeChangeStart
    // and starting it on routeChangeComplete.

    return () => {
      tl.kill(); // Kill GSAP animation on unmount
    };
  }, [pathname, lenis]); // Re-run on pathname change

  return (
    <div ref={contentRef} style={{ opacity: 0 }}> {/* Start with opacity 0 */}
      {children}
    </div>
  );
}
