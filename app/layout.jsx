// app/layout.jsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import './main.pcss';
import { WebGLProvider } from '@/contexts/WebGLContext';
import { LenisProvider } from '@/contexts/LenisContext';

import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import Loader from '@/components/layout/Loader';
import MouseCursor from '@/components/layout/MouseCursor';
import TransitionLayout from '@/components/layout/TransitionLayout';
import { useBrowserFeatures } from '@/lib/browserFeatures';

import localFont from 'next/font/local';

const pPMontreal = localFont({
  src: [
    {
      path: '../../public/fonts/PPNeueMontreal-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
  ],
  variable: '--font-montreal',
  display: 'swap',
});
const pPMontrealBook = localFont({
  src: [
    {
      path: '../../public/fonts/PPNeueMontrealMono-Book.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-montrealbook',
  display: 'swap',
});
const pPAir = localFont({
  src: [
    {
      path: '../../public/fonts/PPAir-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
  ],
  variable: '--font-air',
  display: 'swap',
});

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const browserFeatures = useBrowserFeatures();

  const [isLoading, setIsLoading] = useState(true);
  const [criticalAssetsLoaded, setCriticalAssetsLoaded] = useState(false);
  const [webGLReadyAndResourcesLoaded, setWebGLReadyAndResourcesLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const mainContentRef = useRef(null);
  const webGLCanvasRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.add('is-loading');
    if (!browserFeatures.isTouch) document.documentElement.classList.add('D');

    const loadCriticalAssets = async () => {
      try {
        // Placeholder: add critical asset preloading logic if needed
        setCriticalAssetsLoaded(true);
      } catch (error) {
        console.error("Critical asset loading failed:", error);
        setCriticalAssetsLoaded(true);
      }
    };
    loadCriticalAssets();
  }, [browserFeatures.isClient, browserFeatures.isTouch]);

  const handleWebGLReadyAndResourcesLoaded = useCallback((success = true) => {
    setWebGLReadyAndResourcesLoaded(true);
  }, []);

  useEffect(() => {
    if (browserFeatures.isClient && criticalAssetsLoaded && webGLReadyAndResourcesLoaded) {
      setIsLoading(false);
    }
  }, [browserFeatures.isClient, criticalAssetsLoaded, webGLReadyAndResourcesLoaded]);

  useEffect(() => {
    if (!isLoading && browserFeatures.isClient) {
      document.documentElement.classList.remove('is-loading');
    }
  }, [isLoading, browserFeatures.isClient]);

  return (
    <html lang="en" className={`${pPMontreal.variable} ${pPMontrealBook.variable} ${pPAir.variable}`}>
      <body>
        <LenisProvider isTouch={browserFeatures.isClient ? browserFeatures.isTouch : undefined} enableScroll={!isLoading}>
          <Loader isLoading={isLoading} />

          {browserFeatures.isClient && <Nav />}
          {browserFeatures.isClient && <MouseCursor />}

          <WebGLProvider
            canvasRef={webGLCanvasRef}
            onReadyAndResourcesLoaded={handleWebGLReadyAndResourcesLoaded}
          >
            <div
              ref={mainContentRef}
              id="mbg-container"
              className={`Mbg ${isLoading ? '' : 'loaded'}`}
            >
              <canvas ref={webGLCanvasRef} id="webgl-canvas" />
              <TransitionLayout pathname={pathname} isTransitioning={isTransitioning}>
                {children}
              </TransitionLayout>
            </div>
          </WebGLProvider>

          {browserFeatures.isClient && <Footer />}
        </LenisProvider>
      </body>
    </html>
  );
}
