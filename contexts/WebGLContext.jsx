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

// MSDF font assets configuration (point to public font JSON & texture)
const MSDF_FONT_ASSETS = {
  default: {
    jsonPath: '/fonts/msdf/PPNeueMontreal-Medium.json',
    texturePath: '/fonts/msdf/PPNeueMontreal-Medium.png',
  },
  // Additional fonts can be configured here, e.g.:
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
  const loadedFontAssets = useRef({}); // Loaded font JSON and texture assets

  const reactViewport = useViewport();

  // Load MSDF font assets once WebGL context is ready
  useEffect(() => {
    if (!isInitialized) return;
    // If all fonts already loaded, ensure assetsLoaded is true
    if (Object.keys(loadedFontAssets.current).length === Object.keys(MSDF_FONT_ASSETS).length) {
      setAssetsLoaded(true);
      return;
    }

    const gl = glContext.current;
    let mounted = true;

    const loadFont = async (fontKey, paths) => {
      try {
        const [fontJson, fontImage] = await Promise.all([
          fetch(paths.jsonPath).then(res => res.json()),
          new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = err => reject(new Error(`Failed to load font texture: ${paths.texturePath} - ${err.message}`));
            img.src = paths.texturePath;
          })
        ]);
        if (!mounted) return;
        // Create OGL texture for font atlas
        const fontTexture = new Texture(gl, {
          image: fontImage,
          generateMipmaps: false,
          minFilter: gl.LINEAR,
          magFilter: gl.LINEAR,
        });
        loadedFontAssets.current[fontKey] = { json: fontJson, texture: fontTexture };
        if (Object.keys(loadedFontAssets.current).length === Object.keys(MSDF_FONT_ASSETS).length) {
          setAssetsLoaded(true);
          console.log('All MSDF fonts loaded.');
        }
      } catch (error) {
        console.error(`Error loading MSDF font "${fontKey}":`, error);
      }
    };

    // Kick off loading for any fonts not yet loaded
    Object.entries(MSDF_FONT_ASSETS).forEach(([key, paths]) => {
      if (!loadedFontAssets.current[key]) {
        loadFont(key, paths);
      }
    });

    return () => { mounted = false; };
  }, [isInitialized]);  // Run once when WebGL is initialized

  // Initialize WebGL (renderer, scene, camera) when canvas and viewport are ready
  useEffect(() => {
    if (!canvasRef.current || !reactViewport.width || !reactViewport.height || isInitialized) return;
    try {
      const renderer = new Renderer({
        canvas: canvasRef.current,
        alpha: true,
        dpr: Math.min(window.devicePixelRatio, 2),
      });
      const gl = renderer.gl;
      const camera = new Camera(gl, { fov: 45 });
      camera.position.z = 7;
      const scene = new Transform();
      rendererInstance.current = renderer;
      glContext.current = gl;
      sceneInstance.current = scene;
      cameraInstance.current = camera;
      console.log('WebGL Context Initialized');
      setIsInitialized(true);
    } catch (e) {
      console.error("Failed to initialize WebGL Context:", e);
    }

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
  }, [reactViewport.width, reactViewport.height, isInitialized]);

  // Handle window resize: update renderer size, camera aspect, and viewport units
  const handleResize = useCallback(() => {
    if (!rendererInstance.current || !cameraInstance.current || !reactViewport.width || !reactViewport.height) return;
    const renderer = rendererInstance.current;
    const camera = cameraInstance.current;
    const { width, height } = reactViewport;
    renderer.setSize(width, height);
    camera.perspective({ aspect: width / height });
    // Compute viewport size in world units (for perspective camera)
    const fov = camera.fov * (Math.PI / 180);
    const viewHeight = 2 * Math.tan(fov / 2) * camera.position.z;
    const viewWidth = viewHeight * camera.aspect;
    glViewport.current = { width, height };
    viewportUnits.current = { width: viewWidth, height: viewHeight };
  }, [reactViewport]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Main render loop: start once both context initialized and font assets loaded
  useEffect(() => {
    if (!isInitialized || !assetsLoaded) return;
    const render = () => {
      if (!rendererInstance.current || !sceneInstance.current || !cameraInstance.current) {
        cancelAnimationFrame(rafIdRef.current);
        return;
      }
      rendererInstance.current.render({ scene: sceneInstance.current, camera: cameraInstance.current });
      rafIdRef.current = requestAnimationFrame(render);
    };
    rafIdRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafIdRef.current);
  }, [isInitialized, assetsLoaded]);

  // Context value to provide
  const contextValue = useMemo(() => ({
    gl: glContext.current,
    renderer: rendererInstance.current,
    scene: sceneInstance.current,
    camera: cameraInstance.current,
    size: glViewport.current,
    viewport: viewportUnits.current,
    isInitialized,
    assetsLoaded,
    fonts: loadedFontAssets.current,
  }), [isInitialized, assetsLoaded]);

  return (
    <WebGLContext.Provider value={contextValue}>
      {/* Global WebGL canvas fixed behind content */}
      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />
      {children}
    </WebGLContext.Provider>
  );
}

export function useWebGL() {
  const context = useContext(WebGLContext);
  if (context === null) {
    throw new Error('useWebGL must be used within a WebGLProvider');
  }
  return context;
}