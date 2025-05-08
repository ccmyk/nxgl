// components/webgl/Base.jsx
'use client';

import React, { useRef, useEffect, useState, useCallback,forwardRef } from 'react';
import { Renderer, Program, Mesh, Texture, Triangle, Vec2 } from 'ogl';
import gsap from 'gsap';
import styles from './Base.module.pcss';
import fragmentShader from '@/shaders/base/main.frag.glsl';
import vertexShader from '@/shaders/base/main.vert.glsl';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useLenis } from '@/hooks/useLenis';
import { clamp, lerp } from '@/lib/math';

const Base = forwardRef(({
  src,
  isVisible = true,
  ioOptions = { threshold: 0.1 },
  mediaElementRef,
  triggerElementRef,
  touch = false,
  isOppositeAnim = false
}, ref) => {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const meshRef = useRef(null);
  const programRef = useRef(null);
  const textureRef = useRef(null);
  const glRef = useRef(null);
  const rafIdRef = useRef(null);
  const isMountedRef = useRef(false);
  const isVideoRef = useRef(false);

  const [isActive, setIsActive] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const mousePosRef = useRef({ current: [0, 0], target: [0, 0], ease: 0.06 });
  const scrollControlRef = useRef({
    current: 0,
    target: 0,
    limit: 1,
    start: 0,
    prog: 0,
    lerp: 0.065,
    stop: 0,
  });
  const boundsRef = useRef({ x: 0, y: 0, width: 1, height: 1 });
  const viewportSizeRef = useRef({ width: 1, height: 1 });

  const [isInView] = useIntersectionObserver(triggerElementRef, ioOptions, true);

  useEffect(() => {
    if (!isInView && isActive) {
      setIsExiting(true);
      setTimeout(() => setIsActive(false), 600);
    } else if (isInView) {
      setIsActive(true);
      setIsExiting(false);
    }
  }, [isInView]);

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
    if (!canvasRef.current || !mediaElementRef?.current || !src) return;
    isMountedRef.current = true;

    let renderer, mesh, program, texture, geometry, tl;

    try {
      renderer = new Renderer({ canvas: canvasRef.current, alpha: true, dpr: Math.min(window.devicePixelRatio, 2) });
      const gl = renderer.gl;
      glRef.current = gl;
      rendererRef.current = renderer;
      geometry = new Triangle(gl);
      texture = new Texture(gl, { generateMipmaps: false });
      textureRef.current = texture;

      program = new Program(gl, {
        vertex: vertexShader,
        fragment: fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uStart: { value: isOppositeAnim ? -0.8 : 0.8 },
          uStart1: { value: 0.5 },
          tMap: { value: texture },
          uCover: { value: new Vec2(1, 1) },
          uTextureSize: { value: new Vec2(1, 1) },
          uMouse: { value: new Vec2(0, 0) },
        },
        transparent: true,
      });
      programRef.current = program;

      mesh = new Mesh(gl, { geometry, program });
      meshRef.current = mesh;

      tl = gsap.timeline({ paused: true })
        .fromTo(program.uniforms.uStart,
          { value: isOppositeAnim ? -0.8 : 0.8 },
          { value: 0, ease: 'power2.inOut', onComplete: () => { scrollControlRef.current.stop = 1; } }, 0);
      scrollControlRef.current.timeline = tl;

      const mediaElement = mediaElementRef.current;
      isVideoRef.current = mediaElement.tagName === 'VIDEO';

      const updateTexture = (media) => {
        texture.image = media;
        requestAnimationFrame(() => {
          const naturalWidth = isVideoRef.current ? media.videoWidth : media.naturalWidth;
          const naturalHeight = isVideoRef.current ? media.videoHeight : media.naturalHeight;
          programRef.current.uniforms.uTextureSize.value = [naturalWidth || 1, naturalHeight || 1];
          handleResize();
        });
      };

      if (isVideoRef.current) {
        mediaElement.src = src;
        mediaElement.load();
        mediaElement.onloadedmetadata = () => updateTexture(mediaElement);
      } else {
        const img = new Image();
        img.onload = () => updateTexture(img);
        img.onerror = () => console.error("Failed to load image:", src);
        img.src = src;
      }
    } catch (e) {
      console.error("Error initializing Base:", e);
    }

    return () => {
      isMountedRef.current = false;
      cancelAnimationFrame(rafIdRef.current);
      tl?.kill();
      mesh?.geometry?.dispose();
      program?.gl?.deleteProgram(program.program);
      texture?.dispose();
      renderer?.dispose();
    };
  }, [src, mediaElementRef, isOppositeAnim]);

  const handleResize = useCallback(() => {
    const mediaNode = mediaElementRef?.current;
    const renderer = rendererRef.current;
    const program = programRef.current;
    if (!mediaNode || !renderer || !program) return;

    const bound = mediaNode.getBoundingClientRect();
    boundsRef.current = { x: bound.left, y: bound.top, width: bound.width, height: bound.height };
    viewportSizeRef.current = { width: window.innerWidth, height: window.innerHeight };

    renderer.setSize(bound.width, bound.height);
    program.uniforms.uCover.value = [bound.width, bound.height];

    const screenH = viewportSizeRef.current.height;
    const elementH = boundsRef.current.height;
    let calc = 0;
    let fix = touch ? 0 : screenH * 0.2;
    if (mediaNode.clientHeight > screenH * 0.7) {
      calc = screenH * -0.4;
    }
    scrollControlRef.current.start = parseInt(boundsRef.current.y - screenH + window.scrollY + fix);
    scrollControlRef.current.limit = parseInt(elementH + calc + fix);
  }, [mediaElementRef, touch]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  useEffect(() => {
    const node = triggerElementRef?.current;
    if (!node || touch) return;
    const moveFn = (e) => {
      mousePosRef.current.ease = 0.03;
      const rect = node.getBoundingClientRect();
      const x = e.clientX - rect.left;
      mousePosRef.current.target[0] = (x / rect.width) - 0.5;
    };
    const leaveFn = () => {
      mousePosRef.current.ease = 0.01;
      mousePosRef.current.target[0] = 0;
    };
    node.addEventListener('mousemove', moveFn);
    node.addEventListener('mouseleave', leaveFn);
    return () => {
      node.removeEventListener('mousemove', moveFn);
      node.removeEventListener('mouseleave', leaveFn);
    };
  }, [triggerElementRef, touch]);

  useEffect(() => {
    if (!isMountedRef.current) return;
    const renderLoop = (time) => {
      rafIdRef.current = requestAnimationFrame(renderLoop);
      if (!isActive || !rendererRef.current || !meshRef.current || !programRef.current) return;

      mousePosRef.current.current[0] = lerp(mousePosRef.current.current[0], mousePosRef.current.target[0], mousePosRef.current.ease);
      mousePosRef.current.current[1] = lerp(mousePosRef.current.current[1], mousePosRef.current.target[1], mousePosRef.current.ease);
      programRef.current.uniforms.uMouse.value = mousePosRef.current.current;
      programRef.current.uniforms.uTime.value = time * 0.001;

      if (scrollControlRef.current.stop !== 1) {
        const y = currentScrollY.current;
        const { start, limit, lerp: scrollLerp } = scrollControlRef.current;
        const currentRelative = y - start;
        scrollControlRef.current.target = clamp(0, limit, currentRelative) / limit;
        scrollControlRef.current.current = lerp(scrollControlRef.current.current, scrollControlRef.current.target, scrollLerp);
        scrollControlRef.current.timeline?.progress(scrollControlRef.current.current);
      }

      if (isVideoRef.current && textureRef.current?.image) {
        const videoElement = textureRef.current.image;
        if (videoElement.readyState >= videoElement.HAVE_ENOUGH_DATA) {
          textureRef.current.needsUpdate = true;
        }
      }

      rendererRef.current.render({ scene: meshRef.current });
    };
    rafIdRef.current = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(rafIdRef.current);
  }, [isActive]);

  useEffect(() => {
    const mediaNode = mediaElementRef?.current;
    if (!mediaNode) return;
    if (isActive) {
      if (isVideoRef.current) {
        mediaNode.play().catch(e => console.error("Video play failed:", e));
      }
    } else {
      if (isVideoRef.current) {
        mediaNode.pause();
      }
    }
  }, [isActive, mediaElementRef]);

  return (
    <canvas
      ref={canvasRef}
      className={
        isExiting
          ? `${styles.canvasElement} ${styles.canvasExit}`
          : styles.canvasElement
      }
    />
  );
});

Base.displayName = 'Base';
export default Base;
