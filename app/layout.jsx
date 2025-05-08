// app/layout.jsx
'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import './main.pcss'; // Import global styles FIRST
import { WebGLProvider } from '@/contexts/WebGLContext';
import { LenisProvider } from '@/contexts/LenisContext';
import browserCheck from '@/lib/browser'; // Import browser check utility

// Import Layout Components
import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import Loader from '@/components/layout/Loader'; // The DOM Loader component
import MouseCursor from '@/components/MouseCursor';
import TransitionLayout from '@/components/layout/TransitionLayout';
// Import Transition Wrapper (Implement this separately for page transitions)

export default function RootLayout({ children }) {
  const [isLoading, setIsLoading] = useState(true); // Loader is visible initially
  const [browserInfo, setBrowserInfo] = useState(null);
  const loaderRef = useRef(null); // Ref for the DOM Loader

  // 1. Perform browser checks on mount
  useEffect(() => {
    const info = browserCheck.browserCheck(); // Assuming this returns { deviceclass, isTouch, webgl, ... }
    setBrowserInfo(info);

    // Add global classes based on checks (like legacy constructor🫀.js)
    document.documentElement.classList.add(info.deviceclass || 'D'); // Default to Desktop if undefined
    if (info.isTouch) document.documentElement.classList.add('touch');
    if (info.webgl === 0) document.documentElement.classList.add('NOGL');
    // Add other classes like 'AND', 'CBff' based on browserCheck results if needed
  }, []);

  // 2. Loader completion callback
  const handleLoadComplete = useCallback(() => {
    console.log("RootLayout: Loader sequence finished.");
    setIsLoading(false); // Hide the DOM loader component
  }, []);

  // Render nothing or a minimal placeholder until browser info is ready
  if (!browserInfo) {
    return (
       <html lang="en">
         <head>
             <meta name="viewport" content="width=device-width, initial-scale=1" />
             <title>Loading...</title>
         </head>
         <body><div>Loading Environment...</div></body>
       </html>
    );
  }

  return (
    <html lang="en">
      <head>
         <meta name="viewport" content="width=device-width, initial-scale=1" />
         <title>Chris Hall - Art Director & Designer</title> {/* Update dynamically if needed */}
         {/* Add other meta tags, link tags for fonts etc. */}
      </head>
      <body>
        {/* Wrap core content with providers */}
        <LenisProvider isTouch={browserInfo.isTouch}>
          <WebGLProvider>

            {/* Loader is rendered conditionally outside the main persistent layout */}
            {isLoading && <Loader ref={loaderRef} onLoaded={handleLoadComplete} />}

            {/* Persistent Layout Components */}
            <Nav />

            {/* Main Content Area - Page content will be rendered here by Next.js Router */}
            {/* Wrap with TransitionLayout when implemented */}
            <TransitionLayout>
              <div id="content">
                <Suspense fallback={<div>Loading Page...</div>}>
                  <main>{children}</main>
                </Suspense>
              </div>
            </TransitionLayout>

            <Footer />

            {/* Mouse Cursor (conditionally rendered) */}
            {!browserInfo.isTouch && <MouseCursor />}

          </WebGLProvider>
        </LenisProvider>

        {/* Legacy Helper Elements */}
        <div className="pHide"></div>
        <noscript>
          <style>{`.lazyload[data-src] { display: none !important; }`}</style>
        </noscript>
      </body>
    </html>
  );
}
