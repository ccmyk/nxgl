// lib/browser.js

/**
 * Performs browser feature checks similar to legacy start🏁🏁🏁/browser🕸️.js
 * @returns {object} Object containing browser features and device info.
 */
function browserCheck() {
  // --- Device & Touch Detection ---
  const ua = navigator.userAgent.toLowerCase();
  // Enhanced touch detection including modern checks
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || /Mobi|Android|Tablet|iPad|iPhone/i.test(ua);
  const w = window.innerWidth;
  const h = window.innerHeight;
  let devnum = 0; // 0: Desktop, 1: Tablet Landscape, 2: Tablet Portrait, 3: Mobile
  let deviceclass = 'D'; // Default to Desktop class

  if (isTouch) {
    deviceclass = 'T'; // Base Touch class
    if (w > 767) { // Tablet breakpoint
      if (w > h) {
        devnum = 1; // Tablet Landscape
        // deviceclass = 'tabletL'; // Optional specific class
      } else {
        devnum = 2; // Tablet Portrait
        // deviceclass = 'tabletS'; // Optional specific class
      }
    } else {
      devnum = 3; // Mobile
      // deviceclass = 'mobile'; // Optional specific class
    }
  } else {
    // Desktop specific checks (e.g., large screen)
    if (w > 1780) { // Example large desktop breakpoint
      // devnum = -1; // Or keep as 0
    }
  }

  // --- WebP Support Check ---
  let isWebPCheck = false;
  try {
    const element = document.createElement('canvas');
    if (element.getContext && element.getContext('2d')) {
      isWebPCheck = element.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
  } catch (e) { /* Ignore error */ }

  // --- WebM Support Check (Simplified Safari check) ---
  let isWebMCheck = true;
  if (ua.includes('safari') && !ua.includes('chrome') && !ua.includes('chromium')) {
     // Basic check: Safari (non-Chrome/Edge) likely doesn't support WebM well
     // More robust checks might involve canPlayType('video/webm')
     isWebMCheck = false;
  }

  // --- Video Autoplay Check (Simplified) ---
  // True autoplay detection is complex. This provides a basic hint.
  // Assume autoplay works unless known issues (e.g., some mobile restrictions).
  // Legacy check seemed basic, so we'll default to true for now.
  let canAutoplay = true;
  // Add specific browser/OS checks here if needed based on known issues

  // --- WebGL Support Check ---
  let webglLevel = 0; // 0: None, 1: WebGL1, 2: WebGL2
  let webglSupport = false;
  try {
    const canvas = document.createElement('canvas');
    if (!!window.WebGL2RenderingContext && canvas.getContext('webgl2')) {
      webglLevel = 2;
      webglSupport = true;
    } else if (!!window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))) {
      webglLevel = 1;
      webglSupport = true;
    }
  } catch (e) { /* Ignore error */ }

  // Disable WebGL on Android based on legacy logic
  if (ua.includes("android")) {
      webglSupport = false;
      webglLevel = 0;
  }


  return {
    deviceclass: deviceclass, // 'D' or 'T'
    device: devnum,           // 0, 1, 2, 3
    isTouch: isTouch,         // boolean
    webp: webglSupport ? +isWebPCheck : 0, // Enable WebP only if WebGL is supported (legacy dependency?)
    webm: +isWebMCheck,       // boolean -> number (0 or 1)
    vidauto: +canAutoplay,    // boolean -> number (0 or 1)
    webgl: webglLevel,        // 0, 1, or 2
  };
}

// Optional: GL Check function separate if needed elsewhere
function glCheck() {
   // ... (implementation from browserCheck above) ...
   // return level or boolean
}

export default { browserCheck, glCheck }; // Export the main function
