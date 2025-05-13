// lib/browserFeatures.js
'use client';

import { useState, useEffect, useCallback } from 'react';

// Store detected features globally after first detection to avoid re-computation
let detectedFeaturesSingleton = null;

const performDetection = () => {
  if (typeof window === 'undefined') {
    // Return defaults for SSR or if window is not available
    return {
      deviceClass: 'desktop', // Default assumption
      deviceNum: 0,
      isTouch: false,
      supportsWebP: false,
      supportsWebM: false, // Safer default
      videoAutoplaySupported: false, // Safer default
      isFirefox: false,
      glVersion: null,
      isClient: false,
      viewport: { width: 0, height: 0 },
    };
  }

  // If already detected, return the singleton
  if (detectedFeaturesSingleton) {
    // Update viewport as it can change
    detectedFeaturesSingleton.viewport = { width: window.innerWidth, height: window.innerHeight };
    return detectedFeaturesSingleton;
  }

  // 1. Scroll Restoration
  if (window.history.scrollRestoration) {
    window.history.scrollRestoration = 'manual';
  }

  // 2. Device Detection (isTouch, deviceClass, deviceNum)
  const nav = window.navigator;
  const ua = nav.userAgent.toLowerCase();
  // Enhanced isTouch check from your legacy code
  const isTouch = /mobi|android|tablet|ipad|iphone/.test(ua) || (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);
  const w = window.innerWidth;
  const h = window.innerHeight;
  let deviceNum = 0;
  let deviceClass = '';

  // Clear any previous device classes from html element
  document.documentElement.classList.remove('D', 'T', 'desktop', 'mobile', 'tabletL', 'tabletS', 'CBff');

  if (!isTouch) {
    deviceClass = 'desktop';
    deviceNum = 0;
    document.documentElement.classList.add("D"); // Add "D" for Desktop
    if (w > 1780) deviceNum = -1; // Large desktop
  } else {
    deviceClass = 'mobile'; // Default for touch
    deviceNum = 3;         // Default for mobile
    if (w > 767) { // Likely a tablet
      deviceClass = (w > h) ? 'tabletL' : 'tabletS'; // Tablet Landscape or Portrait/Small
      deviceNum = (w > h) ? 1 : 2;
    }
    document.documentElement.classList.add("T"); // Add "T" for Touch
    document.documentElement.classList.add(deviceClass); // Add specific class e.g., "tabletL"
  }

  // 3. WebP Support Check
  let supportsWebP = false;
  try {
    const canvas = document.createElement('canvas');
    if (canvas.getContext && canvas.getContext('2d')) {
      supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
  } catch (e) { /* ignore */ }

  // 4. WebM Support Check (especially for non-Chrome Safari)
  let supportsWebM = true;
  if (ua.includes('safari') && !ua.includes('chrome')) {
    supportsWebM = false; // Pure Safari might have limitations
  }

    // 5. Video Autoplay Check (using a promise-based approach for modern check)
  let videoAutoplaySupported = false;
  const video = document.createElement('video');
  video.muted = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');

   // Check function - separate to avoid complexity in the main flow
  const checkAutoplay = async () => {
    try {
      await video.play();
      videoAutoplaySupported = true;
      // console.log('Video autoplay supported.');
    } catch (err) {
      videoAutoplaySupported = false;
      // console.log('Video autoplay not supported.');
    }
    // Clean up the video element
    video.remove();
  };
  // Call the check (it's async but we store the result in the singleton later)
  // For immediate return, this value might be premature.
  // The hook below handles the async nature better.

  // 6. Firefox Class
  const isFirefox = ua.includes('firefox');
  if (isFirefox) {
    document.documentElement.classList.add('CBff');
  }

  // 7. GL Version Check
  let glVersion = null;
  try {
    const canvas = document.createElement('canvas');
    if (!!window.WebGL2RenderingContext && (canvas.getContext('webgl2') || canvas.getContext('experimental-webgl2'))) {
      glVersion = 'webgl2';
    } else if (!!window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))) {
      glVersion = 'webgl';
    }
  } catch (e) { glVersion = false; }

  detectedFeaturesSingleton = {
    deviceClass,
    deviceNum,
    isTouch,
    supportsWebP,
    supportsWebM,
    videoAutoplaySupported, // Will be updated by async check if used via hook
    isFirefox,
    glVersion,
    isClient: true,
    viewport: { width: w, height: h },
  };

  // Trigger the async autoplay check, its result will be available if useBrowserFeatures is used
  // or if enough time passes before accessing detectedFeaturesSingleton.videoAutoplaySupported
  checkAutoplay().then(() => {
    if (detectedFeaturesSingleton) { // Update singleton after async check completes
        detectedFeaturesSingleton.videoAutoplaySupported = videoAutoplaySupported;
    }
  });


  return detectedFeaturesSingleton;
};

// Call once on initial client-side load to set classes and populate singleton
if (typeof window !== 'undefined' && !detectedFeaturesSingleton) {
    performDetection();
}

// React Hook to get these features and handle dynamic updates like viewport
export const useBrowserFeatures = () => {
  const [features, setFeatures] = useState(detectedFeaturesSingleton || initialBrowserFeatures);

  useEffect(() => {
    // Ensure client-side execution and get latest features
    const currentFeatures = performDetection(); // This will get from singleton or detect
    setFeatures(currentFeatures);

    const handleResize = () => {
      // Update viewport and potentially deviceClass if orientation changes affect it
      const updatedFeatures = performDetection(); // Re-run detection for responsive changes
      setFeatures(updatedFeatures);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Runs once on mount client-side

  return features;
};

// Direct function to get features (useful for non-React modules if needed, uses singleton)
export const getBrowserFeatures = () => {
  return detectedFeaturesSingleton || performDetection();
};