// src/webgl/providers/OGLRoot.tsx
'use client';

import { Canvas } from 'react-ogl';

export function OGLRoot({ children }: { children: React.ReactNode }) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ alpha: true }}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}
    >
      {children}
    </Canvas>
  );
}