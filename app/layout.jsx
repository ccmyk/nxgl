// app/layout.jsx
'use client';

import { useEffect } from 'react';
import './main.pcss';
import { useLenis } from '@/hooks/useLenis';
import { useViewport } from '@/hooks/useViewport';
import { WebGLProvider } from '@/contexts/WebGLContext';
import MouseCursor from '@/components/MouseCursor';

// ... metadata

export default function RootLayout({ children }) {
  useLenis();
  useViewport();

  return (
    <html lang="EN">
      <body>
        <WebGLProvider>
            {/* <Nav /> */} // Placeholder for Nav component
            <div id="content">
              <main>{children}</main>
            </div>
            {/* <Footer /> */} // Placeholder for Footer component
        </WebGLProvider> {/* WebGLProvider wraps elements needing WebGL context */}

        <MouseCursor /> {/* MouseCursor can be outside if it doesn't need WebGL context */}

        {/* --- Elements outside the main WebGL context scope --- */}

        {/* pHide: This div existed in the original index.html. Looking at main/events.js, */}
        {/* it seems its pointer-events style was toggled based on scroll speed. */}
        {/* It might have been intended to prevent interaction with elements during fast scrolls, */}
        {/* especially with Lenis scroll smoothing. We keep it here for now, but its necessity */}
        {/* might be re-evaluated. Lenis itself might handle this better. */}
        <div className="pHide"></div>

        {/* noscript: Standard HTML tag. Its content (the <style> tag) is only */}
        {/* processed/rendered by browsers that have JavaScript disabled or don't support it. */}
        {/* Here, it provides a fallback style to hide elements meant to be lazy-loaded */}
        {/* by JS, ensuring they don't appear broken if JS fails or is off. */}
        {/* It needs to be directly in the HTML structure like this. */}
        <noscript>
          <style>{`.lazyload[data-src] { display: none !important; }`}</style>
        </noscript>
      </body>
    </html>
  );
}