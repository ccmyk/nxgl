// components/webgl/Base.jsx
'use client';

import { useEffect, useRef } from 'react';
import { Renderer, Camera, Transform, Geometry, Program, Mesh } from 'ogl';
import vert from '@/shaders/base/main.vert.glsl';
import frag from '@/shaders/base/main.frag.glsl';
import styles from './Base.module.pcss';

export default function Base() {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const meshRef = useRef(null);
  const frameId = useRef(null);
  const startTime = useRef(Date.now());

  const resize = () => {
    const renderer = rendererRef.current;
    const gl = renderer.gl;

    renderer.setSize(window.innerWidth, window.innerHeight);
    meshRef.current.program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
  };

  const animate = () => {
    const elapsed = (Date.now() - startTime.current) * 0.001;

    meshRef.current.program.uniforms.uTime.value = elapsed;
    rendererRef.current.render({ scene: meshRef.current.parent, camera: rendererRef.current.camera });
    frameId.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = new Renderer({ canvas, dpr: Math.min(window.devicePixelRatio, 2), alpha: true });
    rendererRef.current = renderer;

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    const camera = new Camera(gl);
    camera.position.z = 1;
    rendererRef.current.camera = camera;

    const scene = new Transform();

    const geometry = new Geometry(gl, {
      position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
      uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) },
    });

    const program = new Program(gl, {
      vertex: vert,
      fragment: frag,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [gl.canvas.width, gl.canvas.height] },
      },
      transparent: true,
    });

    const mesh = new Mesh(gl, { geometry, program });
    mesh.setParent(scene);
    meshRef.current = mesh;

    window.addEventListener('resize', resize, false);
    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameId.current);
      renderer.dispose();
    };
  }, []);

  return (
    <canvas ref={canvasRef} className={styles.canvas} />
  );
}
