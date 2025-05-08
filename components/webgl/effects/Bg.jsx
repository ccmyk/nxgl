// components/webgl/effects/Bg.jsx
'use client';

import React, { useRef, useEffect } from 'react';
import { Renderer, Camera, Program, Mesh, Plane, Vec2 } from 'ogl';
import fragmentShader from '@/shaders/bg/main.frag.glsl';
import vertexShader from '@/shaders/bg/main.vert.glsl';
import styles from './Bg.module.pcss';

const Bg = () => {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const programRef = useRef(null);
  const rafIdRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new Renderer({ canvas, alpha: true });
    const gl = renderer.gl;
    rendererRef.current = renderer;

    const camera = new Camera(gl);
    camera.position.z = 1;

    const geometry = new Plane(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vec2(window.innerWidth, window.innerHeight) },
      },
      transparent: true,
    });
    programRef.current = program;

    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = [width, height];
    };
    window.addEventListener('resize', resize);
    resize();

    const render = (time) => {
      rafIdRef.current = requestAnimationFrame(render);
      program.uniforms.uTime.value = time * 0.001;
      renderer.render({ scene: mesh, camera });
    };
    rafIdRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener('resize', resize);
      mesh.geometry.dispose();
      program.gl.deleteProgram(program.program);
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvasElement} />;
};

export default Bg;