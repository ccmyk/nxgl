// contexts/WebGLContext.jsx
'use client';

import { createContext, useContext, useRef } from 'react';

const WebGLContext = createContext(null);

export const useWebGL = () => useContext(WebGLContext);

export default function WebGLProvider({ children }) {
  const webgl = useRef({});

  const register = (name, instance) => {
    webgl.current[name] = instance;
  };

  const unregister = (name) => {
    delete webgl.current[name];
  };

  const value = { webgl, register, unregister };

  return <WebGLContext.Provider value={value}>{children}</WebGLContext.Provider>;
}