// components/webgl/Bg.jsx
'use client';

import React, { useRef, useEffect } from 'react'; // Removed useMemo as it's not used
import { Program, Mesh, Triangle, Vec2 } from 'ogl';
import gsap from 'gsap';
import { useWebGL } from '@/contexts/WebGLContext';
import fragmentShader from '@/shaders/bg/main.frag.glsl';
import vertexShader from '@/shaders/bg/main.vert.glsl';

export default function Bg({ scrollProgress = 0, onThemeChange }) { // Added onThemeChange prop
  const { gl, scene, size: screenSize, isInitialized } = useWebGL();
  const meshRef = useRef(null);
  const programRef = useRef(null);
  const animationTimelineRef = useRef(null);

  useEffect(() => {
    if (!gl || !scene || !isInitialized) return;

    let mesh;
    let program;
    let geometry;
    let localTl; // Use local variable for the timeline

    try {
      geometry = new Triangle(gl);
      program = new Program(gl, {
        vertex: vertexShader,
        fragment: fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uStart0: { value: 0 }, uStart2: { value: 1 },
          uStartX: { value: 0 }, uStartY: { value: 0.1 },
          uMultiX: { value: -0.4 }, uMultiY: { value: 0.45 },
          uResolution: { value: new Vec2(screenSize.width, screenSize.height) },
        },
        transparent: true, depthTest: false, depthWrite: false,
      });
      programRef.current = program;
      mesh = new Mesh(gl, { geometry, program });
      mesh.setParent(scene);
      meshRef.current = mesh;

      localTl = gsap.timeline({ paused: true }) // Assign to localTl
        .fromTo(program.uniforms.uStart0, { value: 0 }, { value: 1, ease: 'power2.inOut' }, 0)
        .fromTo(program.uniforms.uStartX, { value: 0 }, { value: -0.1, ease: 'power2.inOut' }, 0)
        .fromTo(program.uniforms.uMultiX, { value: -0.4 }, { value: 0.1, ease: 'power2.inOut' }, 0)
        .fromTo(program.uniforms.uStartY, { value: 0.1 }, { value: 0.95, ease: 'power2.inOut' }, 0)
        .fromTo(program.uniforms.uMultiY, { value: 0.45 }, { value: 0.3, ease: 'power2.inOut' }, 0)
        .fromTo(program.uniforms.uStart2, { value: 1 }, { value: 0, ease: 'power2.inOut' }, 0.6);
      localTl.progress(1 - scrollProgress);
      animationTimelineRef.current = localTl; // Assign to ref after creation

      // console.log('Bg component initialized');
    } catch (e) { console.error("Error initializing Bg component:", e); }

    return () => {
      animationTimelineRef.current?.kill(); // Use the ref for cleanup
      scene?.removeChild(meshRef.current); // Use ref for mesh
      programRef.current?.gl?.deleteProgram(programRef.current.program);
      geometry?.dispose();
      // console.log('Bg component cleanup');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, isInitialized, screenSize.width, screenSize.height, scrollProgress]); // Added scrollProgress to initial setup deps

  useEffect(() => {
    if (animationTimelineRef.current) {
      const progress = 1 - scrollProgress;
      animationTimelineRef.current.progress(progress);

      // Theme change logic based on scroll progress
      if (onThemeChange) {
        // Example thresholds: when the background is mostly "on" (noise visible)
        // uStart0 goes from 0 (fully visible noise) to 1 (solid/faded)
        // uStart2 goes from 1 (fully opaque) to 0 (transparent)
        // The animation timeline progress is inverted (1-scrollProgress)
        // So, when timeline progress is low (e.g., < 0.5, meaning scrollProgress > 0.5),
        // the background effect is prominent.
        const uStart0Value = programRef.current?.uniforms.uStart0.value || 0;
        const uStart2Value = programRef.current?.uniforms.uStart2.value || 0;

        // Determine theme based on uniform values (adjust thresholds as needed)
        // This is a simplified example; you might need more nuanced logic
        if (uStart0Value < 0.6 && uStart2Value > 0.4) { // More noise, more opaque
            onThemeChange('dark'); // Assuming dark theme for when noise is visible
        } else {
            onThemeChange('light');
        }
      }
    }
  }, [scrollProgress, onThemeChange]); // Added onThemeChange

  useEffect(() => {
    if (programRef.current && screenSize.width && screenSize.height) {
      programRef.current.uniforms.uResolution.value = [screenSize.width, screenSize.height];
    }
  }, [screenSize]);

  useEffect(() => {
     let rafId;
     const update = (time) => {
         if (programRef.current) {
             programRef.current.uniforms.uTime.value = time * 0.001;
         }
         rafId = requestAnimationFrame(update);
     };
     rafId = requestAnimationFrame(update);
     return () => cancelAnimationFrame(rafId);
  }, []);

  return null;
}
