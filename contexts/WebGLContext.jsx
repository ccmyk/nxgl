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
import { Renderer, Camera, Transform, Texture, Vec2 } from 'ogl';
import { useViewport } from '@/hooks/useViewport';

const WebGLContext = createContext(null);

// Define your MSDF font assets here
// In a real app, you might have multiple or load this config dynamically
const MSDF_FONT_ASSETS = {
  default: { // Name this font whatever you like, e.g., 'montrealMedium'
    jsonPath: '/fonts/msdf/PPNeueMontreal-Medium.json', // Ensure this path is correct
    texturePath: '/fonts/msdf/PPNeueMontreal-Medium.png', // Ensure this path is correct
  }
  // Add other MSDF fonts if needed:
  // altFont: { jsonPath: '/fonts/msdf/PPAir-Medium.json', texturePath: '/fonts/msdf/PPAir-Medium.png' },
};


export function WebGLProvider({ children }) {
  const canvasRef = useRef(null);
  const rendererInstance = useRef(null);
  const glContext = useRef(null);
  const sceneInstance = useRef(null);
  const cameraInstance = useRef(null);
  const glViewport = useRef({ width: 1, height: 1 });
  const viewportUnits = useRef({ width: 1, height: 1 });
  const rafIdRef = useRef(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const loadedFontAssets = useRef({}); // Store loaded font JSON and OGL Textures

  const reactViewport = useViewport();

  // --- Asset Loading Effect (MSDF Fonts) ---
  useEffect(() => {
    if (!glContext.current || Object.keys(loadedFontAssets.current).length === Object.keys(MSDF_FONT_ASSETS).length) {
        // Skip if GL not ready or all fonts already loaded
        if (Object.keys(loadedFontAssets.current).length > 0 && Object.keys(loadedFontAssets.current).length === Object.keys(MSDF_FONT_ASSETS).length) {
            setAssetsLoaded(true);
        }
        return;
    }

    const gl = glContext.current;
    let mounted = true;

    async function loadFont(fontKey, paths) {
      try {
        const [fontJsonResponse, fontImage] = await Promise.all([
          fetch(paths.jsonPath).then(res => res.json()),
          new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(new Error(`Failed to load font texture: ${paths.texturePath} - ${err.message}`));
            img.src = paths.texturePath;
          })
        ]);

        if (!mounted) return;

        const fontTexture = new Texture(gl, {
          image: fontImage,
          generateMipmaps: false, // MSDF usually doesn't need mipmaps
          minFilter: gl.LINEAR, // Use linear filtering
          magFilter: gl.LINEAR,
        });

        loadedFontAssets.current[fontKey] = {
          json: fontJsonResponse,
          texture: fontTexture,
        };

        console.log(`MSDF Font "${fontKey}" loaded.`);

        // Check if all fonts are loaded
        if (Object.keys(loadedFontAssets.current).length === Object.keys(MSDF_FONT_ASSETS).length) {
          setAssetsLoaded(true);
          console.log('All MSDF fonts loaded.');
        }

      } catch (error) {
        console.error(`Error loading MSDF font "${fontKey}":`, error);
      }
    }

    Object.entries(MSDF_FONT_ASSETS).forEach(([key, paths]) => {
        if (!loadedFontAssets.current[key]) { // Only load if not already loaded
            loadFont(key, paths);
        }
    });
    
    return () => {
        mounted = false;
        // Textures will be disposed if WebGL context is destroyed
    }

  }, [glContext.current]); // Depend on GL context being available


  // --- WebGL Initialization Effect ---
  useEffect(() => {
    if (!canvasRef.current || !reactViewport.width || !reactViewport.height || isInitialized) {
      return;
    }
    try {
      const renderer = new Renderer({
        canvas: canvasRef.current, alpha: true,
        dpr: Math.min(window.devicePixelRatio, 2),
      });
      const gl = renderer.gl;
      const camera = new Camera(gl, { fov: 45 });
      camera.position.z = 7;
      const scene = new Transform();

      rendererInstance.current = renderer;
      glContext.current = gl; // Set gl context here so font loading can start
      sceneInstance.current = scene;
      cameraInstance.current = camera;

      console.log('WebGL Context Initialized (Renderer, Scene, Camera)');
      setIsInitialized(true);

    } catch (e) { console.error("Failed to initialize WebGL Context:", e); }

    return () => {
      console.log('WebGL Context Cleanup');
      cancelAnimationFrame(rafIdRef.current);
      // Dispose loaded font textures
      Object.values(loadedFontAssets.current).forEach(asset => asset.texture?.dispose());
      loadedFontAssets.current = {};
      setAssetsLoaded(false);

      rendererInstance.current?.dispose();
      rendererInstance.current = null;
      glContext.current = null;
      sceneInstance.current = null;
      cameraInstance.current = null;
      setIsInitialized(false);
    };
  }, [reactViewport.width, reactViewport.height, isInitialized]); // isInitialized was missing

  // --- Resize Handler Effect ---
  const handleResize = useCallback(() => {
    if (!isInitialized || !rendererInstance.current || !cameraInstance.current || !reactViewport.width || !reactViewport.height) return;
    const renderer = rendererInstance.current;
    const camera = cameraInstance.current;
    const { width, height } = reactViewport;
    renderer.setSize(width, height);
    camera.perspective({ aspect: width / height });
    const fov = camera.fov * (Math.PI / 180);
    const viewportHeight = 2 * Math.tan(fov / 2) * camera.position.z;
    const viewportWidth = viewportHeight * camera.aspect;
    glViewport.current = { width, height };
    viewportUnits.current = { width: viewportWidth, height: viewportHeight };
  }, [isInitialized, reactViewport]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // --- Render Loop ---
  useEffect(() => {
    if (!isInitialized || !assetsLoaded) return; // Wait for both GL and assets

    const render = () => {
      if (!isInitialized || !rendererInstance.current || !sceneInstance.current || !cameraInstance.current) {
         cancelAnimationFrame(rafIdRef.current); return;
      }
      rendererInstance.current.render({ scene: sceneInstance.current, camera: cameraInstance.current });
      rafIdRef.current = requestAnimationFrame(render);
    };
    rafIdRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafIdRef.current);
  }, [isInitialized, assetsLoaded]); // Depend on assetsLoaded as well

  const value = useMemo(() => ({
    gl: glContext.current,
    renderer: rendererInstance.current,
    scene: sceneInstance.current,
    camera: cameraInstance.current,
    size: glViewport.current,
    viewport: viewportUnits.current,
    isInitialized,
    assetsLoaded, // Expose asset loading status
    fonts: loadedFontAssets.current, // Expose loaded font assets
  }), [isInitialized, assetsLoaded]);

  return (
    <WebGLContext.Provider value={value}>
      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}/>
      {children}
    </WebGLContext.Provider>
  );
}

export function useWebGL() {
  const context = useContext(WebGLContext);
  if (context === null) throw new Error('useWebGL must be used within a WebGLProvider');
  return context;
}
