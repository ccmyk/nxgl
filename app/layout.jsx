// app/layout.jsx
'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react'; // Removed unused 'useRef'
import './main.pcss';
import { WebGLProvider } from '@/contexts/WebGLContext';
import { LenisProvider } from '@/contexts/LenisContext';
import browserCheck from '@/lib/browser';

import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import Loader from '@/components/layout/Loader';
import MouseCursor from '@/components/layout/MouseCursor';
import TransitionLayout from '@/components/layout/TranslationLayout';
import { usePageTransition } from '@/hooks/usePageTransition';

export default function RootLayout({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [browserInfo, setBrowserInfo] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const info = browserCheck.browserCheck();
    setBrowserInfo(info);
    document.documentElement.classList.add(info.deviceclass || 'D');
    if (info.isTouch) document.documentElement.classList.add('touch');
    if (info.webgl === 0) document.documentElement.classList.add('NOGL');
    if (navigator.userAgent.toLowerCase().indexOf("android") > -1) {
        document.documentElement.classList.add('AND');
    }
    if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
        document.documentElement.classList.add('CBff');
    }
  }, []);

  const handleLoadComplete = useCallback(() => {
    // console.log("RootLayout: Loader sequence finished."); // Keep console logs for debugging if desired, or remove for production
    setIsLoading(false);
    setIsInitialLoad(false);
  }, []); // Removed onLoaded from dependencies as it's not used inside

  usePageTransition();

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
         <link rel="preload" href="/fonts/PPNeueMontreal-Medium.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
         <link rel="preload" href="/fonts/montrealbook.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <LenisProvider isTouch={browserInfo.isTouch}>
          <WebGLProvider>
            {isInitialLoad && isLoading && <Loader onLoaded={handleLoadComplete} />} {/* Removed unused ref */}
            <Nav currentTheme={browserInfo.prefersDark ? 'dark' : 'light'} /> {/* Example theme prop */}
            <TransitionLayout>
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
