// components/webgl/TtA.jsx
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Program, Mesh, Text as OGLText, Texture, Geometry, Vec2, Post, Renderer, Transform } from 'ogl';
import gsap from 'gsap';
import { useWebGL } from '@/contexts/WebGLContext';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import fragmentShaderSource from '@/shaders/tta/msdf.frag.glsl'; // Specific MSDF frag for TtA
import vertexShaderSource from '@/shaders/tt/msdf.vert.glsl'; // Reuse base MSDF vertex shader
import parentFragmentShaderSource from '@/shaders/tta/parent.frag.glsl'; // Post-processing shader
import styles from './TtA.module.pcss';
import { lerp, clamp } from '@/lib/math';

export default function TtA({
  text = "ABOUT TITLE",
  fontJson, // REQUIRED
  fontTexture, // REQUIRED
  isVisible = true,
  ioRefSelf, // REQUIRED
  align = 'center',
  letterSpacing = -0.024, // Default from legacy home_about .Oi-tt
  size = 3.8, // Default from legacy home_about .Oi-tt
  width = undefined,
  color = 1.0, // Default white from legacy data-white="1"
  animationParams = { durationIn: 0.8 }, // Based on 👩‍⚖️/position.js start() -> animstart
  ioOptions = { threshold: 0.1 },
  className = '',
}) {
  const { gl, camera, isInitialized, size: webglSize } = useWebGL();
  // TtA manages its own rendering target and post-processing
  const rendererRef = useRef(null);
  const postRef = useRef(null);
  const meshRef = useRef(null);
  const programRef = useRef(null);
  const geometryRef = useRef(null);
  const textDataRef = useRef(null);
  const animationTimelineRef = useRef(null);
  const canvasRef = useRef(null); // Ref for the dedicated canvas
  const sceneRef = useRef(null); // Dedicated scene for this effect

  // Interaction state (similar to Tt, for mouse ripple)
  const [interactionData, setInteractionData] = useState({
    mouseX: 0, // Relative mouse X (-0.5 to 0.5)
    targetMouseX: 0,
    lerpFactor: 0.06,
  });

  const [isInView] = useIntersectionObserver(ioRefSelf, ioOptions, true);
  const combinedIsActive = isInitialized && isVisible && isInView;

  // --- Initialize ---
  useEffect(() => {
    if (!gl || !fontJson || !fontTexture || !isInitialized || !text || !canvasRef.current) {return;}

    let mesh, program, geometry, post, scene, renderer;

    try {
      // Create a dedicated renderer for this component's canvas
      renderer = new Renderer({
        canvas: canvasRef.current,
        alpha: true, dpr: Math.min(window.devicePixelRatio, 2),
        width: canvasRef.current.offsetWidth, height: canvasRef.current.offsetHeight,
      });
      rendererRef.current = renderer;

      scene = new Transform(); // Use a local scene
      sceneRef.current = scene;

      const oglText = new OGLText({ font: fontJson, text, width, align, letterSpacing, size, lineHeight: 1 });
      textDataRef.current = oglText;

      geometry = new Geometry(gl, { /* ... geometry setup like Tt ... */
         position: { size: 3, data: oglText.buffers.position },
         uv: { size: 2, data: oglText.buffers.uv },
         id: { size: 1, data: oglText.buffers.id }, // Assuming TtA shaders don't use ID
         index: { data: oglText.buffers.index },
      });
      geometry.computeBoundingBox();
      geometryRef.current = geometry;

      // Use the specific MSDF fragment shader for TtA
      program = new Program(gl, {
        vertex: vertexShaderSource, // Reuse standard MSDF vertex
        fragment: fragmentShaderSource, // Use TtA specific MSDF frag
        uniforms: {
          tMap: { value: fontTexture },
          uColor: { value: color }, // Use the passed color prop
        },
        transparent: true, cullFace: null, depthWrite: false,
      });
      programRef.current = program;

      mesh = new Mesh(gl, { geometry, program });
      mesh.setParent(scene);
      mesh.position.x = oglText.width * -0.5;
      mesh.position.y = oglText.height * 0.58; // Centering like Tt
      meshRef.current = mesh;

      // --- Post Processing Setup (from 👩‍⚖️/base.js) ---
      post = new Post(gl);
      post.addPass({
        fragment: parentFragmentShaderSource, // The ripple effect shader
        uniforms: {
          uTime: { value: 0.4 }, // Default from legacy base.js
          uStart: { value: -1.0 }, // Animated uniform for reveal/ripple
          uMouse: { value: -1.0 }, // Animated uniform for mouse interaction ripple
        },
      });
      postRef.current = post;

      console.log('TtA Initialized:', text);

    } catch (error) { console.error("Error initializing TtA:", text, error); }

    // Cleanup
    return () => {
      scene?.removeChild(mesh);
      program?.gl?.deleteProgram(program.program);
      geometry?.dispose();
      postRef.current = null; // Clear post ref
      renderer?.dispose(); // Dispose the dedicated renderer
      animationTimelineRef.current?.kill();
      console.log("TtA Cleanup:", text);
    };
  }, [gl, isInitialized, fontJson, fontTexture, text, width, align, letterSpacing, size, color]);

  // --- Resize Handler ---
  const handleResize = useCallback(() => {
     if (!rendererRef.current || !camera || !textDataRef.current || !canvasRef.current) {return;}

     const renderer = rendererRef.current;
     const textData = textDataRef.current;
     const canvas = canvasRef.current;
     const parentContainer = canvas.parentNode; // Assuming canvas is inside the cCover div

     if(!parentContainer) {return;}

     const width = parentContainer.offsetWidth;
     const height = parentContainer.offsetHeight;

     // Update canvas and renderer size
     canvas.style.width = `${width}px`;
     canvas.style.height = `${height}px`;
     renderer.setSize(width, height);

     // Update camera (using global camera from context for consistency)
     camera.perspective({ aspect: width / height });

     // Recalculate viewport units based on global camera
     const fov = camera.fov * (Math.PI / 180);
     const viewportHeight = 2 * Math.tan(fov / 2) * camera.position.z;
     const viewportWidth = viewportHeight * camera.aspect;

     // Optional: Update mesh scale if needed based on new viewport
     // meshRef.current.scale.set(viewportWidth * someFactor, viewportHeight * someFactor, 1);

  }, [camera]); // Depend on global camera

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // --- Interaction Handlers (Mouse Ripple) ---
  useEffect(() => {
    const interactionNode = canvasRef.current?.parentNode; // Interact with the cCover div
    if (!interactionNode || !postRef.current) {return;}

    const moveFn = (e) => {
      const rect = interactionNode.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const relativeX = (clientX - rect.left) / rect.width; // 0 to 1
      setInteractionData(prev => ({
          ...prev,
          targetMouseX: clamp(-1.0, 1.2, relativeX * 2.2 - 1.1), // Map 0-1 to -1 to 1.2 range
          lerpFactor: 0.02 // Faster lerp on move (from legacy base.js)
      }));
    };

    const leaveFn = () => {
      setInteractionData(prev => ({
          ...prev,
          targetMouseX: -1.0, // Return to default state
          lerpFactor: 0.01 // Slower lerp on leave
      }));
    };

    interactionNode.addEventListener('mousemove', moveFn);
    interactionNode.addEventListener('mouseleave', leaveFn);
    interactionNode.addEventListener('touchmove', moveFn, { passive: true });
    interactionNode.addEventListener('touchend', leaveFn);

    return () => {
      interactionNode.removeEventListener('mousemove', moveFn);
      interactionNode.removeEventListener('mouseleave', leaveFn);
      interactionNode.removeEventListener('touchmove', moveFn);
      interactionNode.removeEventListener('touchend', leaveFn);
    };
  }, []); // Run once

  // --- Lerp Mouse Interaction Uniform ---
  useEffect(() => {
      if (!postRef.current) {return;}
      const currentVal = interactionData.mouseX;
      const targetVal = interactionData.targetMouseX;
      const lerpFactor = interactionData.lerpFactor;

      if (Math.abs(currentVal - targetVal) > 0.001) {
          const newVal = lerp(currentVal, targetVal, lerpFactor);
          postRef.current.passes[0].uniforms.uMouse.value = newVal;
          setInteractionData(prev => ({ ...prev, mouseX: newVal }));
      }
  }, [interactionData]); // Run whenever interaction data changes

  // --- Reveal Animation Trigger ---
  useEffect(() => {
    if (!combinedIsActive || !postRef.current || animationTimelineRef.current?.isActive()) {return;}

    const { durationIn } = animationParams;
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(postRef.current.passes[0].uniforms.uStart,
      { value: -0.92 }, // Start value from legacy animstart
      { value: 1.0, duration: durationIn, ease: 'power2.inOut' } // End value and timing
    , 0);
    // Add canvas fade-in if needed
    tl.fromTo(canvasRef.current, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0);

    animationTimelineRef.current = tl;
    tl.play();

  }, [combinedIsActive, animationParams]);

  // --- Render Loop ---
  useEffect(() => {
      if (!isInitialized || !rendererRef.current || !sceneRef.current || !camera || !postRef.current) {return;}

      let rafId;
      const render = (time) => {
          if (!rendererRef.current) { // Check if renderer was disposed
             cancelAnimationFrame(rafId);
             return;
          }
          // Update time if needed by shaders (parent shader doesn't seem to use it)
          // postRef.current.passes[0].uniforms.uTime.value = time * 0.001;

          // Render scene through post-processing pass
          postRef.current.render({ scene: sceneRef.current, camera: camera });
          rafId = requestAnimationFrame(render);
      };
      rafId = requestAnimationFrame(render);
      return () => cancelAnimationFrame(rafId);
  }, [isInitialized, camera]); // Depend on global camera

  // Render the dedicated canvas for this effect
  return <canvas ref={canvasRef} className={`${styles.canvasElement} ${className}`} />;
}
