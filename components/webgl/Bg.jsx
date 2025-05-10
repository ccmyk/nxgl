// components/webgl/Bg.jsx
'use client';

import { useRef, useEffect } from 'react';
import { Program, Mesh, Triangle, Vec2 } from 'ogl';
import gsap from 'gsap';
import { useWebGL } from '@/contexts/WebGLContext'; // Use the shared context
import fragmentShader from '@/shaders/bg/main.frag.glsl'; // Import shaders
import vertexShader from '@/shaders/bg/main.vert.glsl';
// import { useLenis } from '@/hooks/useLenis'; // Import if getting scroll directly

// Assuming scrollProgress (0-1) is passed as a prop or from a context
export default function Bg({ scrollProgress = 0 }) {
  const { gl, scene, size: screenSize, isInitialized } = useWebGL(); // Get context
  const meshRef = useRef(null);
  const programRef = useRef(null);
  const animationTimelineRef = useRef(null); // Ref for GSAP scroll animation

  // Initialize Mesh and Program
  useEffect(() => {
    if (!gl || !scene || !isInitialized) {
      return; // Wait for GL context
    }

    let mesh;
    let program;
    let geometry;

    try {
      geometry = new Triangle(gl); // Fullscreen triangle

      program = new Program(gl, {
        vertex: vertexShader,
        fragment: fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          // Uniforms matching legacy bg/main.frag.glsl and controlled by GSAP
          uStart0: { value: 0 }, // Controls mix between noise and solid
          uStart2: { value: 1 }, // Controls overall opacity fade
          uStartX: { value: 0 },
          uStartY: { value: 0.1 },
          uMultiX: { value: -0.4 },
          uMultiY: { value: 0.45 },
          uResolution: { value: new Vec2(screenSize.width, screenSize.height) },
        },
        transparent: true, // Match legacy - likely needed for alpha blending
        depthTest: false, // Background doesn't need depth testing
        depthWrite: false,
      });
      programRef.current = program;

      mesh = new Mesh(gl, { geometry, program });
      mesh.setParent(scene); // Add to the shared scene from context
      meshRef.current = mesh;

      // --- GSAP Timeline setup from 🏜️/base.js initEvents (animstart) ---
      // This timeline will be controlled by scrollProgress prop
      const tl = gsap.timeline({ paused: true })
        .fromTo(program.uniforms.uStart0, { value: 0 }, { value: 1, ease: 'power2.inOut' }, 0)
        .fromTo(program.uniforms.uStartX, { value: 0 }, { value: -0.1, ease: 'power2.inOut' }, 0)
        .fromTo(program.uniforms.uMultiX, { value: -0.4 }, { value: 0.1, ease: 'power2.inOut' }, 0)
        .fromTo(program.uniforms.uStartY, { value: 0.1 }, { value: 0.95, ease: 'power2.inOut' }, 0)
        .fromTo(program.uniforms.uMultiY, { value: 0.45 }, { value: 0.3, ease: 'power2.inOut' }, 0)
        .fromTo(program.uniforms.uStart2, { value: 1 }, { value: 0, ease: 'power2.inOut' }, 0.6); // Fades out towards end
      // Set initial progress based on initial scroll (likely 0)
      tl.progress(1 - scrollProgress); // Inverted progress like legacy
      animationTimelineRef.current = tl;

      console.log('Bg component initialized');

    } catch (e) {
      console.error("Error initializing Bg component:", e);
    }

    // Cleanup
    return () => {
      if (tl) {
        tl.kill();
      }
      if (scene) {
        scene.removeChild(mesh);
      }
      if (program && program.gl) {
        program.gl.deleteProgram(program.program);
      }
      if (geometry) {
        geometry.dispose();
      }
      console.log('Bg component cleanup');
    };
  }, [gl, scene, isInitialized, screenSize.width, screenSize.height]); // Re-run if GL context or screen size changes

  // Update scroll-based animation progress
  useEffect(() => {
    if (animationTimelineRef.current) {
      // Progress is inverted in legacy (1 = start, 0 = end)
      animationTimelineRef.current.progress(1 - scrollProgress);
    }
  }, [scrollProgress]);

  // Update resolution uniform on resize (handled by WebGLContext resize)
  useEffect(() => {
    if (programRef.current && screenSize.width && screenSize.height) {
      programRef.current.uniforms.uResolution.value = [screenSize.width, screenSize.height];
    }
  }, [screenSize]);

  // Update time uniform (could be driven by global RAF in context, or local RAF)
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
  }, []); // Run time update continuously

  // This component doesn't render its own canvas, it uses the shared one
  return null;
}
