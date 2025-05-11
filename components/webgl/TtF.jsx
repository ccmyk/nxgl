// components/webgl/TtF.jsx
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Program, Mesh, Text as OGLText, Texture, Geometry, Vec2, Post, Renderer, Transform } from 'ogl';
import gsap from 'gsap';
import { useWebGL } from '@/contexts/WebGLContext';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import fragmentShaderSource from '@/shaders/ttf/msdf.frag.glsl'; // Specific MSDF frag for TtF
import vertexShaderSource from '@/shaders/tt/msdf.vert.glsl'; // Reuse base MSDF vertex
import parentFragmentShaderSource from '@/shaders/ttf/parent.frag.glsl'; // Post-processing shader
import styles from './TtF.module.pcss';
import { lerp, clamp } from '@/lib/math';
// Assuming useLenis provides scroll progress or you pass it as a prop
// import { useLenis } from '@/hooks/useLenis';

export default function TtF({
  text = "FOOTER TITLE",
  fontJson, // REQUIRED
  fontTexture, // REQUIRED
  scrollProgress = 0, // REQUIRED: Pass scroll progress (0-1) as prop
  isVisible = true,
  interactionElementRef, // REQUIRED: Ref to the HTML element for mouse interaction (<a> tag)
  ioRefSelf, // REQUIRED: Ref for IO trigger
  align = 'center',
  letterSpacing = -0.022, // Default from legacy footer .Oi-tt
  size = 5.4, // Default from legacy footer .Oi-tt
  width = undefined, // Adjust based on legacy data-w="6" if needed
  color = 1.0, // Default white from legacy data-white="1"
  ioOptions = { threshold: 0.1 },
  className = '',
}) {
  const { gl, camera, isInitialized } = useWebGL();
  const rendererRef = useRef(null);
  const postRef = useRef(null);
  const meshRef = useRef(null);
  const programRef = useRef(null);
  const geometryRef = useRef(null);
  const textDataRef = useRef(null);
  const scrollAnimationRef = useRef(null); // GSAP timeline for scroll effect
  const hoverAnimationRef = useRef(null); // GSAP timeline for hover effect
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);

  // Interaction state for mouse hover
  const [interactionData, setInteractionData] = useState({
    mouseX: 0, // Relative mouse Y for ripple (-0.5 to 0.5)
    targetMouseX: 0,
    lerpFactor: 0.06, // Faster on hover
  });

  const [isInView] = useIntersectionObserver(ioRefSelf, ioOptions, true); // Freeze once visible
  const combinedIsActive = isInitialized && isVisible && isInView;

  // --- Initialize ---
  useEffect(() => {
    if (!gl || !fontJson || !fontTexture || !isInitialized || !text || !canvasRef.current) {return;}

    let mesh, program, geometry, post, scene, renderer;

    try {
      renderer = new Renderer({
        canvas: canvasRef.current, alpha: true, dpr: Math.min(window.devicePixelRatio, 2),
        width: canvasRef.current.offsetWidth, height: canvasRef.current.offsetHeight,
      });
      rendererRef.current = renderer;
      scene = new Transform();
      sceneRef.current = scene;

      const oglText = new OGLText({ font: fontJson, text, width, align, letterSpacing, size, lineHeight: 1 });
      textDataRef.current = oglText;

      geometry = new Geometry(gl, { /* ... geometry setup like Tt ... */
         position: { size: 3, data: oglText.buffers.position },
         uv: { size: 2, data: oglText.buffers.uv },
         id: { size: 1, data: oglText.buffers.id }, // Assuming TtF shaders don't use ID
         index: { data: oglText.buffers.index },
      });
      geometry.computeBoundingBox();
      geometryRef.current = geometry;

      // Use the specific MSDF fragment shader for TtF
      program = new Program(gl, {
        vertex: vertexShaderSource, // Reuse standard MSDF vertex
        fragment: fragmentShaderSource, // Use TtF specific MSDF frag
        uniforms: {
          tMap: { value: fontTexture },
          uColor: { value: color },
        },
        transparent: true, cullFace: null, depthWrite: false,
      });
      programRef.current = program;

      mesh = new Mesh(gl, { geometry, program });
      mesh.setParent(scene);
      mesh.position.x = oglText.width * -0.5;
      mesh.position.y = oglText.height * 0.58;
      meshRef.current = mesh;

      // --- Post Processing Setup (from 🔥/base.js) ---
      post = new Post(gl);
      post.addPass({
        fragment: parentFragmentShaderSource, // The footer ripple/distort shader
        uniforms: {
          uTime: { value: 0 }, // Used by scroll animation
          uStart: { value: 0.39 }, // Scroll-controlled uniform (animated by GSAP)
          uMouseT: { value: 0 }, // Hover-controlled uniform (animated by GSAP)
          uMouse: { value: 0.39 }, // Hover-controlled uniform (animated by GSAP)
          uOut: { value: 1.0 }, // Reveal/Hide uniform
        },
      });
      postRef.current = post;

      // --- GSAP Timelines ---
      // Scroll-based animation (mirrors legacy animctr)
      scrollAnimationRef.current = gsap.timeline({ paused: true })
        .fromTo(post.passes[0].uniforms.uTime, { value: 0 }, { value: 2, duration: 0.3, ease: 'power2.inOut' }, 0)
        .fromTo(post.passes[0].uniforms.uTime, { value: 2 }, { value: 0, duration: 0.3, ease: 'power2.inOut' }, 0.7)
        .fromTo(post.passes[0].uniforms.uStart, { value: 0.39 }, { value: 0.8, duration: 1, ease: 'power2.inOut' }, 0);

      // Hover animation (mirrors legacy animmouse)
      hoverAnimationRef.current = gsap.timeline({ paused: true })
        .fromTo(post.passes[0].uniforms.uMouseT, { value: 0.2 }, { value: 2, duration: 0.3, ease: 'power2.inOut' }, 0.1)
        .fromTo(post.passes[0].uniforms.uMouseT, { value: 2 }, { value: 0, duration: 0.3, ease: 'power2.inOut' }, 0.7)
        .fromTo(post.passes[0].uniforms.uMouse, { value: 0.39 }, { value: 0.8, duration: 0.9, ease: 'none' }, 0.1);

      console.log('TtF Initialized:', text);

    } catch (error) { console.error("Error initializing TtF:", text, error); }

    // Cleanup
    return () => {
      scene?.removeChild(mesh);
      program?.gl?.deleteProgram(program.program);
      geometry?.dispose();
      postRef.current = null;
      renderer?.dispose();
      scrollAnimationRef.current?.kill();
      hoverAnimationRef.current?.kill();
      console.log("TtF Cleanup:", text);
    };
  }, [gl, isInitialized, fontJson, fontTexture, text, width, align, letterSpacing, size, color]);

  // --- Resize Handler ---
  const handleResize = useCallback(() => {
    if (!rendererRef.current || !camera || !textDataRef.current || !canvasRef.current) {return;}
    const renderer = rendererRef.current;
    const canvas = canvasRef.current;
    const parentContainer = canvas.parentNode;
    if(!parentContainer) {return;}
    const width = parentContainer.offsetWidth;
    const height = parentContainer.offsetHeight;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    renderer.setSize(width, height);
    camera.perspective({ aspect: width / height });
  }, [camera]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // --- Scroll Animation ---
  useEffect(() => {
    if (scrollAnimationRef.current) {
      // Use the scrollProgress prop (0-1) to control the animation
      gsap.to(scrollAnimationRef.current, { progress: scrollProgress, duration: 0.1, ease: 'none' });
    }
  }, [scrollProgress]);

  // --- Hover Interaction ---
  useEffect(() => {
    const interactionNode = interactionElementRef?.current; // The <a> tag
    if (!interactionNode || !hoverAnimationRef.current) {return;}

    const handleMouseEnter = () => hoverAnimationRef.current.play();
    const handleMouseLeave = () => hoverAnimationRef.current.reverse();

    interactionNode.addEventListener('mouseenter', handleMouseEnter);
    interactionNode.addEventListener('mouseleave', handleMouseLeave);
    // Add touch equivalents if needed

    return () => {
      interactionNode.removeEventListener('mouseenter', handleMouseEnter);
      interactionNode.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [interactionElementRef]);

  // --- Reveal/Hide Animation ---
  useEffect(() => {
     if (!postRef.current) {return;}
     // Use combinedIsActive to control the main reveal/hide (uOut uniform)
     gsap.to(postRef.current.passes[0].uniforms.uOut, {
         value: combinedIsActive ? 1.0 : -0.2, // Animate to -0.2 to hide (from legacy removeEvents)
         duration: combinedIsActive ? 0.8 : 1.0, // Adjust durations as needed
         ease: 'power2.inOut',
         delay: combinedIsActive ? 0.2 : 0, // Delay reveal slightly
         onStart: () => { if (combinedIsActive && canvasRef.current) {canvasRef.current.style.opacity = 1;} },
         onComplete: () => { if (!combinedIsActive && canvasRef.current) {canvasRef.current.style.opacity = 0;} }
     });
  }, [combinedIsActive]);


  // --- Render Loop ---
  useEffect(() => {
    if (!isInitialized || !rendererRef.current || !sceneRef.current || !camera || !postRef.current) {return;}
    let rafId;
    const render = (time) => {
      if (!rendererRef.current) { cancelAnimationFrame(rafId); return; }
       // Update time only if needed by shaders (parent shader uses it via GSAP)
      // postRef.current.passes[0].uniforms.uTime.value = time * 0.001;
      postRef.current.render({ scene: sceneRef.current, camera: camera });
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [isInitialized, camera]);

  return <canvas ref={canvasRef} className={`${styles.canvasElement} ${className}`} style={{ opacity: 0 }} />; // Start hidden
}
