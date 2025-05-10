// app/layout.jsx
'use client';

import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import './main.pcss';
import { WebGLProvider } from '@/contexts/WebGLContext';
import { LenisProvider } from '@/contexts/LenisContext';
import browserCheck from '@/lib/browser';

// Import Layout Components
import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import Loader from '@/components/layout/Loader'; // DOM Loader
import MouseCursor from '@/components/MouseCursor';
import TransitionLayout from '@/components/layout/TransitionLayout'; // Page transition wrapper
import { usePageTransition } from '@/hooks/usePageTransition'; // Functional page transition logic

export default function RootLayout({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [browserInfo, setBrowserInfo] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Track if it's the very first load

  // 1. Browser Checks & Global Classes
  useEffect(() => {
    const info = browserCheck.browserCheck();
    setBrowserInfo(info);
    document.documentElement.classList.add(info.deviceclass || 'D');
    if (info.isTouch) {
      document.documentElement.classList.add('touch');
    }
    if (info.webgl === 0) {
      document.documentElement.classList.add('NOGL');
    }
    if (navigator.userAgent.toLowerCase().indexOf("android") > -1) {
      document.documentElement.classList.add('AND');
    }
    if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
      document.documentElement.classList.add('CBff');
    }
  }, []);

  // 2. Loader completion callback
  const handleLoadComplete = useCallback(() => {
    console.log("RootLayout: Loader sequence finished.");
    setIsLoading(false);
    setIsInitialLoad(false); // Mark initial load as complete
  }, []);

  // 3. Initialize Page Transition Logic Hook
  usePageTransition(); // Call this to set up router event listeners

  if (!browserInfo) {
    return (
       <html lang="en">
         <head>
             <meta name="viewport" content="width=device-width, initial-scale=1" />
             <title>Loading Environment...</title>
         </head>
         <body><div>Detecting Environment...</div></body>
       </html>
    );
  }

  return (
    <html lang="en">
      <head>
         <meta name="viewport" content="width=device-width, initial-scale=1" />
         <title>Chris Hall - Art Director & Designer</title>
         {/* Preload fonts defined in main.pcss */}
         <link rel="preload" href="/fonts/PPNeueMontreal-Medium.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
         <link rel="preload" href="/fonts/montrealbook.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
         {/* Add other preloads if necessary */}
      </head>
      <body>
        <LenisProvider isTouch={browserInfo.isTouch}>
          <WebGLProvider> {/* WebGLProvider now loads font assets */}

            {/* Render Loader only on the very first load of the application */}
            {isInitialLoad && isLoading && <Loader onLoaded={handleLoadComplete} />}

            {/* Persistent Layout Components */}
            <Nav />

            <TransitionLayout> {/* Wraps page content for animations */}
              <div id="content">
                <Suspense fallback={<div>Loading Page...</div>}>
                  <main>{children}</main>
                </Suspense>
              </div>
            </TransitionLayout>

            <Footer />

            {!browserInfo.isTouch && <MouseCursor />}

          </WebGLProvider>
        </LenisProvider>

        <div className="pHide"></div>
        <noscript>
          <style>{`.lazyload[data-src] { display: none !important; }`}</style>
        </noscript>
      </body>
    </html>
  );
}
