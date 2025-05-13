// components/webgl/Loader.jsx
'use client';

import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Renderer, Camera, Transform, Geometry, Program, Mesh } from 'ogl';
import frag from '@/shaders/loader/main.frag.glsl';
import vert from '@/shaders/loader/main.vert.glsl';
import styles from './Loader.module.pcss';

const WebGLLoader = forwardRef(({ onFadeOutComplete }, ref) => {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const meshRef = useRef(null);
  const frameId = useRef(null);
  const startTime = useRef(Date.now());

  // Expose control method to parent (DOM Loader)
  useImperativeHandle(ref, () => ({
    playFadeOut: () => {
      stopRendering();
      if (onFadeOutComplete) onFadeOutComplete();
    },
  }));

  const stopRendering = () => {
    if (frameId.current) cancelAnimationFrame(frameId.current);
    frameId.current = null;
  };

  const animate = () => {
    const elapsed = (Date.now() - startTime.current) * 0.001;
    if (meshRef.current) {
      meshRef.current.program.uniforms.uTime.value = elapsed;
    }
    rendererRef.current.render({
      scene: meshRef.current.parent,
      camera: rendererRef.current.camera,
    });
    frameId.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const renderer = new Renderer({
      dpr: 2,
      canvas: canvasRef.current,
      alpha: true,
    });
    rendererRef.current = renderer;
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 1);

    const camera = new Camera(gl);
    camera.position.z = 1;
    renderer.camera = camera;

    const scene = new Transform();

    const geometry = new Geometry(gl, {
      position: {
        size: 2,
        data: new Float32Array([-1, -1, 3, -1, -1, 3]),
      },
      uv: {
        size: 2,
        data: new Float32Array([0, 0, 2, 0, 0, 2]),
      },
    });

    const program = new Program(gl, {
      vertex: vert,
      fragment: frag,
      uniforms: {
        uTime: { value: 0 },
        uResolution: {
          value: [gl.canvas.width, gl.canvas.height],
        },
      },
      transparent: true,
    });

    const mesh = new Mesh(gl, { geometry, program });
    mesh.setParent(scene);
    meshRef.current = mesh;

    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      program.uniforms.uResolution.value = [
        gl.canvas.width,
        gl.canvas.height,
      ];
    };
    window.addEventListener('resize', resize);
    resize();

    animate();

    return () => {
      stopRendering();
      window.removeEventListener('resize', resize);
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} />;
});

export default WebGLLoader;