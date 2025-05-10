// components/webgl/Loader.jsx
'use client';

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback } from 'react';
import { Renderer, Program, Mesh, Triangle, Vec2 } from 'ogl';
import gsap from 'gsap';
import styles from './Loader.module.pcss'; // Assuming basic styles for positioning/visibility
import fragmentShader from '@/shaders/loader/main.frag.glsl'; // Import shaders
import vertexShader from '@/shaders/loader/main.vert.glsl';

// Define the component using forwardRef to expose methods
const Loader = forwardRef(({ onFadeOutComplete }, ref) => {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const meshRef = useRef(null);
  const programRef = useRef(null);
  const animationRef = useRef(null); // GSAP timeline for fade-out
  const glRef = useRef(null);
  const rafIdRef = useRef(null);
  const isMountedRef = useRef(false); // Track mount status for RAF safety
  const [isVisible, setIsVisible] = useState(true); // Control canvas visibility

  // --- Expose playFadeOut method to parent components ---
  useImperativeHandle(ref, () => ({
    playFadeOut: () => {
      if (animationRef.current) {
        console.log("Playing Loader fade out animation...");
        animationRef.current.play();
      } else {
        console.warn("Loader fade out called before animation ready.");
        // If animation isn't ready, immediately call complete callback
        if (onFadeOutComplete) {
          onFadeOutComplete();
        }
        setIsVisible(false); // Hide immediately if animation failed to init
      }
    }
  }));

  // --- Initialize WebGL and GSAP Timeline ---
  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    isMountedRef.current = true; // Mark as mounted

    let renderer;
    let mesh;
    let program;
    let geometry;
    let tl; // GSAP Timeline

    try {
      // --- Setup derived from ⌛️/base.js constructor and els.js loader ---
      renderer = new Renderer({
        canvas: canvasRef.current,
        alpha: true, // Transparent background needed for overlay
        dpr: Math.min(window.devicePixelRatio, 2),
        width: window.innerWidth, height: window.innerHeight,
      });
      const gl = renderer.gl;
      glRef.current = gl;
      rendererRef.current = renderer;

      geometry = new Triangle(gl); // Fullscreen triangle for overlay effect

      program = new Program(gl, {
        vertex: vertexShader,
        fragment: fragmentShader,
        uniforms: { // Uniforms matching legacy loader shader and timeline
          uTime: { value: 0 },
          uStart0: { value: 0 }, // Controls mix/progress (GSAP target)
          uStart1: { value: 0.5 }, // Secondary uniform (might not be needed if not animated)
          uStart2: { value: 1 }, // Opacity control (GSAP target)
          uStartX: { value: 0 }, // Noise X offset (GSAP target)
          uStartY: { value: 0.1 }, // Noise Y offset (GSAP target)
          uMultiX: { value: -0.4 }, // Noise X multiplier (GSAP target)
          uMultiY: { value: 0.45 }, // Noise Y multiplier (GSAP target)
          uResolution: { value: new Vec2(gl.canvas.offsetWidth, gl.canvas.offsetHeight) },
        },
        transparent: true, // Needs alpha blending
        depthTest: false, // Overlay doesn't need depth testing
        depthWrite: false,
      });
      programRef.current = program;

      mesh = new Mesh(gl, { geometry, program });
      meshRef.current = mesh;

      // --- GSAP Timeline setup mirroring legacy ⌛️/base.js initEvents (animstart) ---
      tl = gsap.timeline({
        paused: true, // Start paused, will be played by parent via ref
        onComplete: () => {
          console.log("Loader fade out complete.");
          setIsVisible(false); // Hide canvas via state after animation
          if (onFadeOutComplete) {
            onFadeOutComplete();
          } // Notify parent
        }
      })
      // Replicate the animation targets and timings
      .fromTo(program.uniforms.uStart0, { value: 0 }, { value: 1, duration: 0.6, ease: 'power2.inOut' }, 0)
      .fromTo(program.uniforms.uStartX, { value: 0 }, { value: -0.1, duration: 2, ease: 'power2.inOut' }, 0)
      .fromTo(program.uniforms.uMultiX, { value: -0.4 }, { value: 0.1, duration: 2, ease: 'power2.inOut' }, 0)
      .fromTo(program.uniforms.uStartY, { value: 0.1 }, { value: 0.95, duration: 2, ease: 'power2.inOut' }, 0)
      .fromTo(program.uniforms.uMultiY, { value: 0.45 }, { value: 0.3, duration: 2, ease: 'power2.inOut' }, 0)
      .fromTo(program.uniforms.uStart2, { value: 1 }, { value: 0, duration: 1, ease: 'power2.inOut' }, 0.6); // Fade out alpha
      tl.timeScale(1.4); // Match legacy speed adjustment
      animationRef.current = tl;

    } catch (e) {
      console.error("Failed to initialize Loader WebGL:", e);
      // If init fails, ensure component hides and calls complete callback
      setIsVisible(false);
      if (onFadeOutComplete) {
        onFadeOutComplete();
      }
    }

    // --- Cleanup ---
    return () => {
      isMountedRef.current = false; // Mark as unmounted
      cancelAnimationFrame(rafIdRef.current); // Stop RAF loop
      tl?.kill(); // Kill GSAP animation
      mesh?.geometry?.dispose();
      program?.gl?.deleteProgram(program.program);
      renderer?.dispose(); // Dispose OGL renderer
      console.log("Loader WebGL Cleanup");
    };
  }, [onFadeOutComplete]); // Rerun effect only if callback changes (unlikely)

  // --- Render Loop (only runs while visible and mounted) ---
  useEffect(() => {
    if (!isVisible || !isMountedRef.current) {
      return; // Only run if visible and mounted
    }

    const renderLoop = (time) => {
      // Double check refs and mount status inside the loop
      if (!isMountedRef.current || !rendererRef.current || !meshRef.current || !programRef.current) {
        cancelAnimationFrame(rafIdRef.current); // Stop if unmounted during frame
        return;
      }

      programRef.current.uniforms.uTime.value = time * 0.001; // Update time uniform
      rendererRef.current.render({ scene: meshRef.current }); // Render only the loader mesh

      rafIdRef.current = requestAnimationFrame(renderLoop); // Continue loop
    };

    rafIdRef.current = requestAnimationFrame(renderLoop); // Start loop

    return () => {
      cancelAnimationFrame(rafIdRef.current); // Stop loop on cleanup
    };
  }, [isVisible]); // Depend on isVisible and isMounted status

  // --- Resize Handler ---
   useEffect(() => {
    const handleResize = () => {
      if (rendererRef.current && programRef.current) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        rendererRef.current.setSize(width, height);
        programRef.current.uniforms.uResolution.value = [width, height];
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Run on mount

  // Render the canvas only if isVisible is true
  return isVisible ? (
    <canvas
      ref={canvasRef}
      id="glLoader" // Keep original ID if needed
      className={styles.canvasElement} // Apply module styles
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        zIndex: 99, // Ensure it's above other content
        pointerEvents: 'none', // Prevent interaction
      }}
    />
  ) : null; // Render nothing when not visible
});

Loader.displayName = 'Loader'; // Add display name for DevTools
export default Loader;
