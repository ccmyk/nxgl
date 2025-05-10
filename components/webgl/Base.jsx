// components/webgl/Base.jsx
'use client';

import React, { useRef, useEffect, useState, useCallback, forwardRef } from 'react';
import { Renderer, Program, Mesh, Texture, Triangle, Vec2 } from 'ogl'; // Core OGL imports
import gsap from 'gsap'; // For animations
import styles from './Base.module.pcss'; // Assuming basic styles exist
import fragmentShader from '@/shaders/base/main.frag.glsl'; // Import shaders
import vertexShader from '@/shaders/base/main.vert.glsl';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'; // IO Hook
import { useLenis } from '@/hooks/useLenis'; // Scroll Hook (optional, if scroll needed directly)
import { clamp, lerp } from '@/lib/math'; // Math utils

// ForwardRef allows parent components to potentially call methods on this component if needed
const Base = forwardRef(({
  src, // REQUIRED: URL for the image or video
  ioOptions = { threshold: 0.2 }, // IO options, trigger slightly later
  // Pass a ref to the element that should trigger IO and mouse events
  // This could be the parent div or the media element itself
  triggerElementRef,
  touch = false, // Pass touch detection result
  isOppositeAnim = false, // Determines initial uStart value for reveal direction
  className = '', // Allow passing additional classes to the canvas
}, ) => {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const meshRef = useRef(null);
  const programRef = useRef(null);
  const textureRef = useRef(null);
  const glRef = useRef(null);
  const rafIdRef = useRef(null);
  const isMountedRef = useRef(false);
  const isVideoRef = useRef(false);
  const mediaElementRef = useRef(null); // Ref to hold the loaded Image/Video object

  // State for IO visibility and exit animation
  const [isActive, setIsActive] = useState(false);
  const [isExiting, setIsExiting] = useState(false); // For fade-out/blur effect on exit

  // State/Refs for mouse interaction and scroll control
  const mousePosRef = useRef({ current: [0, 0], target: [0, 0], ease: 0.06 });
  const scrollControlRef = useRef({
    current: 0, target: 0, limit: 1, start: 0, prog: 0, lerp: 0.065, stop: 0, timeline: null, // GSAP timeline for scroll effect
  });
  const boundsRef = useRef({ x: 0, y: 0, width: 1, height: 1 }); // Element bounds
  const viewportSizeRef = useRef({ width: 1, height: 1 }); // Window size

  // Use IO hook on the trigger element, freeze once visible for reveal
  const [isInView] = useIntersectionObserver(triggerElementRef, ioOptions, true);

  // Use Lenis context to get scroll position
  const { lenis } = useLenis(); // Get the Lenis instance ref
  const currentScrollY = useRef(0);
  useEffect(() => {
    const lenisInstance = lenis?.current;
    if (!lenisInstance) {
      return;
    }
    const unsubscribe = lenisInstance.on('scroll', ({ scroll }) => {
      currentScrollY.current = scroll;
    });
    return unsubscribe;
  }, [lenis]);

  // --- Initialization Effect ---
  useEffect(() => {
    if (!canvasRef.current || !src || !triggerElementRef?.current) {
      return; // Need canvas, src, and trigger
    }
    isMountedRef.current = true;

    let renderer, mesh, program, texture, geometry, tl;

    try {
      // --- OGL Setup (derived from 🖼️/base.js constructor) ---
      renderer = new Renderer({ canvas: canvasRef.current, alpha: true, dpr: Math.min(window.devicePixelRatio, 2) });
      const gl = renderer.gl;
      glRef.current = gl;
      rendererRef.current = renderer;

      geometry = new Triangle(gl); // Fullscreen triangle geometry

      texture = new Texture(gl, { generateMipmaps: false });
      textureRef.current = texture;

      program = new Program(gl, {
        vertex: vertexShader, // Use the shaders from /base directory
        fragment: fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uStart: { value: isOppositeAnim ? -0.8 : 0.8 }, // Initial reveal state (animated by GSAP)
          uStart1: { value: 0.5 }, // Uniform from shader (might not be used actively)
          uTextureSize: { value: new Vec2(1, 1) }, // Placeholder, updated on load
          uCover: { value: new Vec2(1, 1) }, // Placeholder, updated on resize
          tMap: { value: texture },
          uMouse: { value: new Vec2(0, 0) }, // Mouse position uniform
        },
        transparent: true, // Match legacy
        depthTest: false,
        depthWrite: false,
      });
      programRef.current = program;

      mesh = new Mesh(gl, { geometry, program });
      meshRef.current = mesh; // No scene needed, rendering mesh directly

      // --- GSAP Timeline for Scroll Reveal (derived from 🖼️/position.js updateAnim) ---
      tl = gsap.timeline({ paused: true })
        .fromTo(program.uniforms.uStart,
          { value: isOppositeAnim ? -0.8 : 0.8 }, // Start from opposite side if needed
          { value: 0, ease: 'power2.inOut', // Animate uStart to 0
            onComplete: () => { scrollControlRef.current.stop = 1; } // Stop scroll updates after reveal
          }, 0);
      scrollControlRef.current.timeline = tl;

      // --- Media Loading ---
      isVideoRef.current = src.includes('.mp4') || src.includes('.webm'); // Basic check
      const media = isVideoRef.current ? document.createElement('video') : new Image();
      mediaElementRef.current = media; // Store the media object

      const updateTextureAndSize = (loadedMedia) => {
        texture.image = loadedMedia; // Update OGL texture
        requestAnimationFrame(() => { // Ensure DOM is updated before getting size
            const naturalWidth = isVideoRef.current ? loadedMedia.videoWidth : loadedMedia.naturalWidth;
            const naturalHeight = isVideoRef.current ? loadedMedia.videoHeight : loadedMedia.naturalHeight;
            if (programRef.current) { // Check if program still exists
                programRef.current.uniforms.uTextureSize.value = [naturalWidth || 1, naturalHeight || 1];
            }
            handleResize(); // Update cover uniform and renderer size
        });
      };

      if (isVideoRef.current) {
        media.muted = true;
        media.loop = true;
        media.playsInline = true;
        media.autoplay = false; // Don't autoplay until active
        media.preload = 'metadata'; // Load enough to get dimensions
        media.onloadedmetadata = () => updateTextureAndSize(media);
        media.src = src;
        media.load(); // Important for mobile
      } else {
        media.onload = () => updateTextureAndSize(media);
        media.onerror = () => console.error("Failed to load image:", src);
        media.src = src;
      }

      console.log('Base WebGL Initialized:', src);

    } catch (e) {
      console.error("Error initializing Base WebGL:", e);
    }

    // --- Cleanup ---
    return () => {
      isMountedRef.current = false;
      cancelAnimationFrame(rafIdRef.current);
      tl?.kill();
      mesh?.geometry?.dispose();
      program?.gl?.deleteProgram(program.program);
      texture?.dispose();
      renderer?.dispose();
      mediaElementRef.current = null; // Clear media ref
      console.log("Base WebGL Cleanup:", src);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, isOppositeAnim]); // Re-initialize if src or anim direction changes

  // --- Resize Handler ---
  const handleResize = useCallback(() => {
    const renderer = rendererRef.current;
    const program = programRef.current;
    const triggerElement = triggerElementRef?.current; // Use the trigger element for bounds
    if (!renderer || !program || !triggerElement) {
      return;
    }

    const bound = triggerElement.getBoundingClientRect();
    boundsRef.current = { x: bound.left, y: bound.top, width: bound.width, height: bound.height };
    viewportSizeRef.current = { width: window.innerWidth, height: window.innerHeight };

    renderer.setSize(bound.width, bound.height); // Size renderer to the trigger element
    program.uniforms.uCover.value = [bound.width, bound.height]; // Update cover uniform

    // Recalculate scroll trigger points (from 🖼️/base.js onResize)
    const screenH = viewportSizeRef.current.height;
    const elementH = boundsRef.current.height;
    let calc = 0;
    let fix = touch ? 0 : screenH * 0.2; // Adjust trigger point on desktop
    if (elementH > screenH * 0.7) { // Adjust trigger if element is tall
      calc = screenH * -0.4;
    }
    scrollControlRef.current.start = parseInt(boundsRef.current.y - screenH + window.scrollY + fix);
    scrollControlRef.current.limit = parseInt(elementH + calc + fix);

  }, [triggerElementRef, touch]); // Depend on trigger element and touch status

  useEffect(() => {
    handleResize(); // Initial call
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // --- Mouse Interaction ---
  useEffect(() => {
    const node = triggerElementRef?.current;
    if (!node || touch) {
      return; // Only on non-touch
    }

    const moveFn = (e) => {
      mousePosRef.current.ease = 0.03; // Faster lerp on move
      const rect = node.getBoundingClientRect();
      const x = e.clientX - rect.left;
      // Map mouse X position within element bounds to -0.5 to 0.5 range
      mousePosRef.current.target[0] = (x / rect.width) - 0.5;
      // Y position wasn't used in the legacy shader for this effect
      // mousePosRef.current.target[1] = (e.clientY - rect.top) / rect.height - 0.5;
    };

    const leaveFn = () => {
      mousePosRef.current.ease = 0.01; // Slower lerp on leave
      mousePosRef.current.target[0] = 0; // Return to center
      // mousePosRef.current.target[1] = 0;
    };

    node.addEventListener('mousemove', moveFn);
    node.addEventListener('mouseleave', leaveFn);

    return () => {
      node.removeEventListener('mousemove', moveFn);
      node.removeEventListener('mouseleave', leaveFn);
    };
  }, [triggerElementRef, touch]); // Depend on trigger element and touch status

  // --- IO and Active State Management ---
  useEffect(() => {
    // Start animation and media playback when in view
    if (isInView && !isActive) {
      setIsActive(true);
      setIsExiting(false); // Cancel any exit animation
      if (isVideoRef.current && mediaElementRef.current) {
        mediaElementRef.current.play().catch(e => console.warn("Video play failed:", e));
      }
      console.log('Base activated:', src);
    }
    // Stop media when not in view (but don't trigger exit animation here)
    else if (!isInView && isActive) {
       // We set isActive false immediately for the render loop,
       // but use isExiting for visual fade out effect if needed
       setIsActive(false);
       // setIsExiting(true); // Optional: trigger fade out animation
       // setTimeout(() => setIsActive(false), 600); // Delay setting fully inactive
       if (isVideoRef.current && mediaElementRef.current) {
         mediaElementRef.current.pause();
       }
       console.log('Base deactivated:', src);
    }
  }, [isInView, isActive, src]); // React to IO state changes

  // --- Render Loop ---
  useEffect(() => {
    if (!isMountedRef.current) {
      return; // Only run if mounted
    }

    const renderLoop = (time) => {
      rafIdRef.current = requestAnimationFrame(renderLoop);
      if (!isActive || !rendererRef.current || !meshRef.current || !programRef.current || !isMountedRef.current) {
          return; // Stop loop if inactive or unmounted
      }

      // Lerp mouse position
      mousePosRef.current.current[0] = lerp(mousePosRef.current.current[0], mousePosRef.current.target[0], mousePosRef.current.ease);
      // mousePosRef.current.current[1] = lerp(mousePosRef.current.current[1], mousePosRef.current.target[1], mousePosRef.current.ease);
      programRef.current.uniforms.uMouse.value = mousePosRef.current.current;

      // Update time uniform
      programRef.current.uniforms.uTime.value = time * 0.001;

      // Update scroll animation progress
      if (scrollControlRef.current.stop !== 1) {
        const y = currentScrollY.current;
        const { start, limit, lerp: scrollLerp, timeline } = scrollControlRef.current;
        const currentRelative = y - start;
        scrollControlRef.current.target = clamp(0, limit, currentRelative) / limit;
        scrollControlRef.current.current = lerp(scrollControlRef.current.current, scrollControlRef.current.target, scrollLerp);
        timeline?.progress(scrollControlRef.current.current); // Update GSAP timeline
      }

      // Update video texture if needed
      if (isVideoRef.current && textureRef.current?.image) {
        const videoElement = textureRef.current.image;
        if (videoElement.readyState >= videoElement.HAVE_ENOUGH_DATA) {
          textureRef.current.needsUpdate = true;
        }
      }

      // Render this mesh
      rendererRef.current.render({ scene: meshRef.current });
    };

    if (isActive) { // Start loop only when active
        rafIdRef.current = requestAnimationFrame(renderLoop);
    }

    return () => {
      cancelAnimationFrame(rafIdRef.current); // Stop loop on cleanup or when inactive
    };
  }, [isActive]); // Depend on active state

  // Render the dedicated canvas for this effect
  return (
    <canvas
      ref={canvasRef}
      className={`${styles.canvasElement} ${className} ${isExiting ? styles.isExiting : ''}`}
      style={{
         // Let parent control layout, canvas fills parent
         position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
         opacity: isActive || isExiting ? 1 : 0, // Control visibility via opacity
         transition: 'opacity 0.6s cubic-bezier(0.55, 0, 0.1, 1)', // Fade out
         filter: isExiting ? 'blur(6px)' : 'none', // Optional blur on exit
      }}
    />
  );
});

Base.displayName = 'Base';
export default Base;
