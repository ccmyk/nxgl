// app/layout.jsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import './main.pcss';
import { WebGLProvider } from '@/contexts/WebGLContext';
import { LenisProvider, useLenis } from '@/contexts/LenisContext';

import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import Loader from '@/components/layout/Loader';
import MouseCursor from '@/components/layout/MouseCursor';
import TransitionLayout from '@/components/layout/TransitionLayout';
import { useBrowserFeatures } from '@/lib/browserFeatures';

// Fonts (as in your provided layout)
import localFont from 'next/font/local';

const pPMontreal = localFont({ /* ... as you defined ... */
  src: [ { path: '../../public/fonts/PPNeueMontreal-Medium.woff2', weight: '500', style: 'normal',}, ],
  variable: '--font-montreal', display: 'swap',
});
const pPMontrealBook = localFont({ /* ... as you defined ... */
  src: [ { path: '../../public/fonts/PPNeueMontrealMono-Book.woff2', weight: '400', style: 'normal',}, ],
  variable: '--font-montrealbook', display: 'swap',
});
const pPAir = localFont({ /* ... as you defined ... */
  src: [ { path: '../../public/fonts/PPAir-Medium.woff2', weight: '500', style: 'normal',}, ],
  variable: '--font-air', display: 'swap',
});

export default function RootLayout({ children }) {
    const pathname = usePathname();
    const browserFeatures = useBrowserFeatures(); // Get browser features

    // --- States for Loading Sequence ---
    const [isLoading, setIsLoading] = useState(true);
    const [criticalAssetsLoaded, setCriticalAssetsLoaded] = useState(false);
    const [webGLReadyAndResourcesLoaded, setWebGLReadyAndResourcesLoaded] = useState(false);

    // --- Other States ---
    const [isTransitioning, setIsTransitioning] = useState(false);

    // --- Refs ---
    const mainContentRef = useRef(null); // Ref for .Mbg
    const webGLCanvasRef = useRef(null);

// --- Lenis Control ---
    // useLenis hook is called here if its provider is a child.
    // However, LenisProvider is a sibling wrapper here.
    // So, start/stop logic needs to be passed down or managed via events if not directly accessible.
    // For now, we'll assume LenisProvider handles its own start/stop based on html classes or
    // we modify LenisProvider to accept an `enabled` prop.
    // Let's try to use the methods from the context if useLenis() can be called here.
    // This assumes LenisProvider is set up to allow useLenis() in its own children.
    // If LenisProvider wraps RootLayout's content, this would work:
    // const lenisControls = useLenis(); (Currently LenisProvider is a sibling)

    // Effect 1: Initial setup, critical asset loading
    useEffect(() => {
        // browserFeatures.isClient will be true here. Classes 'T', 'D', etc., are set by performDetection().
        // Set initial loading class for CSS styling of loader and Mbg
        document.documentElement.classList.add('is-loading'); // '.T' is also added by browserFeatures if touch
        if (!browserFeatures.isTouch) document.documentElement.classList.add('D'); // Add D if not touch, mimicking legacy


        const loadCriticalAssets = async () => {
            try {
                // No specific non-WebGL, non-font critical assets identified for now.
                // This step assumes fonts are handled by next/font and WebGL textures by WebGLProvider.
                console.log("Critical asset loading (non-WebGL/font) complete.");
                setCriticalAssetsLoaded(true);
            } catch (error) {
                console.error("Failed to load critical non-WebGL/font assets:", error);
                setCriticalAssetsLoaded(true);
            }
        };
        loadCriticalAssets();
    }, [browserFeatures.isClient, browserFeatures.isTouch]); // Rerun if isTouch changes (unlikely after first load)

    // Effect 2: Callback for WebGLProvider
    const handleWebGLReadyAndResourcesLoaded = useCallback((success = true) => {
        if (success) {
            console.log("WebGLProvider signals: Context ready and initial resources loaded.");
            setWebGLReadyAndResourcesLoaded(true);
        } else {
            console.error("WebGLProvider signaled an issue with resource loading.");
            // Decide how to handle WebGL loading failure - hide loader anyway or show error?
            // For now, let's assume we might still want to hide the loader and let the page show (potentially without some GL effects)
            setWebGLReadyAndResourcesLoaded(true); // Or set an error state
        }
    }, []);

    // Effect 3: Check combined readiness to hide loader
    useEffect(() => {
        if (browserFeatures.isClient && criticalAssetsLoaded && webGLReadyAndResourcesLoaded) {
            console.log("All loading conditions met. Starting loader hide sequence.");
            setIsLoading(false);
        }
    }, [browserFeatures.isClient, criticalAssetsLoaded, webGLReadyAndResourcesLoaded]);

    // Effect 4: Apply global CSS classes for loaded state & start Lenis
    useEffect(() => {
        if (!isLoading && browserFeatures.isClient) { // Ensure this only runs when truly loaded and client-side
            console.log("Applying 'is-loaded' global styles and starting Lenis.");
            document.documentElement.classList.remove('is-loading'); // Remove our specific loading class
            // 'T' or 'D' based on touch would have already been set by browserFeatures.
            // The legacy CSS uses :root.D for loaded styles for desktop and some :root.T styles for loaded touch states.
            // So, the main change is removing 'is-loading'.
            // If `D` was only for "loaded desktop", ensure that logic is correct in browserFeatures.js
            // The legacy script added 'D' for non-touch, and 'T' + deviceClass for touch.
            // We should ensure the final classes on <html> are what main.pcss expects for the "loaded" state.
            // Typically, just removing 'is-loading' and ensuring 'T' or 'D' (from browserFeatures) is present might be enough.
            // Re-check your main.pcss :root.D and :root.T rules for "loaded" state.

            // Start Lenis: This is tricky. useLenis() hook can only be called by children of LenisProvider.
            // We will need LenisProvider to accept a prop or listen to an event.
            // Simplest: LenisProvider itself can check for 'is-loading' class removal.
            // See LenisContext modifications below.

        }
    }, [isLoading, browserFeatures.isClient]);

    return (
        // The classes T/D are primarily set by browserFeatures.js now.
        // isLoading adds/removes 'is-loading'.
        <html lang="en" className={`${pPMontreal.variable} ${pPMontrealBook.variable} ${pPAir.variable}`}>
            <body>
                {/* Pass browserFeatures.isTouch to LenisProvider */}
                <LenisProvider isTouch={browserFeatures.isClient ? browserFeatures.isTouch : undefined} enableScroll={!isLoading}>
                    <Loader isLoading={isLoading} />

                    {browserFeatures.isClient && <Nav />}
                    {browserFeatures.isClient && <MouseCursor />}

                    <WebGLProvider
                        canvasRef={webGLCanvasRef}
                        onReadyAndResourcesLoaded={handleWebGLReadyAndResourcesLoaded}
                    >
                        {/* Use .Mbg class from your main.pcss */}
                        <div
                            ref={mainContentRef}
                            id="mbg-container" // Keep ID if specific JS targets it, otherwise class is fine
                            className={`Mbg ${isLoading ? '' : 'loaded'}`} // Add 'loaded' class to .Mbg or rely on html.is-loaded
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