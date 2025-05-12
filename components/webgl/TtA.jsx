// components/webgl/TtA.jsx
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Program, Mesh, Text as OGLText, Geometry, Post, Renderer, Transform } from 'ogl';
import gsap from 'gsap';
import { useWebGL } from '@/contexts/WebGLContext';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import fragmentShaderSource from '@/shaders/tta/msdf.frag.glsl';
import vertexShaderSource from '@/shaders/tt/msdf.vert.glsl';
import parentFragmentShaderSource from '@/shaders/tta/parent.frag.glsl';
import styles from './TtA.module.pcss';
import { lerp, clamp } from '@/lib/math';

export default function TtA({
  text = "ABOUT TITLE",
  fontJson,          // JSON font data (required)
  fontTexture,       // MSDF texture (required)
  isVisible = true,
  ioRefSelf,         // Intersection observer trigger ref (required)
  align = 'center',
  letterSpacing = -0.024,
  size = 3.8,
  width = undefined,
  color = 1.0,       // 1.0 for white (from legacy data-white="1")
  animationParams = { durationIn: 0.8 },
  ioOptions = { threshold: 0.1 },
  className = '',
}) {
  const { camera, isInitialized } = useWebGL();
  // Own WebGL renderer and scene for this component's canvas
  const rendererRef = useRef(null);
  const postRef = useRef(null);
  const meshRef = useRef(null);
  const programRef = useRef(null);
  const geometryRef = useRef(null);
  const textDataRef = useRef(null);
  const animationTimelineRef = useRef(null);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);

  const [interactionData, setInteractionData] = useState({
    mouseX: 0,
    targetMouseX: 0,
    lerpFactor: 0.06,
  });

  const [isInView] = useIntersectionObserver(ioRefSelf, ioOptions, true);
  const combinedIsActive = isInitialized && isVisible && isInView;

  // Initialize dedicated WebGL context and objects
  useEffect(() => {
    if (!fontJson || !fontTexture || !isInitialized || !text || !canvasRef.current) return;
    let renderer, scene, oglText, geometry, program, mesh, post;
    try {
      renderer = new Renderer({
        canvas: canvasRef.current,
        alpha: true,
        dpr: Math.min(window.devicePixelRatio, 2),
        width: canvasRef.current.offsetWidth,
        height: canvasRef.current.offsetHeight,
      });
      const newGl = renderer.gl;
      rendererRef.current = renderer;
      scene = new Transform();
      sceneRef.current = scene;
      oglText = new OGLText({ font: fontJson, text, width, align, letterSpacing, size, lineHeight: 1 });
      textDataRef.current = oglText;
      geometry = new Geometry(newGl, {
        position: { size: 3, data: oglText.buffers.position },
        uv: { size: 2, data: oglText.buffers.uv },
        id: { size: 1, data: oglText.buffers.id },
        index: { data: oglText.buffers.index },
      });
      geometry.computeBoundingBox();
      geometryRef.current = geometry;
      // Create shader program for this text (use TtA-specific fragment shader)
      program = new Program(newGl, {
        vertex: vertexShaderSource,
        fragment: fragmentShaderSource,
        uniforms: {
          tMap: { value: fontTexture },
          uColor: { value: color },
        },
        transparent: true,
        cullFace: null,
        depthWrite: false,
      });
      programRef.current = program;
      mesh = new Mesh(newGl, { geometry, program });
      mesh.setParent(scene);
      // Center text similarly to Tt (adjust Y for baseline)
      mesh.position.x = -oglText.width * 0.5;
      mesh.position.y = oglText.height * 0.58;
      meshRef.current = mesh;
      // Post-processing pass for ripple/distortion effect
      post = new Post(newGl);
      post.addPass({
        fragment: parentFragmentShaderSource,
        uniforms: {
          uTime: { value: 0.4 },
          uStart: { value: -1.0 },
          uMouse: { value: -1.0 },
        },
      });
      postRef.current = post;
      console.log('TtA initialized:', text);
    } catch (error) {
      console.error("Error initializing TtA:", text, error);
    }
    return () => {
      // Cleanup: remove mesh, dispose resources, kill animations
      scene?.removeChild(meshRef.current);
      programRef.current?.gl?.deleteProgram(programRef.current.program);
      geometryRef.current?.dispose();
      rendererRef.current?.dispose();
      postRef.current = null;
      animationTimelineRef.current?.kill();
      console.log("TtA Cleanup:", text);
    };
  }, [fontJson, fontTexture, isInitialized, text, width, align, letterSpacing, size, color]);

  // Handle resizing of this canvas to fill its container (if parent resizes)
  const handleResize = useCallback(() => {
    if (!rendererRef.current || !camera || !textDataRef.current || !canvasRef.current) return;
    const renderer = rendererRef.current;
    const canvas = canvasRef.current;
    const parent = canvas.parentNode;
    if (!parent) return;
    const w = parent.offsetWidth;
    const h = parent.offsetHeight;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    renderer.setSize(w, h);
    camera.perspective({ aspect: w / h });
    // Optionally adjust viewport units if needed (using global camera for consistency)
  }, [camera]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Mouse move ripple interaction within this effect's container (the parent element of canvas)
  useEffect(() => {
    const container = canvasRef.current?.parentNode;
    if (!container || !postRef.current) return;
    const moveFn = e => {
      const rect = container.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const relX = (clientX - rect.left) / rect.width;
      setInteractionData(prev => ({
        ...prev,
        targetMouseX: clamp(-1.0, 1.2, relX * 2.2 - 1.1),
        lerpFactor: 0.02,
      }));
    };
    const leaveFn = () => {
      setInteractionData(prev => ({
        ...prev,
        targetMouseX: -1.0,
        lerpFactor: 0.01,
      }));
    };
    container.addEventListener('mousemove', moveFn);
    container.addEventListener('mouseleave', leaveFn);
    container.addEventListener('touchmove', moveFn, { passive: true });
    container.addEventListener('touchend', leaveFn);
    return () => {
      container.removeEventListener('mousemove', moveFn);
      container.removeEventListener('mouseleave', leaveFn);
      container.removeEventListener('touchmove', moveFn);
      container.removeEventListener('touchend', leaveFn);
    };
  }, []);

  // Lerp the mouse interaction uniform for ripple effect
  useEffect(() => {
    if (!postRef.current) return;
    const { mouseX, targetMouseX, lerpFactor } = interactionData;
    if (Math.abs(mouseX - targetMouseX) > 0.001) {
      const newVal = lerp(mouseX, targetMouseX, lerpFactor);
      postRef.current.passes[0].uniforms.uMouse.value = newVal;
      setInteractionData(prev => ({ ...prev, mouseX: newVal }));
    }
  }, [interactionData]);

  // Trigger reveal animation when component becomes active (in view)
  useEffect(() => {
    if (!combinedIsActive || !postRef.current || animationTimelineRef.current?.isActive()) return;
    const { durationIn } = animationParams;
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(postRef.current.passes[0].uniforms.uStart,
      { value: -0.92 },
      { value: 1.0, duration: durationIn, ease: 'power2.inOut' },
      0
    );
    tl.fromTo(canvasRef.current, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0);
    animationTimelineRef.current = tl;
    tl.play();
  }, [combinedIsActive, animationParams]);

  // Dedicated render loop for this component's canvas
  useEffect(() => {
    if (!isInitialized || !rendererRef.current || !sceneRef.current || !camera || !postRef.current) return;
    let rafId;
    const render = () => {
      if (!rendererRef.current) {
        cancelAnimationFrame(rafId);
        return;
      }
      // Render scene with postprocessing
      postRef.current.render({ scene: sceneRef.current, camera });
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [isInitialized, camera]);

  // Render the canvas element for this text effect
  return <canvas ref={canvasRef} className={`${styles.canvasElement} ${className}`} />;
}