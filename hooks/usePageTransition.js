// hooks/usePageTransition.js
'use client';

import { useEffect, useContext } from 'react';
import { useRouter } from 'next/router'; // Assuming Next.js < 13 or using compatibility router
// If using Next.js 13+ App Router, you might need usePathname, useSearchParams, and router.push
import { useLenis } from '@/context/LenisContext'; // Assuming @ points to root
// Import other contexts if needed based on your Option 2 code:
// import { useWebGL } from '@/context/WebGLContext';
// import { AppEventsContext } from '@/context/AppEventsContext';

/**
 * Replicates legacy pop.js functionality for Next.js page transitions.
 */
export function usePageTransition() {
  const router = useRouter(); // Or alternative for App Router
  const lenisContext = useLenis();
  // const gl = useWebGL(); // Keep if needed
  // const { emit } = useContext(AppEventsContext); // Keep if needed

  useEffect(() => {
    const lenis = lenisContext?.lenis;
    const scrollTo = lenisContext?.scrollTo;

    // Guard against context not being available yet
    if (!lenis || !scrollTo) return;

    // 1. Handle browser back/forward (popstate)
    function onPopState(e) {
      // Legacy behavior seemed to just trigger router.back()
      router.back();
    }
    window.addEventListener('popstate', onPopState);

    // 2. Before Next.js route change
    function onRouteStart(url) {
      document.body.style.pointerEvents = 'none'; // Prevent interactions (legacy had similar concept with pHide)
      lenis.stop(); // Stop smooth scroll
      // gl?.cleanTemp?.(); // Original WebGL call
      // emit?.('pageHide'); // Original event emit
    }

    // 3. After Next.js route change is complete
    async function onRouteComplete(url) {
       // Scroll to top immediately, matching legacy options
       await scrollTo(0, { immediate: true, lock: true, force: true });

       document.body.style.pointerEvents = ''; // Re-enable interactions
       // gl?.show?.(); // Original WebGL call
       // emit?.('pageShow'); // Original event emit
       lenis.start(); // Resume smooth scroll
    }

    // Subscribe to Next.js router events
    router.events.on('routeChangeStart', onRouteStart);
    router.events.on('routeChangeComplete', onRouteComplete);

    // Cleanup listeners
    return () => {
      window.removeEventListener('popstate', onPopState);
      router.events.off('routeChangeStart', onRouteStart);
      router.events.off('routeChangeComplete', onRouteComplete);
    };
  }, [router, lenisContext]); // Rerun if router or lenis context changes
}