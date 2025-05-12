// components/webgl/TtF.jsx
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Program, Mesh, Text as OGLText, Geometry, Post, Renderer, Transform } from 'ogl';
import gsap from 'gsap';
import { useWebGL } from '@/contexts/WebGLContext';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import fragmentShaderSource from '@/shaders/ttf/msdf.frag.glsl';
import vertexShaderSource from '@/shaders/tt/msdf.vert.glsl';
import parentFragmentShaderSource from '@/shaders/ttf/parent.frag.glsl';
import styles from './TtF.module.pcss';
import { lerp, clamp } from '@/lib/math';

export default function TtF({
  text = "FOOTER TITLE",
  fontJson,         // required
  fontTexture,      // required
  scrollProgress = 0, // scroll position (0-1)
  isVisible = true,
  interactionElementRef, // e.g., a link to hover
  ioRefSelf,
  align = 'center',
  letterSpacing = -0.022,
  size = 5.4,
  width = undefined,
  color = 1.0,
  ioOptions = { threshold: 0.1 },
  className = '',
}) {
  const { camera, isInitialized } = useWebGL();
  const rendererRef = useRef(null);
  const postRef = useRef(null);
  const meshRef = useRef(null);
  const programRef = useRef(null);
  const geometryRef = useRef(null);
  const textDataRef = useRef(null);
  const scrollAnimationRef = useRef(null);
  const hoverAnimationRef = useRef(null);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);

  const [interactionData] = useState({}); // not heavily used here
  const [isInView] = useIntersectionObserver(ioRefSelf, ioOptions, true);
  const combinedIsActive = isInitialized && isVisible && isInView;

  // Initialize on mount
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
      mesh.position.x = -oglText.width * 0.5;
      mesh.position.y = oglText.height * 0.58;
      meshRef.current = mesh;
      // Post-processing shader for footer wave effect
      post = new Post(newGl);
      post.addPass({
        fragment: parentFragmentShaderSource,
        uniforms: {
          uTime: { value: 0 },
          uStart: { value: 0.39 },
          uMouseT: { value: 0 },
          uMouse: { value: 0.39 },
          uOut: { value: 1.0 },
        },
      });
      postRef.current = post;
      // GSAP timelines for scroll and hover interactions
      scrollAnimationRef.current = gsap.timeline({ paused: true })
        .fromTo(post.passes[0].uniforms.uTime, { value: 0 }, { value: 2, duration: 0.3, ease: 'power2.inOut' }, 0)
        .fromTo(post.passes[0].uniforms.uTime, { value: 2 }, { value: 0, duration: 0.3, ease: 'power2.inOut' }, 0.7)
        .fromTo(post.passes[0].uniforms.uStart, { value: 0.39 }, { value: 0.8, duration: 1, ease: 'power2.inOut' }, 0);
      hoverAnimationRef.current = gsap.timeline({ paused: true })
        .fromTo(post.passes[0].uniforms.uMouseT, { value: 0.2 }, { value: 2, duration: 0.3, ease: 'power2.inOut' }, 0.1)
        .fromTo(post.passes[0].uniforms.uMouseT, { value: 2 }, { value: 0, duration: 0.3, ease: 'power2.inOut' }, 0.7)
        .fromTo(post.passes[0].uniforms.uMouse, { value: 0.39 }, { value: 0.8, duration: 0.9, ease: 'none' }, 0.1);
      console.log('TtF initialized:', text);
    } catch (error) {
      console.error("Error initializing TtF:", text, error);
    }
    return () => {
      scene?.removeChild(meshRef.current);
      programRef.current?.gl?.deleteProgram(programRef.current.program);
      geometryRef.current?.dispose();
      rendererRef.current?.dispose();
      scrollAnimationRef.current?.kill();
      hoverAnimationRef.current?.kill();
      postRef.current = null;
      console.log("TtF Cleanup:", text);
    };
  }, [fontJson, fontTexture, isInitialized, text, width, align, letterSpacing, size, color]);

  // Handle resize
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
  }, [camera]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Update scroll animation based on scrollProgress prop
  useEffect(() => {
    if (scrollAnimationRef.current) {
      gsap.to(scrollAnimationRef.current, { progress: scrollProgress, duration: 0.1, ease: 'none' });
    }
  }, [scrollProgress]);

  // Hover interaction on linked element
  useEffect(() => {
    const elem = interactionElementRef?.current;
    if (!elem || !hoverAnimationRef.current) return;
    const onEnter = () => hoverAnimationRef.current.play();
    const onLeave = () => hoverAnimationRef.current.reverse();
    elem.addEventListener('mouseenter', onEnter);
    elem.addEventListener('mouseleave', onLeave);
    return () => {
      elem.removeEventListener('mouseenter', onEnter);
      elem.removeEventListener('mouseleave', onLeave);
    };
  }, [interactionElementRef]);

  // Reveal/hide animation based on visibility
  useEffect(() => {
    if (!postRef.current) return;
    gsap.to(postRef.current.passes[0].uniforms.uOut, {
      value: combinedIsActive ? 1.0 : -0.2,
      duration: combinedIsActive ? 0.8 : 1.0,
      ease: 'power2.inOut',
      delay: combinedIsActive ? 0.2 : 0,
      onStart: () => { if (combinedIsActive && canvasRef.current) canvasRef.current.style.opacity = 1; },
      onComplete: () => { if (!combinedIsActive && canvasRef.current) canvasRef.current.style.opacity = 0; }
    });
  }, [combinedIsActive]);

  // Render loop for footer effect
  useEffect(() => {
    if (!isInitialized || !rendererRef.current || !sceneRef.current || !camera || !postRef.current) return;
    let rafId;
    const render = () => {
      if (!rendererRef.current) {
        cancelAnimationFrame(rafId);
        return;
      }
      postRef.current.render({ scene: sceneRef.current, camera });
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [isInitialized, camera]);

  return <canvas ref={canvasRef} className={`${styles.canvasElement} ${className}`} style={{ opacity: 0 }} />;
}