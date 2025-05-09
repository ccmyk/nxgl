// app/layout.jsx
'use client';

import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import './main.pcss'; // Import global styles FIRST
import { WebGLProvider } from '@/contexts/WebGLContext';
import { LenisProvider } from '@/contexts/LenisContext';
import browserCheck from '@/lib/browser'; // Import browser check utility

// Import Layout Components
import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import Loader from '@/components/layout/Loader'; // The DOM Loader component
import MouseCursor from '@/components/MouseCursor';
// Import Transition Wrapper (Implement this separately for page transitions)
// import TransitionLayout from '@/components/layout/TransitionLayout';
// Import hook to manage page transitions functionally
import { usePageTransition } from '@/hooks/usePageTransition';

export default function RootLayout({ children }) {
  const [isLoading, setIsLoading] = useState(true); // Loader is visible initially
  const [browserInfo, setBrowserInfo] = useState(null);
  const loaderRef = useRef(null); // Ref for the DOM Loader

  // 1. Browser Checks & Global Classes (from legacy start🏁🏁🏁)
  useEffect(() => {
    const info = browserCheck.browserCheck(); // Assuming this returns { deviceclass, isTouch, webgl, ... }
    setBrowserInfo(info);

    // Add classes to HTML element
    document.documentElement.classList.add(info.deviceclass || 'D'); // Default to Desktop if undefined
    if (info.isTouch) document.documentElement.classList.add('touch');
    if (info.webgl === 0) document.documentElement.classList.add('NOGL');
    // Add other classes like 'AND', 'CBff' based on browserCheck results if needed
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
    setIsLoading(false); // Hide the DOM loader component
  }, []);

  // 3. Initialize Page Transition Logic
  // Call the hook here so it runs once for the application lifecycle
  usePageTransition();

  // Render minimal loading state until browser info is ready
  if (!browserInfo) {
    return (
       <html lang="en">
         <head>
             <meta name="viewport" content="width=device-width, initial-scale=1" />
             <title>Loading...</title>
             {/* Minimal styles for loading state could go here */}
         </head>
         <body><div>Detecting Environment...</div></body>
       </html>
    );
  }

  return (
    <html lang="en">
      <head>
         <meta name="viewport" content="width=device-width, initial-scale=1" />
         <title>Chris Hall - Art Director & Designer</title> {/* Update dynamically if needed */}
         {/* Link fonts defined in main.pcss */}
         {/* Example: <link rel="preload" href="/fonts/montreal.woff2" as="font" type="font/woff2" crossOrigin="anonymous"> */}
      </head>
      <body>
        {/* Wrap everything in Context Providers */}
        {/* Pass browserInfo to providers that need it */}
        <LenisProvider isTouch={browserInfo.isTouch}>
          <WebGLProvider>

            {/* Loader is rendered conditionally */}
            {/* It manages its own fade-out and calls onLoaded */}
            {isLoading && <Loader ref={loaderRef} onLoaded={handleLoadComplete} />}

            {/* Persistent Layout Components */}
            <Nav />

            {/* Main Content Area */}
            {/* TODO: Wrap with <TransitionLayout> when implemented */}
            {/* <TransitionLayout> */}
              <div id="content">
                {/* Suspense for potential code splitting / lazy loading of pages */}
                <Suspense fallback={<div>Loading Page...</div>}>
                  <main>{children}</main> {/* Page content renders here */}
                </Suspense>
              </div>
            {/* </TransitionLayout> */}

            <Footer />

            {/* Conditional Mouse Cursor */}
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
