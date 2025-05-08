// components/webgl/effects/Roll.jsx
'use client';

import React, { useRef, useEffect, useState, useCallback, forwardRef } from 'react';
import { Renderer, Camera, Transform, Program, Mesh, Texture, Plane, Vec2 } from 'ogl';
import gsap from 'gsap';
import styles from './Roll.module.pcss';
import fragmentShader from '@/shaders/roll/single.frag.glsl';
import vertexShader from '@/shaders/roll/single.vert.glsl';
import { useLenis } from '@/hooks/useLenis';
import { clamp, lerp } from '@/lib/math';

const ScrollRollEffect = forwardRef(({ src, nextSrc, mediaElementRef, triggerElementRef, touch = false }, ref) => {
  const canvasRef = useRef(null);
  const glRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const meshRef = useRef(null);
  const textureARef = useRef(null);
  const textureBRef = useRef(null);
  const programRef = useRef(null);
  const rafIdRef = useRef(null);

  const scrollStateRef = useRef({
    current: 0,
    target: 0,
    progress: 0,
    limit: 1,
    lerp: 0.075,
  });

  const mouseRef = useRef({ x: 0, ease: 0.05 });
  const viewportRef = useRef({ width: 1, height: 1 });

  const [isActive, setIsActive] = useState(true); // Hook up to IO logic if needed

  const lenis = useLenis();
  const currentScrollY = useRef(0);
  useEffect(() => {
    if (!lenis?.current) return;
    const unsubscribe = lenis.current.on('scroll', ({ scroll }) => {
      currentScrollY.current = scroll;
    });
    return unsubscribe;
  }, [lenis]);

  useEffect(() => {
    if (!canvasRef.current || !mediaElementRef?.current || !src || !nextSrc) return;

    const renderer = new Renderer({ canvas: canvasRef.current, alpha: true });
    const gl = renderer.gl;
    glRef.current = gl;
    rendererRef.current = renderer;

    const camera = new Camera(gl);
    camera.position.z = 1;
    cameraRef.current = camera;

    const scene = new Transform();

    const geometry = new Plane(gl);

    const textureA = new Texture(gl);
    const textureB = new Texture(gl);
    textureARef.current = textureA;
    textureBRef.current = textureB;

    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uChange: { value: 0 },
        uMouse: { value: new Vec2(0, 0) },
        tMap: { value: textureA },
        tMap2: { value: textureB },
        uCover: { value: new Vec2(1, 1) },
      },
      transparent: true,
    });
    programRef.current = program;

    const mesh = new Mesh(gl, { geometry, program });
    mesh.setParent(scene);
    meshRef.current = mesh;

    const imgA = new Image();
    imgA.src = src;
    imgA.onload = () => {
      textureA.image = imgA;
    };

    const imgB = new Image();
    imgB.src = nextSrc;
    imgB.onload = () => {
      textureB.image = imgB;
    };

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      viewportRef.current = { width: w, height: h };
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', resize);
    resize();

    const render = (t) => {
      rafIdRef.current = requestAnimationFrame(render);

      if (!isActive) return;

      mouseRef.current.x = lerp(mouseRef.current.x, 0, mouseRef.current.ease);
      program.uniforms.uMouse.value = [mouseRef.current.x, 0];
      program.uniforms.uTime.value = t * 0.001;

      const { start, limit, lerp: scrollLerp } = scrollStateRef.current;
      const y = currentScrollY.current;
      const currentRel = y - start;
      scrollStateRef.current.target = clamp(0, limit, currentRel) / limit;
      scrollStateRef.current.current = lerp(scrollStateRef.current.current, scrollStateRef.current.target, scrollLerp);
      program.uniforms.uChange.value = scrollStateRef.current.current;

      renderer.render({ scene, camera });
    };
    rafIdRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener('resize', resize);
      mesh?.geometry?.dispose();
      program?.gl?.deleteProgram(program.program);
      textureA?.dispose();
      textureB?.dispose();
      renderer?.dispose();
    };
  }, [src, nextSrc, mediaElementRef]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvasElement}
      style={{ visibility: isActive ? 'visible' : 'hidden' }}
    />
  );
});

ScrollRollEffect.displayName = 'ScrollRollEffect';
export default ScrollRollEffect;