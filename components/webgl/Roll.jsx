// components/webgl/Roll.jsx
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Renderer, Program, Mesh, Texture, Triangle, Vec2 } from 'ogl';
import gsap from 'gsap';
import styles from './Roll.module.pcss'; // Assuming basic styles exist
import fragmentShader from '@/shaders/roll/single.frag.glsl'; // Import shaders
import vertexShader from '@/shaders/roll/single.vert.glsl';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useLenis } from '@/hooks/useLenis'; // To get scroll position
import { clamp, lerp } from '@/lib/math';

// This component needs refs to the individual media elements (textures)
// and the main trigger/scroll container element.
export default function Roll({
  mediaSources = [], // Array of { src: string, type: 'image' | 'video' }
  mediaElementRefs = [], // Array of refs to corresponding <img/> or <video/> in the DOM
  scrollTriggerRef, // REQUIRED: Ref to the element whose scroll progress drives the animation
  canvasContainerRef, // REQUIRED: Ref to the container where the canvas should be placed (e.g., .cRoll)
  isVisible = true,
  ioOptions = { threshold: 0 }, // Trigger as soon as any part is visible
  className = '',
}) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const meshRef = useRef(null);
  const programRef = useRef(null);
  const texturesRef = useRef([]);
  const rafIdRef = useRef(null);
  const isMountedRef = useRef(false);
  const animationTimelineRef = useRef(null); // GSAP timeline for scroll effect

  const [isActive, setIsActive] = useState(false);
  const [currentTextureIndex, setCurrentTextureIndex] = useState(0); // Track which texture is tMap

  // Scroll control state (based on 🎢/position.js)
  const scrollControlRef = useRef({
    current: 0, target: 0, limit: 1, start: 0, prog: 0, lerp: 0.03, // Adjusted lerp
    stop: 0,
  });

  // Use IO hook on the scroll trigger element
  const [isInView] = useIntersectionObserver(scrollTriggerRef, ioOptions);

  // Get scroll position from Lenis
  const { lenis } = useLenis();
  const currentScrollY = useRef(0);
  useEffect(() => {
    const lenisInstance = lenis?.current;
    if (!lenisInstance) return;
    const unsubscribe = lenisInstance.on('scroll', ({ scroll }) => {
      currentScrollY.current = scroll;
    });
    return unsubscribe;
  }, [lenis]);

  // --- Initialization ---
  useEffect(() => {
    if (!canvasRef.current || !scrollTriggerRef?.current || mediaSources.length < 2) return;
    isMountedRef.current = true;

    let renderer, mesh, program, geometry;
    const textures = [];

    try {
      // --- OGL Setup (derived from 🎢/base.js constructor) ---
      renderer = new Renderer({ canvas: canvasRef.current, alpha: true, dpr: Math.min(window.devicePixelRatio, 2) });
      const gl = renderer.gl;
      rendererRef.current = renderer;

      geometry = new Triangle(gl); // Fullscreen triangle

      // --- Load Textures ---
      mediaSources.forEach((media, index) => {
        const texture = new Texture(gl, { generateMipmaps: false });
        textures.push(texture);
        texturesRef.current.push(texture);

        const mediaElement = mediaElementRefs[index]?.current; // Get corresponding DOM element
        const isVideo = media.type === 'video';
        const element = isVideo ? document.createElement('video') : new Image();

        const updateTextureAndSize = (loadedMedia) => {
           texture.image = loadedMedia;
           // Update uniforms when the *first* two textures load
           if (index === 0 && programRef.current) {
               const size = isVideo ? [loadedMedia.videoWidth, loadedMedia.videoHeight] : [loadedMedia.naturalWidth, loadedMedia.naturalHeight];
               programRef.current.uniforms.uTextureSize.value = size;
           }
           if (index === 1 && programRef.current) {
               const size = isVideo ? [loadedMedia.videoWidth, loadedMedia.videoHeight] : [loadedMedia.naturalWidth, loadedMedia.naturalHeight];
               programRef.current.uniforms.uTextureSize2.value = size;
           }
           handleResize(); // Adjust layout
        };

        if (isVideo) {
            element.muted = true; element.loop = true; element.playsInline = true;
            element.autoplay = false; element.preload = 'metadata';
            element.onloadedmetadata = () => updateTextureAndSize(element);
            element.src = media.src;
            element.load();
        } else {
            element.onload = () => updateTextureAndSize(element);
            element.onerror = () => console.error("Failed to load image:", media.src);
            element.src = media.src;
        }
      });

      // --- Program Setup ---
      program = new Program(gl, {
        vertex: vertexShader,
        fragment: fragmentShader,
        uniforms: {
          uStart: { value: 0 }, // Animated by scroll
          uEnd: { value: 0 }, // Animated by scroll
          uPos: { value: 0 }, // Not used in provided shaders?
          uChange: { value: 0 }, // Animated by scroll
          tMap: { value: textures[0] }, // First texture
          tMap2: { value: textures[1] }, // Second texture
          uCover: { value: new Vec2(1, 1) }, // Placeholder
          uTextureSize: { value: new Vec2(1, 1) }, // Placeholder
          uTextureSize2: { value: new Vec2(1, 1) }, // Placeholder
        },
        transparent: true, // Likely needed
      });
      programRef.current = program;

      mesh = new Mesh(gl, { geometry, program });
      meshRef.current = mesh; // No scene needed, rendering mesh directly

      // --- GSAP Timeline for Scroll (based on 🎢/base.js animctr) ---
      // This timeline maps scroll progress (0-1) to the uniforms controlling the transition
      const tl = gsap.timeline({ paused: true });
      const numTransitions = textures.length - 1;
      if (numTransitions > 0) {
          const segmentDuration = 1 / numTransitions; // Duration per transition in the timeline

          textures.forEach((_, i) => {
              if (i < numTransitions) {
                  const startTime = i * segmentDuration;
                  const halfway = startTime + segmentDuration * 0.5; // Midpoint for texture swap

                  // Animate uniforms for the transition between texture i and i+1
                  tl.add(() => { // Callback to swap textures at the right time
                      if (programRef.current && texturesRef.current[i] && texturesRef.current[i+1]) {
                          programRef.current.uniforms.tMap.value = texturesRef.current[i];
                          programRef.current.uniforms.tMap2.value = texturesRef.current[i+1];
                          // Update texture sizes
                          const size1 = texturesRef.current[i].image ? (texturesRef.current[i].image.videoWidth ? [texturesRef.current[i].image.videoWidth, texturesRef.current[i].image.videoHeight] : [texturesRef.current[i].image.naturalWidth, texturesRef.current[i].image.naturalHeight]) : [1,1];
                          const size2 = texturesRef.current[i+1].image ? (texturesRef.current[i+1].image.videoWidth ? [texturesRef.current[i+1].image.videoWidth, texturesRef.current[i+1].image.videoHeight] : [texturesRef.current[i+1].image.naturalWidth, texturesRef.current[i+1].image.naturalHeight]) : [1,1];
                          programRef.current.uniforms.uTextureSize.value = size1;
                          programRef.current.uniforms.uTextureSize2.value = size2;
                          setCurrentTextureIndex(i); // Update state for video playback
                          console.log(`Transitioning ${i} -> ${i+1}`);
                      }
                  }, startTime); // Execute swap right at the start of the segment

                  // Animate uChange (0 to 1 controls the mix)
                  tl.fromTo(programRef.current.uniforms.uChange, { value: 0 }, { value: 1, duration: segmentDuration * 0.6, ease: 'power2.inOut' }, startTime + segmentDuration * 0.4); // Match legacy timing offset
                  // Animate uStart (controls distortion for texture 1)
                  tl.fromTo(programRef.current.uniforms.uStart, { value: 0 }, { value: 0.4, duration: segmentDuration * 0.6, ease: 'power2.inOut' }, startTime + segmentDuration * 0.4);
                  // Animate uEnd (controls distortion for texture 2)
                  tl.fromTo(programRef.current.uniforms.uEnd, { value: 0.4 }, { value: 0, duration: segmentDuration * 0.6, ease: 'power2.inOut' }, startTime + segmentDuration * 0.4);
              }
          });
      }
      animationTimelineRef.current = tl;

      console.log('Roll Initialized');

    } catch (e) { console.error("Error initializing Roll:", e); }

    // Cleanup
    return () => {
      isMountedRef.current = false;
      cancelAnimationFrame(rafIdRef.current);
      animationTimelineRef.current?.kill();
      mesh?.geometry?.dispose();
      program?.gl?.deleteProgram(program.program);
      texturesRef.current.forEach(t => t?.dispose());
      texturesRef.current = [];
      renderer?.dispose();
      console.log("Roll Cleanup");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, mediaSources, mediaElementRefs]); // Re-init if sources change

  // --- Resize Handler ---
  const handleResize = useCallback(() => {
    const renderer = rendererRef.current;
    const program = programRef.current;
    const canvas = canvasRef.current;
    const parentContainer = canvasContainerRef?.current; // Use the dedicated container
    const triggerElement = scrollTriggerRef?.current;
    if (!renderer || !program || !parentContainer || !triggerElement) return;

    const width = parentContainer.offsetWidth;
    const height = parentContainer.offsetHeight;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    renderer.setSize(width, height);

    program.uniforms.uCover.value = [width, height]; // Update cover uniform

    // Recalculate scroll trigger points (based on 🎢/position.js onResize)
    const bound = triggerElement.getBoundingClientRect();
    const screenH = window.innerHeight;
    // Use trigger element's height for limit calculation
    scrollControlRef.current.start = parseInt(bound.top + window.scrollY - screenH); // When top enters bottom
    scrollControlRef.current.limit = bound.height + screenH; // Total scroll distance

  }, [canvasContainerRef, scrollTriggerRef]); // Depend on container refs

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // --- IO and Active State ---
  useEffect(() => {
    if (isInView && !isActive) {
      setIsActive(true);
      // Play the *currently relevant* videos when entering view
      const currentTex = texturesRef.current[currentTextureIndex];
      const nextTex = texturesRef.current[currentTextureIndex + 1];
      if (currentTex?.image?.tagName === 'VIDEO') currentTex.image.play().catch(e=>console.warn("Vid play fail"));
      if (nextTex?.image?.tagName === 'VIDEO') nextTex.image.play().catch(e=>console.warn("Vid play fail"));
      console.log('Roll activated');
    } else if (!isInView && isActive) {
      setIsActive(false);
      // Pause all videos when leaving view
      texturesRef.current.forEach(tex => {
          if (tex?.image?.tagName === 'VIDEO') tex.image.pause();
      });
      console.log('Roll deactivated');
    }
  }, [isInView, isActive, currentTextureIndex]); // React to IO and current texture index

  // --- Render Loop ---
  useEffect(() => {
    if (!isMountedRef.current) return;

    const renderLoop = () => {
      rafIdRef.current = requestAnimationFrame(renderLoop);
      if (!isActive || !rendererRef.current || !meshRef.current || !programRef.current || !isMountedRef.current) {
          return; // Stop if inactive or unmounted
      }

      // Update scroll animation progress
      if (scrollControlRef.current.stop !== 1) {
        const y = currentScrollY.current;
        const { start, limit, lerp: scrollLerp, timeline } = scrollControlRef.current;
        const currentRelative = y - start;
        scrollControlRef.current.target = clamp(0, limit, currentRelative) / limit;
        // Lerp the progress for smoother visual transition
        scrollControlRef.current.current = lerp(scrollControlRef.current.current, scrollControlRef.current.target, scrollLerp);
        timeline?.progress(scrollControlRef.current.current); // Update GSAP timeline
      }

      // Update video textures if needed
      const currentTex = texturesRef.current[currentTextureIndex];
      const nextTex = texturesRef.current[currentTextureIndex + 1];
      if (currentTex?.image?.tagName === 'VIDEO' && currentTex.image.readyState >= currentTex.image.HAVE_ENOUGH_DATA) {
          currentTex.needsUpdate = true;
      }
      if (nextTex?.image?.tagName === 'VIDEO' && nextTex.image.readyState >= nextTex.image.HAVE_ENOUGH_DATA) {
          nextTex.needsUpdate = true;
      }

      // Render this mesh
      rendererRef.current.render({ scene: meshRef.current });
    };

    if (isActive) {
      rafIdRef.current = requestAnimationFrame(renderLoop);
    }

    return () => {
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [isActive, currentTextureIndex]); // Rerun loop logic if active state or texture index changes

  // Render the dedicated canvas for this effect
  return (
    <canvas
      ref={canvasRef}
      className={`${styles.canvasElement} ${className}`}
      style={{
         // Let parent control layout
         position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
         opacity: isActive ? 1 : 0, // Simple fade based on IO
         transition: 'opacity 0.6s ease',
      }}
    />
  );
}
