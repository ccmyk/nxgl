// components/webgl/Loader.jsx
'use client';

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Renderer, Camera, Transform, Geometry, Program, Mesh } from 'ogl';
import frag from '@/shaders/loader/main.frag.glsl';
import vert from '@/shaders/loader/main.vert.glsl';
import styles from './Loader.module.pcss';

const Loader = forwardRef(({ onFadeOutComplete }, ref) => {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const meshRef = useRef(null);
  const animationFrameId = useRef(null);
  const startTime = useRef(Date.now());

  useImperativeHandle(ref, () => ({
    playFadeOut: () => {
      cancelAnimationFrame(animationFrameId.current);
      if (onFadeOutComplete) onFadeOutComplete();
    },
  }));

  const resize = () => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.setSize(window.innerWidth, window.innerHeight);
    meshRef.current.program.uniforms.uResolution.value = [
      renderer.gl.canvas.width,
      renderer.gl.canvas.height,
    ];
  };

  const animate = () => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    meshRef.current.program.uniforms.uTime.value = elapsed;
    rendererRef.current.render({
      scene: meshRef.current.parent,
      camera: rendererRef.current.camera,
    });
    animationFrameId.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const renderer = new Renderer({ dpr: 2, canvas: canvasRef.current, alpha: true });
    rendererRef.current = renderer;

    const camera = new Camera(renderer.gl);
    camera.position.z = 1;
    rendererRef.current.camera = camera;

    const scene = new Transform();

    const geometry = new Geometry(renderer.gl, {
      position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
      uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) },
    });

    const program = new Program(renderer.gl, {
      vertex: vert,
      fragment: frag,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [renderer.gl.canvas.width, renderer.gl.canvas.height] },
      },
      transparent: true,
    });

    const mesh = new Mesh(renderer.gl, { geometry, program });
    mesh.setParent(scene);
    meshRef.current = mesh;

    window.addEventListener('resize', resize);
    resize();
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener('resize', resize);
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} />;
});

Loader.displayName = 'Loader';
export default Loader;