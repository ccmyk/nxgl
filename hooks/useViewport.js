// hooks/useViewport.js
'use client'; // Needs useState and useEffect

import { useState, useEffect, useCallback } from 'react';

export function useViewport() {
  const [viewport, setViewport] = useState({
    width: 0,
    height: 0,
  });

  const handleResize = useCallback(() => {
    setViewport({
      width: window.innerWidth,
      height: window.innerHeight,
    });
    // Update CSS variable for height (optional, could also be done in layout)
    // This replicates --ck_hvar dynamic update, useful for mobile VH issues
    document.documentElement.style.setProperty("--ck_hvar", `${window.innerHeight}px`);
    document.documentElement.style.setProperty("--ck_hscr", `${window.innerHeight}px`); // Assuming hscr should also track viewport height on desktop
    document.documentElement.style.setProperty("--ck_hmin", `${window.innerHeight}px`); // Assuming hmin should also track viewport height
  }, []);

  useEffect(() => {
    // Set initial size
    handleResize();

    window.addEventListener('resize', handleResize);
    // Also consider orientation change for mobile/tablet logic if needed later
    // window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      // window.removeEventListener('orientationchange', handleResize);
    };
  }, [handleResize]); // Include handleResize in dependency array

  return viewport;
}