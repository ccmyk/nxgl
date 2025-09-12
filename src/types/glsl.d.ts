// src/types/glsl.d.ts
declare module '*.glsl' {
    const url: string; // Imported as asset URL by Turbopack
    export default url;
  }