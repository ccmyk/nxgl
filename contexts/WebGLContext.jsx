// contexts/WebGLContext.jsx
'use client';

import React, { createContext, useContext, useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Renderer, Camera, Transform } from 'ogl'; // Import core OGL components
import { useViewport } from '@/hooks/useViewport'; // Import our viewport hook

// Create the context
const WebGLContext = createContext(null);

// Create Provider Component
export function WebGLProvider({ children }) {
  const canvasRef = useRef(null);
  const rendererInstance = useRef(null); // Using Ref to hold the instance
  const glContext = useRef(null);
  const sceneInstance = useRef(null);
  const cameraInstance = useRef(null);
  const glViewport = useRef({ width: 1, height: 1 }); // OGL viewport size {width, height}
  const viewportUnits = useRef({ width: 1, height: 1 }); // Viewport units {width, height}

  const [isInitialized, setIsInitialized] = useState(false);
  const reactViewport = useViewport(); // Get { width, height } from our hook

  // Initialization Effect (runs once after canvas ref exists and viewport is > 0)
  useEffect(() => {
    if (!canvasRef.current || !reactViewport.width || !reactViewport.height || isInitialized) {
      return; // Wait for canvas and valid viewport, only run once
    }

    try {
      const renderer = new Renderer({
        canvas: canvasRef.current,
        alpha: true, // Transparent background
        dpr: Math.min(window.devicePixelRatio, 2),
        // antialias: true, // Optional: might improve edges
      });
      const gl = renderer.gl;
      // gl.clearColor(0, 0, 0, 0); // Ensure transparent clear

      const camera = new Camera(gl, { fov: 45 });
      camera.position.z = 7; // Default camera Z pos

      const scene = new Transform(); // OGL scene graph root

      // Store instances in refs
      rendererInstance.current = renderer;
      glContext.current = gl;
      sceneInstance.current = scene;
      cameraInstance.current = camera;

      console.log('WebGL Context Initialized');
      setIsInitialized(true);

    } catch (e) {
        console.error("Failed to initialize WebGL Context:", e);
        // Handle WebGL context creation error gracefully if needed
        // Maybe set an error state in context?
    }

    // Cleanup on unmount
    return () => {
      console.log('WebGL Context Cleanup');
      rendererInstance.current?.dispose(); // OGL cleanup
      rendererInstance.current = null;
      glContext.current = null;
      sceneInstance.current = null;
      cameraInstance.current = null;
      setIsInitialized(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reactViewport.width, reactViewport.height]); // Depend on viewport size to ensure valid init

  // Resize Handler Effect
  useEffect(() => {
    if (!isInitialized || !rendererInstance.current || !cameraInstance.current || !reactViewport.width || !reactViewport.height) {
      return;
    }

    const renderer = rendererInstance.current;
    const camera = cameraInstance.current;
    const { width, height } = reactViewport;

    // Update Renderer
    renderer.setSize(width, height);

    // Update Camera
    camera.perspective({ aspect: width / height });

    // Calculate viewport units
    const fov = camera.fov * (Math.PI / 180);
    const viewportHeight = 2 * Math.tan(fov / 2) * camera.position.z;
    const viewportWidth = viewportHeight * camera.aspect;

    glViewport.current = { width, height };
    viewportUnits.current = { width: viewportWidth, height: viewportHeight };

  }, [isInitialized, reactViewport]); // Update on viewport change after init

  // Memoize the context value
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
      {/* This canvas is for background effects / shared scene elements */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0, // Behind main content
          pointerEvents: 'none',
          // background: 'transparent', // Ensure CSS doesn't override alpha
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
  if (context === null) { // Check for null specifically
    throw new Error('useWebGL must be used within a WebGLProvider');
  }
  return context;
}