// components/webgl/effects/Loader.jsx
'use client';

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback } from 'react';
import { Renderer, Program, Mesh, Triangle, Vec2 } from 'ogl';
import gsap from 'gsap';
import styles from './Loader.module.pcss';
import fragmentShader from '@/shaders/loader/main.frag.glsl';
import vertexShader from '@/shaders/loader/main.vert.glsl';h

// Replicate logic derived from gl🌊🌊🌊/⌛️/position.js
// These functions are now part of the component's scope or helper functions
function useLoaderPositionLogic(programRef, animationRef) {
  const [activeState, setActiveState] = useState(-1); // -1: initial, 0: stopped, 1: active

  // check function logic (from position.js) - This seems unused for the Loader
  // based on base.js, which doesn't call check() but directly plays animstart
  const check = useCallback((entry) => {
    // In the original Loader base.js, interaction/IO check wasn't used to start/stop
    // The animation 'animstart' is played explicitly.
    // If IO were needed, this logic would go here.
    console.warn("Loader: check() called, but original likely didn't use IO check.");
    return false;
  }, []);

  // start function logic (from position.js)
  const start = useCallback(() => {
    // The primary action is playing the GSAP timeline, handled externally via playFadeOut ref
    // This function might just set the internal active state if needed.
    if (activeState === 1) return false;
    setActiveState(1);
    console.log("Loader: start() called (sets internal active state).");
  }, [activeState]);

  // stop function logic (from position.js)
  const stop = useCallback(() => {
    if (activeState === 0) return false;
     animationRef.current?.pause(); // Pause GSAP timeline if stop is called
    setActiveState(0);
     console.log("Loader: stop() called (pauses animation, sets internal state).");
  }, [activeState, animationRef]);

  // updateX/updateY/updateScale logic (from position.js)
  // These seem irrelevant for the full-screen loader effect which uses a Triangle geometry
  // and likely doesn't change position/scale based on external X/Y updates.
  const updateX = useCallback((x = 0) => {}, []);
  const updateY = useCallback((y = 0) => {}, []);
  const updateScale = useCallback(() => {}, []);

  return { activeState, check, start, stop, updateX, updateY, updateScale };
}


// --- Component ---
const Loader = forwardRef(({ onFadeOutComplete }, ref) => {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const meshRef = useRef(null);
  const programRef = useRef(null);
  const animationRef = useRef(null); // GSAP timeline for fade-out
  const glRef = useRef(null);
  const rafIdRef = useRef(null); // Ref for requestAnimationFrame ID

  // Use state and logic derived from position.js
  const { activeState, start, stop } = useLoaderPositionLogic(programRef, animationRef);
  const [isMounted, setIsMounted] = useState(false); // Track mount status for RAF

  // Expose playFadeOut to parent
  useImperativeHandle(ref, () => ({
    playFadeOut: () => {
      if (animationRef.current) {
        console.log("Playing Loader fade out animation...");
        animationRef.current.play();
        // Optionally call stop() to set internal state if needed, though fade-out means it's ending anyway
        // stop();
      } else {
        console.warn("Loader fade out called before animation ready.");
        if (onFadeOutComplete) onFadeOutComplete();
      }
    }
  }));

  // Initialize WebGL and GSAP Timeline
  useEffect(() => {
    if (!canvasRef.current) return;
    setIsMounted(true); // Component is mounted

    let renderer;
    let mesh;
    let program;
    let geometry;
    let tl;

    try {
      // --- Setup derived from base.js constructor and els.js loader ---
      renderer = new Renderer({
        canvas: canvasRef.current,
        alpha: true, dpr: Math.min(window.devicePixelRatio, 2),
        width: window.innerWidth, height: window.innerHeight,
      });
      const gl = renderer.gl;
      glRef.current = gl;
      rendererRef.current = renderer;

      geometry = new Triangle(gl); // Correct geometry

      program = new Program(gl, {
        vertex: vertexShader, // <<< USE THE VERTEX SHADER CODE
        fragment: fragmentShader, // <<< USE THE FRAGMENT SHADER CODE
        uniforms: { // Uniforms from ⌛️/🧪main.glsl and timeline targets
          uTime: { value: 0 },
          uStart0: { value: 0 }, uStart1: { value: 0.5 }, uStart2: { value: 1 },
          uStartX: { value: 0 }, uStartY: { value: 0.1 },
          uMultiX: { value: -0.4 }, uMultiY: { value: 0.45 },
          uResolution: { value: [gl.canvas.offsetWidth, gl.canvas.offsetHeight] },
        },
        transparent: true,
      });
      programRef.current = program;

      mesh = new Mesh(gl, { geometry, program });
      meshRef.current = mesh;

      // --- GSAP Timeline setup from base.js initEvents ---
      tl = gsap.timeline({
        paused: true,
        onComplete: () => {
          if (canvasRef.current) canvasRef.current.style.display = 'none'; // Hide canvas
           if (onFadeOutComplete) onFadeOutComplete();
        }
      })
      .fromTo(program.uniforms.uStart0, { value: 0 }, { value: 1, duration: 0.6, ease: 'power2.inOut' }, 0)
      .fromTo(program.uniforms.uStartX, { value: 0 }, { value: -0.1, duration: 2, ease: 'power2.inOut' }, 0)
      .fromTo(program.uniforms.uMultiX, { value: -0.4 }, { value: 0.1, duration: 2, ease: 'power2.inOut' }, 0)
      .fromTo(program.uniforms.uStartY, { value: 0.1 }, { value: 0.95, duration: 2, ease: 'power2.inOut' }, 0)
      .fromTo(program.uniforms.uMultiY, { value: 0.45 }, { value: 0.3, duration: 2, ease: 'power2.inOut' }, 0)
      .fromTo(program.uniforms.uStart2, { value: 1 }, { value: 0, duration: 1, ease: 'power2.inOut' }, 0.6);
      tl.timeScale(1.4);
      animationRef.current = tl;

      // Trigger the 'start' logic from position.js conceptually
      start(); // Sets internal activeState=1

    } catch (e) {
      console.error("Failed to initialize Loader WebGL:", e);
       if (onFadeOutComplete) onFadeOutComplete();
    }

    // Cleanup
    return () => {
      setIsMounted(false); // Component unmounting
      cancelAnimationFrame(rafIdRef.current); // Stop RAF loop
      tl?.kill();
      // Use optional chaining for safety during cleanup
      mesh?.geometry?.dispose();
      program?.gl?.deleteProgram(program.program);
      renderer?.dispose();
      console.log("Loader WebGL Cleanup");
    };
  }, [onFadeOutComplete, start]); // Include start in deps

  // Render loop (Update function from base.js)
  useEffect(() => {
    if (!isMounted) return; // Only run RAF if mounted

    const renderLoop = (time) => {
      if (!rendererRef.current || !meshRef.current || !programRef.current || !isMounted) {
         return; // Stop loop if unmounted or objects missing
      }

      // Only render if activeState is considered active (e.g., 1 or -1 initially)
      // The fade-out animation runs via GSAP, this loop might just need uTime
      if (activeState !== 0) {
          programRef.current.uniforms.uTime.value = time * 0.001; // Update time if used
          rendererRef.current.render({ scene: meshRef.current }); // Render only this mesh
      }

      rafIdRef.current = requestAnimationFrame(renderLoop);
    };

    rafIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [isMounted, activeState]); // Depend on mount status and active state

  // Resize handler
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

  return (
    <canvas
      ref={canvasRef}
      id="glLoader"
      className={styles.canvas}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        zIndex: 99, pointerEvents: 'none',
      }}
    />
  );
});

Loader.displayName = 'Loader';
export default Loader;