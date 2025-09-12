// src/webgl/components/Tt/Tt.tsx
'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { Camera, Geometry, Mesh, Program, Text, Texture, Transform, Vec2 } from 'ogl';
import { gsap } from '@/lib/gsapSetup';
import { SplitText } from 'gsap/SplitText';

import { useOGL, useFrame } from '@/webgl/hooks/useGL';
import { useMSDF } from '@/webgl/hooks/useMSDF';
import { useIO } from '@/webgl/hooks/useIO';

import fragmentSrc from './Tt.fragment.msdf.glsl?raw';
import vertexSrc from './Tt.vertex.msdf.glsl?raw';

// Utility function for lerping, as used in the original project
const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;
const lerpArr = (a: number[], b: number[], t: number) => a.map((n, i) => lerp(n, b[i], t));

type Props = {
  id: string;
  text: string;
  letterSpacing: number;
  size: number;
  colorWhite?: boolean;
  overlay: HTMLElement | null; // The DOM element for capturing mouse events
};

export function Tt({ id, text, letterSpacing, size, colorWhite, overlay }: Props) {
  const { gl } = useOGL();
  const { png, json } = useMSDF('/fonts/msdf/PPNeueMontreal-Medium.png', '/fonts/msdf/PPNeueMontreal-Medium.json');

  const [isReady, setIsReady] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // Refs for OGL objects and state that doesn't trigger re-renders
  const sceneRef = useRef<Transform>(null!);
  const camRef = useRef<Camera>(null!);
  const meshRef = useRef<Mesh>(null!);
  const programRef = useRef<Program>(null!);
  const interactionState = useRef({
    norm: [0, 0],
    end: [0, 0],
    lerp: 0.6,
    positionTarget: new Array(text.length).fill(0.5),
    positionCurrent: new Array(text.length).fill(0.5),
    charData: { widths: [] as number[], positions: [] as number[] },
  });
  const anims = useRef<{ in?: gsap.core.Timeline; out?: gsap.core.Timeline; start?: gsap.core.Timeline }>({});
  const overlayRef = useRef(overlay);

  // Memoize shaders to prevent re-creation
  const shaders = useMemo(() => {
    if (!fragmentSrc) return null;
    return {
      vertex: vertexSrc,
      fragment: fragmentSrc.replaceAll('PITO', String(text.length)),
    };
  }, [text.length]);
  
  // -- Intersection Observer Hook --
  // Replicates the `start()` and `stop()` logic from `position.js`
  useIO(id, overlayRef, (isVisible) => {
    if (isVisible && !isActive) {
      setIsActive(true);
      anims.current.start?.play();
    } else if (!isVisible && isActive) {
      setIsActive(false);
      // Optional: Add logic from original `stop()` if needed, like reversing animation
    }
  });


  // -- Main Setup Effect --
  // Replicates the `constructor` logic
  useEffect(() => {
    if (!gl || !shaders || !png || !json || !overlay) return;

    sceneRef.current = new Transform();
    camRef.current = new Camera(gl, { aspect: gl.canvas.clientWidth / gl.canvas.clientHeight });
    camRef.current.position.set(0, 0, 7);

    const t = new Text({ font: json, text, align: 'center', letterSpacing, size, lineHeight: 1 });
    const geometry = new Geometry(gl, {
      position: { size: 3, data: t.buffers.position },
      uv: { size: 2, data: t.buffers.uv },
      id: { size: 1, data: t.buffers.id },
      index: { data: t.buffers.index },
    });

    const texTx = new Texture(gl, { image: png, generateMipmaps: false });
    const program = new Program(gl, {
      ...shaders,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: colorWhite ? 1 : 0 },
        uPower: { value: 0 }, // Starts at 0, animated by GSAP
        uPowers: { value: interactionState.current.positionCurrent },
        uCols: { value: 1.5 },
        uStart: { value: 1 }, // Starts at 1, animated by GSAP
        uKey: { value: -2 },
        tMap: { value: texTx },
        uMouse: { value: new Vec2(0, 0) },
      },
      transparent: true,
      cullFace: null,
      depthWrite: false,
    });
    programRef.current = program;

    meshRef.current = new Mesh(gl, { geometry, program });
    meshRef.current.position.y = t.height * 0.58;
    meshRef.current.setParent(sceneRef.current);

    // Replicate GSAP animations from `initEvents` and `start`
    anims.current.in = gsap.timeline({ paused: true }).to(program.uniforms.uPower, { value: 1, duration: 0.36, ease: 'power4.inOut' });
    anims.current.out = gsap.timeline({ paused: true }).to(program.uniforms.uPower, { value: 0, duration: 0.6, ease: 'none', onComplete: () => { program.uniforms.uKey.value = -1; } });
    anims.current.start = gsap.timeline({ paused: true })
      .fromTo(program.uniforms.uStart, { value: 1 }, { value: 0, duration: 0.8, ease: 'power4.inOut' })
      .fromTo(program.uniforms.uPower, { value: 0.5 }, { value: 0, duration: 2, ease: 'power2.inOut' }, 0)
      .set(program.uniforms.uKey, { value: -1, onComplete: () => { overlay.classList.add('act'); } }, ">");

    setIsReady(true);
    
    return () => {
      program.remove();
      geometry.remove();
    };
  }, [gl, shaders, png, json, text, letterSpacing, size, colorWhite, overlay]);


  // -- Interaction and Sizing Effect --
  // Replicates `getChars`, `calcChars`, and mouse event listeners
  useEffect(() => {
    if (!isReady || !overlay || !programRef.current) return;

    const st = new SplitText(overlay, { type: 'chars', charsClass: 'char' });
    
    const getChars = () => {
        let totalW = 0;
        interactionState.current.charData.widths = [];
        interactionState.current.charData.positions = [];
        st.chars.forEach(char => {
            const width = char.clientWidth;
            interactionState.current.charData.widths.push(width);
            interactionState.current.charData.positions.push(totalW);
            totalW += width;
        });
    };

    const calcChars = (x: number, out?: number) => {
        if (out !== undefined) {
            interactionState.current.positionTarget = new Array(st.chars.length).fill(out);
        } else {
            interactionState.current.positionTarget = st.chars.map((_, i) => {
                const charWidth = interactionState.current.charData.widths[i];
                const charPos = interactionState.current.charData.positions[i];
                let tot = (x - charPos) / charWidth - 0.5;
                return Math.min(Math.max(tot, -0.5), 0.5);
            });
        }
    };
    
    const handleMouseEnter = (e: MouseEvent) => {
      interactionState.current.lerp = 0.03;
      const out = e.offsetX < 60 ? -0.5 : 0.5;
      calcChars(e.offsetX, out);
      anims.current.out?.pause();
      anims.current.in?.play();
      interactionState.current.lerp = 0.06;
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      calcChars(e.offsetX);
    };

    const handleMouseLeave = (e: MouseEvent) => {
      interactionState.current.lerp = 0.03;
      const out = e.offsetX < 60 ? 0.5 : -0.5;
      calcChars(e.offsetX, out);
      anims.current.in?.pause();
    };

    const handleCharHover = (e: Event) => {
        const charIndex = st.chars.indexOf(e.currentTarget as HTMLElement);
        if (programRef.current) programRef.current.uniforms.uKey.value = charIndex;
    };

    getChars();
    const ro = new ResizeObserver(getChars);
    ro.observe(overlay);

    overlay.addEventListener('mouseenter', handleMouseEnter);
    overlay.addEventListener('mousemove', handleMouseMove);
    overlay.addEventListener('mouseleave', handleMouseLeave);
    st.chars.forEach(char => char.addEventListener('mouseenter', handleCharHover));

    return () => {
        ro.disconnect();
        overlay.removeEventListener('mouseenter', handleMouseEnter);
        overlay.removeEventListener('mousemove', handleMouseMove);
        overlay.removeEventListener('mouseleave', handleMouseLeave);
        st.chars.forEach(char => char.removeEventListener('mouseenter', handleCharHover));
        st.revert();
    };
  }, [isReady, overlay]);


  // -- Render Loop --
  useFrame(({ time }) => {
    if (!isReady || !isActive || !programRef.current) return;

    // Lerp mouse position for smooth ripple
    const state = interactionState.current;
    state.end = lerpArr(state.end, state.norm, state.lerp);
    programRef.current.uniforms.uMouse.value = [state.end[0], 0];

    // Lerp character power values for ripple effect
    state.positionCurrent = lerpArr(state.positionCurrent, state.positionTarget, state.lerp);
    programRef.current.uniforms.uPowers.value = state.positionCurrent;

    // Render the scene
    programRef.current.uniforms.uTime.value = time;
    gl.renderer.render({ scene: sceneRef.current, camera: camRef.current });
  });

  return null;
}

