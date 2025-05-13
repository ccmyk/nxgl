// contexts/WebGLContext.jsx
'use client';

import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
} from 'react';
import { Renderer, Camera, Transform } from 'ogl';

export const WebGLContext = createContext(null);

export function WebGLProvider({ children, canvasRef, onReadyAndResourcesLoaded }) {
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const sceneRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!canvasRef?.current) return;

    const renderer = new Renderer({ dpr: 2, canvas: canvasRef.current, alpha: true });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 1);

    const camera = new Camera(gl);
    camera.position.z = 1;

    const scene = new Transform();

    rendererRef.current = renderer;
    cameraRef.current = camera;
    sceneRef.current = scene;

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    setIsInitialized(true);

    if (typeof onReadyAndResourcesLoaded === 'function') {
      onReadyAndResourcesLoaded(true);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [canvasRef, onReadyAndResourcesLoaded]);

  return (
    <WebGLContext.Provider
      value={{
        renderer: rendererRef.current,
        camera: cameraRef.current,
        scene: sceneRef.current,
        isInitialized,
        gl: rendererRef.current?.gl,
      }}
    >
      {children}
    </WebGLContext.Provider>
  );
}

export function useWebGL() {
  return useContext(WebGLContext);
}