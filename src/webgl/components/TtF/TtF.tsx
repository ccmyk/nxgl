// src/webgl/components/TtF/TtF.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Geometry, Mesh, Program, Renderer, Text, Texture, Transform, Post, Vec2 } from 'ogl';
import { gsap } from '@/lib/gsapSetup';

import { useMSDF } from '@/webgl/hooks/useMSDF';
import { useOGLStore } from '@/webgl/stores/ogl';
import { useIO } from '@/webgl/hooks/useIO';

import fragmentSrc from './TtF.fragment.msdf.glsl?raw';
import parentSrc from './TtF.fragment.parent.glsl?raw';
import vertexSrc from './TtF.vertex.msdf.glsl?raw'; // Re-used from Tt

// Utility functions from original project
const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;
const clamp = (min: number, max: number, num: number) => Math.min(Math.max(num, min), max);

type Props = {
  id: string;
  container: HTMLElement;
  text: string;
  letterSpacing: number;
  size: number;
  white?: boolean;
  scrollTarget: HTMLElement | null; // The element whose scroll triggers the animation
};

export function TtF({ id, container, text, letterSpacing, size, white, scrollTarget }: Props) {
  const { register, unregister } = useOGLStore();
  const { png, json } = useMSDF('/fonts/msdf/PPNeueMontreal-Medium.png', '/fonts/msdf/PPNeueMontreal-Medium.json');
  
  const [isActive, setIsActive] = useState(false);
  
  // Refs for OGL objects, state, and GSAP timelines
  const rendererRef = useRef<Renderer | null>(null);
  const postRef = useRef<Post | null>(null);
  const meshRef = useRef<Mesh | null>(null);
  const interactionState = useRef({
    norm: 0,
    end: 0,
    lerp: 0.6,
    bounds: { x: 0, y: 0, width: 0, height: 0 }
  });
  const scrollState = useRef({
    current: 0,
    limit: 0,
    start: 0,
    prog: 0,
    progt: 0,
  });
  const anims = useRef<{ scroll?: gsap.core.Timeline; mouse?: gsap.core.Timeline }>({});
  const containerRef = useRef(container);
  const scrollTargetRef = useRef(scrollTarget);

  // Intersection Observer to activate/deactivate the component
  useIO(id, containerRef, (isVisible) => {
    setIsActive(isVisible);
  });

  // Main setup effect
  useEffect(() => {
    if (!containerRef.current || !png || !json) return;
    const container = containerRef.current;

    const renderer = new Renderer({ alpha: true, dpr: Math.max(window.devicePixelRatio, 2), width: container.clientWidth, height: container.clientHeight });
    rendererRef.current = renderer;
    const { gl } = renderer;
    gl.canvas.classList.add('glF');
    container.appendChild(gl.canvas);

    const cam = new Camera(gl);
    cam.position.set(0, 0, 7);

    const t = new Text({ font: json, text, align: 'center', letterSpacing, size, lineHeight: 1 });
    const geometry = new Geometry(gl, {
      position: { size: 3, data: t.buffers.position },
      uv: { size: 2, data: t.buffers.uv },
      id: { size: 1, data: t.buffers.id },
      index: { data: t.buffers.index }
    });

    const texTx = new Texture(gl, { image: png, generateMipmaps: false });
    const program = new Program(gl, {
      vertex: vertexSrc,
      fragment: fragmentSrc,
      uniforms: { uColor: { value: white ? 1 : 0 }, tMap: { value: texTx } },
      transparent: true,
      cullFace: null,
      depthWrite: false
    });

    const mesh = new Mesh(gl, { geometry, program });
    meshRef.current = mesh;
    mesh.position.y = t.height * 0.5;
    const scene = new Transform();
    mesh.setParent(scene);

    const post = new Post(gl);
    postRef.current = post;
    post.addPass({
      fragment: parentSrc,
      uniforms: {
        uTime: { value: 0 },
        uStart: { value: 0 },
        uMouseT: { value: 0 },
        uMouse: { value: 0 },
        uOut: { value: 1 }
      }
    });

    // Replicate GSAP timelines from the original class
    anims.current.scroll = gsap.timeline({ paused: true })
      .fromTo(post.passes[0].program.uniforms.uTime, { value: 0 }, { value: 2, duration: 0.3, ease: 'power2.inOut' })
      .fromTo(post.passes[0].program.uniforms.uTime, { value: 2 }, { value: 0, duration: 0.3, ease: 'power2.inOut' }, '+=0.4')
      .fromTo(post.passes[0].program.uniforms.uStart, { value: 0.39 }, { value: 0.8, duration: 1, ease: 'power2.inOut' }, 0);

    anims.current.mouse = gsap.timeline({ paused: true })
      .fromTo(post.passes[0].program.uniforms.uMouseT, { value: 0.2 }, { value: 2, duration: 0.3, ease: 'power2.inOut' }, 0.1)
      .to(post.passes[0].program.uniforms.uMouseT, { value: 0, duration: 0.3, ease: 'power2.inOut' }, '+=0.4')
      .fromTo(post.passes[0].program.uniforms.uMouse, { value: 0.39 }, { value: 0.8, duration: 0.9, ease: 'none' }, 0.1);

    const handleResize = () => {
        const rect = container.getBoundingClientRect();
        interactionState.current.bounds = rect;
        renderer.setSize(rect.width, rect.height);
        cam.perspective({ aspect: gl.canvas.clientWidth / gl.canvas.clientHeight });
        
        if (scrollTargetRef.current) {
            const scrollRect = scrollTargetRef.current.getBoundingClientRect();
            scrollState.current.start = scrollRect.top + window.scrollY - window.innerHeight + (rect.height * 0.5);
            scrollState.current.limit = scrollRect.height + (rect.height * 0.5);
        }
    };

    handleResize();

    register({
      id,
      onResize: handleResize,
      onTick: () => {
          if (!isActive) return;
          const iState = interactionState.current;
          const sState = scrollState.current;

          // Lerp mouse value for smooth shimmer
          iState.end = lerp(iState.end, iState.norm, iState.lerp);
          anims.current.mouse?.progress(iState.end);

          // Connect scroll position to animation progress
          sState.current = window.scrollY - sState.start;
          sState.current = clamp(0, sState.limit, sState.current);
          sState.progt = sState.current / sState.limit;
          sState.prog = lerp(sState.prog, sState.progt, 0.015);
          anims.current.scroll?.progress(sState.prog);

          post.render({ scene: mesh });
      }
    });

    return () => {
      unregister(id);
      renderer.gl.getExtension('WEBGL_lose_context')?.loseContext();
      gl.canvas.remove();
    };
  }, [id, png, json, text, letterSpacing, size, white, register, unregister, isActive]);

  // Interaction Effect
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    
    const handleMouseEnter = () => { interactionState.current.lerp = 0.02; };
    const handleMouseMove = (e: MouseEvent) => {
        const bounds = interactionState.current.bounds;
        let normY = (e.clientY - bounds.top) / bounds.height;
        interactionState.current.norm = clamp(0, 1, normY);
    };
    const handleMouseLeave = () => { interactionState.current.lerp = 0.01; };

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return null;
}

