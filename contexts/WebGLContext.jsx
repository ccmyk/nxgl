// contexts/WebGLContext.jsx
'use client';

import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { Renderer, Camera, Transform, Texture /*, Vec2 was imported but not used */ } from 'ogl';
// import { useViewport } from '@/hooks/useViewport'; // This was used but reactViewport is not used in latest logic. If needed for camera, re-evaluate.

const WebGLContext = createContext(null);

const MSDF_FONT_ASSETS = { // Your existing font assets
  default: {
    jsonPath: '/fonts/msdf/PPNeueMontreal-Medium.json',
    texturePath: '/fonts/msdf/PPNeueMontreal-Medium.png',
  },
};

// Props will now include canvasRef from layout and onReadyAndResourcesLoaded callback
export function WebGLProvider({ children, canvasRef, onReadyAndResourcesLoaded }) {
  // Removed internal canvasRef, use the one from props
  const rendererInstance = useRef(null);
  const glContext = useRef(null);
  const sceneInstance = useRef(null);
  const cameraInstance = useRef(null);
  // Refs for viewport calculation, if you re-add useViewport()
  const glViewport = useRef({ width: 1, height: 1 });
  const viewportUnits = useRef({ width: 1, height: 1 });
  const rafIdRef = useRef(null);

  const [isContextInitialized, setIsContextInitialized] = useState(false); // Renamed for clarity
  const [areMSDFFontsLoaded, setAreMSDFFontsLoaded] = useState(false); // Specific for MSDF fonts
  const loadedFontAssets = useRef({});

  // reactViewport was from useViewport(), which isn't directly used in the current render/resize logic
  // If camera setup or other logic depends on useViewport, it needs to be integrated carefully.
  // For now, using window.innerWidth/Height in resize.
  // const reactViewport = useViewport();

  // Initialize WebGL (renderer, scene, camera)
  useEffect(() => {
    // Ensure canvasRef is provided and current
    if (!canvasRef || !canvasRef.current || isContextInitialized) return;

    try {
      const renderer = new Renderer({
        canvas: canvasRef.current, // Use passed ref
        alpha: true,
        dpr: Math.min(window.devicePixelRatio, 2),
        antialias: true, // Good to have if performance allows
        powerPreference: 'high-performance',
      });
      const gl = renderer.gl;
      gl.clearColor(0,0,0,0); // Ensure transparency for overlaying on content

      // It's important that the canvas element itself has proper width/height attributes
      // for the renderer to work correctly. OGL's renderer.setSize will handle this.
      renderer.setSize(window.innerWidth, window.innerHeight);


      const camera = new Camera(gl, {
        fov: 45,
        aspect: window.innerWidth / window.innerHeight, // Set initial aspect
        near: 0.1, // Common near plane
        far: 1000,  // Common far plane, adjust based on scene scale
      });
      camera.position.z = 7; // Default camera Z position

      const scene = new Transform();

      rendererInstance.current = renderer;
      glContext.current = gl;
      sceneInstance.current = scene;
      cameraInstance.current = camera;

      console.log('WebGL Context Initialized');
      setIsContextInitialized(true); // Signal that GL context and core OGL objects are up

    } catch (e) {
      console.error("Failed to initialize WebGL Context:", e);
      if (onReadyAndResourcesLoaded) { // Signal failure or partial readiness if desired
        onReadyAndResourcesLoaded(false); // Or some error state
      }
    }

    // No return cleanup here for renderer/gl itself, as it's tied to this provider's lifecycle.
    // Cleanup for resources *created by this provider* (like MSDF textures) will be handled.
  }, [canvasRef, isContextInitialized, onReadyAndResourcesLoaded]); // Added onReadyAndResourcesLoaded to deps, though it's a function

  // Load MSDF font assets once WebGL context is ready
  useEffect(() => {
    if (!isContextInitialized) return; // Wait for GL

    const gl = glContext.current;
    let mounted = true;
    let allFontsConfiguredAreLoaded = true;

    const fontLoadPromises = Object.entries(MSDF_FONT_ASSETS).map(([fontKey, paths]) => {
        if (loadedFontAssets.current[fontKey]) {
            return Promise.resolve(); // Already loaded
        }
        return fetch(paths.jsonPath)
            .then(res => {
                if (!res.ok) throw new Error(`Failed to fetch font JSON: ${res.status} ${paths.jsonPath}`);
                return res.json();
            })
            .then(fontJson => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => {
                        if (!mounted) return reject(new Error('Component unmounted during font texture load'));
                        const fontTexture = new Texture(gl, {
                            image: img, generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR,
                        });
                        loadedFontAssets.current[fontKey] = { json: fontJson, texture: fontTexture };
                        resolve();
                    };
                    img.onerror = err => reject(new Error(`Failed to load font texture: ${paths.texturePath} - ${err.message || err}`));
                    img.src = paths.texturePath;
                });
            })
            .catch(error => {
                console.error(`Error loading MSDF font "${fontKey}":`, error);
                allFontsConfiguredAreLoaded = false; // Mark that not all succeeded
                // Potentially throw or handle error to prevent loader from hiding indefinitely
                return Promise.resolve(); // Resolve to not break Promise.all, but flag error
            });
    });

    Promise.all(fontLoadPromises).then(() => {
        if (mounted) {
            if (allFontsConfiguredAreLoaded && Object.keys(loadedFontAssets.current).length === Object.keys(MSDF_FONT_ASSETS).length) {
                console.log('All MSDF fonts successfully loaded.');
                setAreMSDFFontsLoaded(true);
            } else if (!allFontsConfiguredAreLoaded) {
                console.warn('Some MSDF fonts failed to load.');
                // Decide behavior: signal readiness anyway, or hold loader?
                // For now, let's say if *any* critical font fails, we might not want to signal full readiness.
                // Or, if some fonts are optional, this logic needs adjustment.
                // Let's assume for now that all configured MSDF fonts are critical.
                if (onReadyAndResourcesLoaded) {
                  onReadyAndResourcesLoaded(false); // Indicate problem with resources
                }
            }
        }
    });

    return () => { mounted = false; };
  }, [isContextInitialized]);


  // Effect to call onReadyAndResourcesLoaded when context AND MSDF fonts are ready
  useEffect(() => {
    if (isContextInitialized && areMSDFFontsLoaded && onReadyAndResourcesLoaded) {
        onReadyAndResourcesLoaded(true); // Signal full readiness
    }
    // If MSDF fonts are not required, this logic changes.
    // If no MSDF_FONT_ASSETS, then isContextInitialized alone could trigger onReadyAndResourcesLoaded(true)
    else if (isContextInitialized && Object.keys(MSDF_FONT_ASSETS).length === 0 && onReadyAndResourcesLoaded) {
        // No MSDF fonts to load, context is ready
        onReadyAndResourcesLoaded(true);
    }

  }, [isContextInitialized, areMSDFFontsLoaded, onReadyAndResourcesLoaded]);


  // Handle window resize
  const handleResize = useCallback(() => {
    if (!rendererInstance.current || !cameraInstance.current || !glContext.current) return;
    const renderer = rendererInstance.current;
    const camera = cameraInstance.current;
    const gl = glContext.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setSize(width, height);
    camera.perspective({ aspect: width / height });

    // Compute viewport size in world units (for perspective camera)
    // This is useful for sizing elements in world space to match viewport pixels
    const fov = camera.fov * (Math.PI / 180);
    const targetZ = camera.position.z; // Or the z-plane of your primary content
    const viewHeight = 2 * Math.tan(fov / 2) * targetZ;
    const viewWidth = viewHeight * camera.aspect;

    glViewport.current = { width, height }; // Pixel dimensions
    viewportUnits.current = { width: viewWidth, height: viewHeight }; // World units at camera.position.z
  }, []); // No dependency on reactViewport from useViewport hook anymore

  useEffect(() => {
    // Initial resize call needs GL to be ready
    if (isContextInitialized) {
        handleResize();
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isContextInitialized, handleResize]); // Rerun if context initializes

  // Main render loop
  useEffect(() => {
    // Start render loop only when GL context and essential assets (MSDF fonts) are ready
    if (!isContextInitialized || !areMSDFFontsLoaded) {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current); // Ensure it's stopped
        return;
    }

    const render = () => {
      // Check again in case context was lost or provider unmounted quickly
      if (!rendererInstance.current || !sceneInstance.current || !cameraInstance.current) {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        return;
      }
      rendererInstance.current.render({ scene: sceneInstance.current, camera: cameraInstance.current });
      rafIdRef.current = requestAnimationFrame(render);
    };
    rafIdRef.current = requestAnimationFrame(render);
    console.log("WebGL render loop started.");

    return () => {
        console.log("WebGL render loop stopped.");
        cancelAnimationFrame(rafIdRef.current);
    };
  }, [isContextInitialized, areMSDFFontsLoaded]); // Restart loop if these change

  // Cleanup effect for the entire provider
  useEffect(() => {
    return () => {
        console.log('WebGLProvider Unmounting: Cleaning up all resources.');
        cancelAnimationFrame(rafIdRef.current);
        Object.values(loadedFontAssets.current).forEach(asset => asset.texture?.dispose());
        loadedFontAssets.current = {};
        // OGL's renderer does not have a .dispose() method directly.
        // GL context loss is handled by the browser. Resources attached to programs/geometries
        // should be disposed of by the components that create them.
        // If the renderer held global resources not part of scene graph, they'd be cleaned here.
        rendererInstance.current = null; // Allow GC
        glContext.current = null;
        sceneInstance.current = null;
        cameraInstance.current = null;
    };
  }, []); // Runs only once on unmount of the provider


  const contextValue = useMemo(() => ({
    gl: glContext.current,
    renderer: rendererInstance.current,
    scene: sceneInstance.current,
    camera: cameraInstance.current,
    size: glViewport.current, // Pixel size of canvas
    viewport: viewportUnits.current, // World units visible at camera.position.z
    isContextInitialized,
    areMSDFFontsLoaded, // Consumers can know if MSDF fonts specifically are ready
    fonts: loadedFontAssets.current, // Access to loaded font data/textures
    // Add addMesh/removeMesh if components will add to this global scene
    addMesh: (mesh) => sceneInstance.current?.addChild(mesh), // OGL uses addChild
    removeMesh: (mesh) => sceneInstance.current?.removeChild(mesh),
  }), [isContextInitialized, areMSDFFontsLoaded]);

  // Children are rendered, but the <canvas> element itself is now expected to be provided by the parent (RootLayout)
  return (
    <WebGLContext.Provider value={contextValue}>
      {children}
    </WebGLContext.Provider>
  );
}

export function useWebGL() { // This hook is correctly defined
  const context = useContext(WebGLContext);
  if (context === null) {
    throw new Error('useWebGL must be used within a WebGLProvider');
  }
  return context;
}