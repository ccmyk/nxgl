// app/layout.jsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import './main.pcss';
import { WebGLProvider } from '@/contexts/WebGLContext';
import { LenisProvider } from '@/contexts/LenisContext';
import browserCheck from '@/lib/browser';

import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import Loader from '@/components/layout/Loader';
import MouseCursor from '@/components/layout/MouseCursor';
import TranslationLayout from '@/components/layout/TranslationLayout';
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
    if (/android/i.test(navigator.userAgent)) {
      document.documentElement.classList.add('AND');
    }
    if (/firefox/i.test(navigator.userAgent)) {
      document.documentElement.classList.add('CBff');
    }
  }, []);

  const handleLoadComplete = useCallback(() => {
    setIsLoading(false);
    setIsInitialLoad(false);
  }, []);

  usePageTransition();

  if (!browserInfo) {
    return (
      <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Loading Environment...</title>
        </head>
        <body>
          <div>Detecting environment...</div>
        </body>
      </html>
    );
  }

  const themePref = browserInfo.prefersDark ? 'dark' : 'light';

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Chris Hall - Portfolio</title>
        <link rel="preload" href="/fonts/PPNeueMontreal-Medium.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/PPNeueMontreal-Book.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <LenisProvider isTouch={browserInfo.isTouch}>
          <WebGLProvider>
            {/* Show loader on initial load */}
            {isInitialLoad && isLoading && (
              <Loader onLoaded={handleLoadComplete} />
            )}
            <Nav currentTheme={themePref} />
            <TranslationLayout>
              <div id="content">
                <main>{children}</main>
              </div>
            </TranslationLayout>
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