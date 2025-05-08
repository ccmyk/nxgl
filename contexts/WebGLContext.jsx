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
import { Renderer, Camera, Transform, Vec2 } from 'ogl'; // Import necessary OGL components
import { useViewport } from '@/hooks/useViewport'; // Hook to get window dimensions

// Create the context
const WebGLContext = createContext(null);

// Create Provider Component
export function WebGLProvider({ children }) {
  const canvasRef = useRef(null); // Ref for the shared background canvas
  const rendererInstance = useRef(null);
  const glContext = useRef(null);
  const sceneInstance = useRef(null);
  const cameraInstance = useRef(null);
  const glViewport = useRef({ width: 1, height: 1 }); // OGL pixel dimensions
  const viewportUnits = useRef({ width: 1, height: 1 }); // OGL world units
  const rafIdRef = useRef(null); // Ref for the requestAnimationFrame ID

  const [isInitialized, setIsInitialized] = useState(false);
  const reactViewport = useViewport(); // Get { width, height } from our hook

  // --- Initialization Effect ---
  useEffect(() => {
    // Only run once when canvas is available and viewport is valid
    if (!canvasRef.current || !reactViewport.width || !reactViewport.height || isInitialized) {
      return;
    }

    try {
      // --- Setup derived from main🐙🐙🐙/index.js initApp ---
      const renderer = new Renderer({
        canvas: canvasRef.current,
        alpha: true, // Match legacy - likely transparent background needed
        dpr: Math.min(window.devicePixelRatio, 2), // Performance optimization
        // antialias: true, // Optional: consider for smoother edges
      });
      const gl = renderer.gl;
      // gl.clearColor(0, 0, 0, 0); // Explicitly set clear color to transparent

      // --- Setup from gl🌊🌊🌊/create.js createCamera ---
      const camera = new Camera(gl, { fov: 45 }); // Default FOV, can be adjusted
      camera.position.z = 7; // Default camera Z pos from TtA/TtF base.js

      // --- Setup from gl🌊🌊🌊/create.js createScene ---
      const scene = new Transform(); // OGL scene graph root

      // Store instances in refs
      rendererInstance.current = renderer;
      glContext.current = gl;
      sceneInstance.current = scene;
      cameraInstance.current = camera;

      console.log('WebGL Context Initialized');
      setIsInitialized(true); // Mark as initialized

    } catch (e) {
      console.error("Failed to initialize WebGL Context:", e);
      // Handle potential WebGL context loss or errors
    }

    // Cleanup on unmount
    return () => {
      console.log('WebGL Context Cleanup');
      cancelAnimationFrame(rafIdRef.current); // Stop the render loop
      // OGL cleanup methods
      rendererInstance.current?.dispose();
      // Note: Geometry/Program disposal should happen in the components using them
      rendererInstance.current = null;
      glContext.current = null;
      sceneInstance.current = null;
      cameraInstance.current = null;
      setIsInitialized(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reactViewport.width, reactViewport.height]); // Depend on viewport size for initial setup

  // --- Resize Handler Effect ---
  const handleResize = useCallback(() => {
    if (!isInitialized || !rendererInstance.current || !cameraInstance.current || !reactViewport.width || !reactViewport.height) {
      return; // Ensure everything is ready
    }

    const renderer = rendererInstance.current;
    const camera = cameraInstance.current;
    const { width, height } = reactViewport;

    // Update Renderer size
    renderer.setSize(width, height);

    // Update Camera aspect ratio
    camera.perspective({ aspect: width / height });

    // Calculate viewport units (same as legacy main/events.js onResize)
    const fov = camera.fov * (Math.PI / 180);
    const viewportHeight = 2 * Math.tan(fov / 2) * camera.position.z;
    const viewportWidth = viewportHeight * camera.aspect;

    // Store both pixel and world unit dimensions
    glViewport.current = { width, height };
    viewportUnits.current = { width: viewportWidth, height: viewportHeight };

    // console.log('WebGL Resized:', glViewport.current, viewportUnits.current);

  }, [isInitialized, reactViewport]); // Depend on init state and viewport changes

  useEffect(() => {
    handleResize(); // Call resize initially after setup
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]); // Manage resize listener

  // --- Render Loop ---
  // This loop is simplified. In a real app, you might integrate this with GSAP's ticker
  // or use a library like react-three-fiber's useFrame for more control.
  // This basic loop just renders the scene. Components needing updates within
  // the loop would need a way to register their update functions (more advanced context).
  useEffect(() => {
    if (!isInitialized) return; // Don't start loop until ready

    const render = () => {
      if (!isInitialized || !rendererInstance.current || !sceneInstance.current || !cameraInstance.current) {
         // Stop loop if context is lost or unmounted
         cancelAnimationFrame(rafIdRef.current);
         return;
      }
      // Core render call
      rendererInstance.current.render({ scene: sceneInstance.current, camera: cameraInstance.current });
      rafIdRef.current = requestAnimationFrame(render);
    };

    rafIdRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [isInitialized]); // Start/stop loop based on initialization

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    gl: glContext.current,
    renderer: rendererInstance.current,
    scene: sceneInstance.current,
    camera: cameraInstance.current,
    size: glViewport.current, // Pixel dimensions { width, height }
    viewport: viewportUnits.current, // Viewport units { width, height }
    isInitialized,
  }), [isInitialized]); // Only update context value when initialization state changes

  return (
    <WebGLContext.Provider value={value}>
      {/* This canvas is primarily for effects needing a shared background canvas like Bg.jsx */}
      {/* Other components might create their own canvases or render to this one */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0, // Ensure it's behind other content
          pointerEvents: 'none', // Typically background effects don't need interaction
          // background: 'transparent', // Ensure CSS doesn't interfere
        }}
      />
      {/* Render children components */}
      {children}
    </WebGLContext.Provider>
  );
}

// Custom hook for consuming the context
export function useWebGL() {
  const context = useContext(WebGLContext);
  if (context === null) {
    // This error is helpful during development.
    throw new Error('useWebGL must be used within a WebGLProvider');
  }
  return context;
}
