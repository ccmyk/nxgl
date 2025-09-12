// src/webgl/components/Loader/Loader.tsx
'use client';

import { useEffect, useRef } from 'react';
import { Geometry, Mesh, Program, Renderer, Triangle, Vec2 } from 'ogl';
import { gsap } from '@/lib/gsapSetup';

import { useOGLStore } from '@/webgl/stores/ogl';

import fragmentSrc from './Loader.fragment.glsl?raw';
import vertexSrc from './Loader.vertex.glsl?raw';

type Props = {
  id: string;
  /** A callback for when the loader's exit animation completes. */
  onLoaded: () => void;
  /** DOM element to append the canvas to. Defaults to document.body */
  appendTo?: HTMLElement | null;
};

export function Loader({ id, onLoaded, appendTo }: Props) {
  const { register, unregister } = useOGLStore();

  // Use refs for OGL objects and GSAP timelines to prevent re-creation on re-renders
  const rendererRef = useRef<Renderer | null>(null);
  const meshRef = useRef<Mesh | null>(null);
  const programRef = useRef<Program | null>(null);
  const anims = useRef<{ start?: gsap.core.Timeline; exit?: gsap.core.Timeline }>({});

  // The main setup effect, runs once on component mount.
  // This replaces the `constructor` and `initEvents` methods of the original class.
  useEffect(() => {
    const parentEl = appendTo || document.body;

    // 1. Create the Renderer and OGL objects
    const renderer = new Renderer({
      alpha: true,
      dpr: Math.min(window.devicePixelRatio, 2),
      width: window.innerWidth,
      height: window.innerHeight,
    });
    rendererRef.current = renderer;
    const { gl } = renderer;
    gl.canvas.id = 'glLoader';
    parentEl.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexSrc,
      fragment: fragmentSrc,
      uniforms: {
        uTime: { value: 0 },
        uStart0: { value: 1 },
        uStart1: { value: 0.5 },
        uStart2: { value: 1 },
        uStartX: { value: 0 },
        uStartY: { value: 0.1 },
        uMultiX: { value: -0.4 },
        uMultiY: { value: 0.45 },
        uResolution: { value: new Vec2(gl.canvas.offsetWidth, gl.canvas.offsetHeight) },
      },
    });
    programRef.current = program;

    const mesh = new Mesh(gl, { geometry, program });
    meshRef.current = mesh;

    // 2. Replicate the GSAP animation from the original `initEvents`
    anims.current.start = gsap.timeline({ paused: true })
      .fromTo(program.uniforms.uStart0, { value: 0 }, { value: 1, duration: 0.6, ease: 'power2.inOut' }, 0)
      .fromTo(program.uniforms.uStartX, { value: 0 }, { value: -0.1, duration: 2, ease: 'power2.inOut' }, 0)
      .fromTo(program.uniforms.uMultiX, { value: -0.4 }, { value: 0.1, duration: 2, ease: 'power2.inOut' }, 0)
      .fromTo(program.uniforms.uStartY, { value: 0.1 }, { value: 0.95, duration: 2, ease: 'power2.inOut' }, 0)
      .fromTo(program.uniforms.uMultiY, { value: 0.45 }, { value: 0.3, duration: 2, ease: 'power2.inOut' }, 0)
      .fromTo(program.uniforms.uStart2, { value: 1 }, { value: 0, duration: 1, ease: 'power2.inOut' }, 0.6)
      .timeScale(1.4);
      
    // 3. Create the exit animation
    anims.current.exit = gsap.timeline({
      paused: true,
      onComplete: () => {
        onLoaded(); // Signal completion to the parent
      }
    }).to(gl.canvas, {
      opacity: 0,
      duration: 0.5,
      delay: 0.2,
      ease: 'power2.inOut'
    });

    // 4. Register with the global OGL store for synchronized updates
    register({
      id,
      onTick: (time) => {
        program.uniforms.uTime.value = time || 0;
        renderer.render({ scene: mesh });
      },
      onResize: () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        program.uniforms.uResolution.value = [gl.canvas.offsetWidth, gl.canvas.offsetHeight];
      },
    });

    // 5. Start the animation
    anims.current.start.play();
    
    // The return function is the cleanup, replacing `removeEvents`
    return () => {
      unregister(id);
      anims.current.start?.kill();
      anims.current.exit?.kill();
      // Gracefully lose the WebGL context and remove the canvas
      renderer.gl.getExtension('WEBGL_lose_context')?.loseContext();
      gl.canvas.remove();
    };
  }, [id, appendTo, onLoaded, register, unregister]);
  
  // Effect to handle the exit animation
  useEffect(() => {
    // A parent component will control when the loader hides.
    // For now, we can simulate it with a timeout.
    // In a real app, this would be triggered by a state change (e.g., `isLoaded`).
    const timer = setTimeout(() => {
      anims.current.exit?.play();
    }, 3000); // Wait 3 seconds before hiding

    return () => clearTimeout(timer);
  }, []);

  return null; // This component does not render any React DOM nodes
}
